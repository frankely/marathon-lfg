import "server-only";
import { randomBytes } from "node:crypto";
import { getDB } from "@/lib/cf";

export type LfgStatus = "OPEN" | "INITIATED" | "CLOSED";
export type MemberRole = "HOST" | "GUEST";
export type MemberStatus = "PENDING" | "CONFIRMED";

export type LfgMember = {
  membershipId: string;
  displayName: string;
  displayCode?: number;
  role: MemberRole;
  status: MemberStatus;
  joinedAt: number;
};

export type Lfg = {
  id: string;
  title: string;
  notes: string;
  capacity: number;
  status: LfgStatus;
  createdAt: number;
  initiatedAt?: number;
  hostMembershipId: string;
  members: LfgMember[];
};

export type CreateLfgInput = {
  title: string;
  notes?: string;
  capacity: number;
  host: { membershipId: string; displayName: string; displayCode?: number };
};

export type AddMemberInput = {
  membershipId: string;
  displayName: string;
  displayCode?: number;
};

// ---------- In-memory fallback (used in `next dev` without D1 binding) ----------

const memStore = (() => {
  const lfgs = new Map<string, Lfg>();
  return { lfgs };
})();

function memList(): Lfg[] {
  return [...memStore.lfgs.values()].sort((a, b) => b.createdAt - a.createdAt);
}

function memGet(id: string): Lfg | null {
  return memStore.lfgs.get(id) ?? null;
}

function memSave(lfg: Lfg) {
  memStore.lfgs.set(lfg.id, lfg);
}

// ---------- D1-backed implementation ----------

type LfgRow = {
  id: string;
  title: string;
  notes: string;
  capacity: number;
  status: LfgStatus;
  created_at: number;
  initiated_at: number | null;
  host_membership_id: string;
};

type MemberRow = {
  lfg_id: string;
  membership_id: string;
  display_name: string;
  display_code: number | null;
  role: MemberRole;
  status: MemberStatus;
  joined_at: number;
};

function rowsToLfg(lfg: LfgRow, members: MemberRow[]): Lfg {
  return {
    id: lfg.id,
    title: lfg.title,
    notes: lfg.notes,
    capacity: lfg.capacity,
    status: lfg.status,
    createdAt: lfg.created_at,
    initiatedAt: lfg.initiated_at ?? undefined,
    hostMembershipId: lfg.host_membership_id,
    members: members
      .map<LfgMember>((m) => ({
        membershipId: m.membership_id,
        displayName: m.display_name,
        displayCode: m.display_code ?? undefined,
        role: m.role,
        status: m.status,
        joinedAt: m.joined_at,
      }))
      .sort((a, b) => a.joinedAt - b.joinedAt),
  };
}

// ---------- Public API ----------

export async function listLfgs(): Promise<Lfg[]> {
  const db = await getDB();
  if (!db) return memList();

  const lfgRows = (await db.prepare("SELECT * FROM lfgs ORDER BY created_at DESC").all<LfgRow>()).results;
  if (lfgRows.length === 0) return [];

  const ids = lfgRows.map((r) => r.id);
  const placeholders = ids.map(() => "?").join(",");
  const memberRows = (
    await db
      .prepare(`SELECT * FROM lfg_members WHERE lfg_id IN (${placeholders})`)
      .bind(...ids)
      .all<MemberRow>()
  ).results;

  const byLfg = new Map<string, MemberRow[]>();
  for (const m of memberRows) {
    const arr = byLfg.get(m.lfg_id) ?? [];
    arr.push(m);
    byLfg.set(m.lfg_id, arr);
  }
  return lfgRows.map((r) => rowsToLfg(r, byLfg.get(r.id) ?? []));
}

export async function getLfg(id: string): Promise<Lfg | null> {
  const db = await getDB();
  if (!db) return memGet(id);

  const lfg = await db.prepare("SELECT * FROM lfgs WHERE id = ?").bind(id).first<LfgRow>();
  if (!lfg) return null;
  const members = (
    await db.prepare("SELECT * FROM lfg_members WHERE lfg_id = ?").bind(id).all<MemberRow>()
  ).results;
  return rowsToLfg(lfg, members);
}

function newId() {
  return randomBytes(8).toString("hex");
}

export async function createLfg(input: CreateLfgInput): Promise<Lfg> {
  const db = await getDB();
  const id = newId();
  const now = Date.now();
  const capacity = Math.max(2, Math.min(3, Math.floor(input.capacity)));
  const lfg: Lfg = {
    id,
    title: input.title.slice(0, 80) || "Unnamed Run",
    notes: (input.notes ?? "").slice(0, 280),
    capacity,
    status: "OPEN",
    createdAt: now,
    hostMembershipId: input.host.membershipId,
    members: [
      {
        membershipId: input.host.membershipId,
        displayName: input.host.displayName,
        displayCode: input.host.displayCode,
        role: "HOST",
        status: "CONFIRMED",
        joinedAt: now,
      },
    ],
  };

  if (!db) {
    memSave(lfg);
    return lfg;
  }

  await db
    .prepare(
      `INSERT INTO lfgs (id, title, notes, capacity, status, created_at, host_membership_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(lfg.id, lfg.title, lfg.notes, lfg.capacity, lfg.status, lfg.createdAt, lfg.hostMembershipId)
    .run();

  await db
    .prepare(
      `INSERT INTO lfg_members
        (lfg_id, membership_id, display_name, display_code, role, status, joined_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      lfg.id,
      input.host.membershipId,
      input.host.displayName,
      input.host.displayCode ?? null,
      "HOST",
      "CONFIRMED",
      now,
    )
    .run();

  return lfg;
}

export async function joinLfg(id: string, member: AddMemberInput): Promise<Lfg> {
  const lfg = await getLfg(id);
  if (!lfg) throw new Error("LFG not found");
  if (lfg.status !== "OPEN") throw new Error("LFG is not accepting new members");
  if (lfg.members.some((m) => m.membershipId === member.membershipId)) return lfg;
  if (lfg.members.length >= lfg.capacity) throw new Error("LFG is full");

  const now = Date.now();
  const newMember: LfgMember = {
    membershipId: member.membershipId,
    displayName: member.displayName,
    displayCode: member.displayCode,
    role: "GUEST",
    status: "PENDING",
    joinedAt: now,
  };

  const db = await getDB();
  if (!db) {
    lfg.members.push(newMember);
    memSave(lfg);
    return lfg;
  }

  await db
    .prepare(
      `INSERT INTO lfg_members
        (lfg_id, membership_id, display_name, display_code, role, status, joined_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      newMember.membershipId,
      newMember.displayName,
      newMember.displayCode ?? null,
      "GUEST",
      "PENDING",
      now,
    )
    .run();

  return (await getLfg(id))!;
}

export async function leaveLfg(id: string, membershipId: string): Promise<Lfg | null> {
  const lfg = await getLfg(id);
  if (!lfg) return null;
  if (lfg.hostMembershipId === membershipId) {
    // Host leaving == close the LFG.
    await deleteLfg(id);
    return null;
  }
  const db = await getDB();
  if (!db) {
    lfg.members = lfg.members.filter((m) => m.membershipId !== membershipId);
    memSave(lfg);
    return lfg;
  }
  await db
    .prepare("DELETE FROM lfg_members WHERE lfg_id = ? AND membership_id = ?")
    .bind(id, membershipId)
    .run();
  return await getLfg(id);
}

export async function kickMember(id: string, membershipId: string): Promise<Lfg | null> {
  const lfg = await getLfg(id);
  if (!lfg) return null;
  if (lfg.hostMembershipId === membershipId) throw new Error("Cannot kick the host");
  const db = await getDB();
  if (!db) {
    lfg.members = lfg.members.filter((m) => m.membershipId !== membershipId);
    memSave(lfg);
    return lfg;
  }
  await db
    .prepare("DELETE FROM lfg_members WHERE lfg_id = ? AND membership_id = ?")
    .bind(id, membershipId)
    .run();
  return await getLfg(id);
}

export async function deleteLfg(id: string): Promise<void> {
  const db = await getDB();
  if (!db) {
    memStore.lfgs.delete(id);
    return;
  }
  await db.prepare("DELETE FROM lfg_members WHERE lfg_id = ?").bind(id).run();
  await db.prepare("DELETE FROM lfgs WHERE id = ?").bind(id).run();
}

/**
 * Marks the LFG as INITIATED and flips all PENDING guests to CONFIRMED.
 * No external API calls — friend requests are handled manually by the host
 * via bungie.net (the BnetWrite scope required for programmatic Friends/Add
 * is reserved for first-party Bungie apps).
 */
export async function markInitiated(id: string): Promise<Lfg> {
  const lfg = await getLfg(id);
  if (!lfg) throw new Error("LFG not found");
  const now = Date.now();
  const db = await getDB();

  if (!db) {
    lfg.status = "INITIATED";
    lfg.initiatedAt = now;
    for (const m of lfg.members) {
      if (m.role === "GUEST" && m.status === "PENDING") m.status = "CONFIRMED";
    }
    memSave(lfg);
    return lfg;
  }

  await db
    .prepare("UPDATE lfgs SET status = 'INITIATED', initiated_at = ? WHERE id = ?")
    .bind(now, id)
    .run();
  await db
    .prepare(
      "UPDATE lfg_members SET status = 'CONFIRMED' WHERE lfg_id = ? AND role = 'GUEST' AND status = 'PENDING'",
    )
    .bind(id)
    .run();

  return (await getLfg(id))!;
}

export function isUsingD1(): Promise<boolean> {
  return getDB().then((db) => db !== null);
}

// ---------- Account-deletion helpers ----------

export type UserDataCounts = {
  hosted: number;       // # of contracts the user hosts (all members purged with them)
  memberships: number;  // # of contracts where user is a guest (only their row removed)
};

export async function countUserData(membershipId: string): Promise<UserDataCounts> {
  const db = await getDB();
  if (!db) {
    let hosted = 0;
    let memberships = 0;
    for (const lfg of memStore.lfgs.values()) {
      if (lfg.hostMembershipId === membershipId) {
        hosted++;
      } else if (lfg.members.some((m) => m.membershipId === membershipId)) {
        memberships++;
      }
    }
    return { hosted, memberships };
  }
  const hostedRow = await db
    .prepare("SELECT COUNT(*) AS c FROM lfgs WHERE host_membership_id = ?")
    .bind(membershipId)
    .first<{ c: number }>();
  const memberRow = await db
    .prepare(
      "SELECT COUNT(*) AS c FROM lfg_members WHERE membership_id = ? AND role != 'HOST'",
    )
    .bind(membershipId)
    .first<{ c: number }>();
  return {
    hosted: hostedRow?.c ?? 0,
    memberships: memberRow?.c ?? 0,
  };
}

/**
 * Hard-delete all data tied to a Bungie membership ID:
 *  - Every contract the user hosts (and all members on those contracts)
 *  - Every guest-membership row in any other contract
 *
 * Idempotent. Returns the actual counts removed for confirmation messaging.
 */
export async function deleteAllUserData(
  membershipId: string,
): Promise<UserDataCounts> {
  const db = await getDB();
  if (!db) {
    let hosted = 0;
    let memberships = 0;
    for (const [id, lfg] of memStore.lfgs) {
      if (lfg.hostMembershipId === membershipId) {
        memStore.lfgs.delete(id);
        hosted++;
      }
    }
    for (const lfg of memStore.lfgs.values()) {
      const before = lfg.members.length;
      lfg.members = lfg.members.filter((m) => m.membershipId !== membershipId);
      if (lfg.members.length < before) memberships++;
    }
    return { hosted, memberships };
  }

  // Count first so we can report accurate numbers post-delete.
  const counts = await countUserData(membershipId);

  // Drop everything they host (members first to be defensive about FK enforcement).
  const hostedRows = (
    await db
      .prepare("SELECT id FROM lfgs WHERE host_membership_id = ?")
      .bind(membershipId)
      .all<{ id: string }>()
  ).results;
  for (const r of hostedRows) {
    await db.prepare("DELETE FROM lfg_members WHERE lfg_id = ?").bind(r.id).run();
    await db.prepare("DELETE FROM lfgs WHERE id = ?").bind(r.id).run();
  }
  // Drop their guest rows in any contracts they joined.
  await db
    .prepare("DELETE FROM lfg_members WHERE membership_id = ?")
    .bind(membershipId)
    .run();

  return counts;
}
