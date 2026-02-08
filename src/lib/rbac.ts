import { adminDb } from "@/lib/firebase-admin";
import { groupMembersRef, groupPassesRef, groupEditorsRef, nowIso } from "@/lib/firestore";

async function getGroup(groupId: string) {
  const snap = await adminDb.collection("groups").doc(groupId).get();
  if (!snap.exists) {
    throw new Error("NOT_FOUND");
  }
  return { id: snap.id, ...(snap.data() ?? {}) } as { ownerUserId?: string };
}

export async function requireGroupMember(userId: string, groupId: string) {
  const group = await getGroup(groupId);
  if (group.ownerUserId === userId) {
    return { userId, role: "owner" as const };
  }

  const memberSnap = await groupMembersRef(groupId).doc(userId).get();
  if (!memberSnap.exists) {
    throw new Error("FORBIDDEN");
  }
  return { userId, role: "member" as const };
}

export async function requireGroupOwner(userId: string, groupId: string) {
  const group = await getGroup(groupId);
  if (group.ownerUserId !== userId) {
    throw new Error("FORBIDDEN");
  }
  return { userId, role: "owner" as const };
}

export async function getUserPlan(userId: string): Promise<"free" | "pro" | "premium"> {
  const userSnap = await adminDb.collection("users").doc(userId).get();
  const user = userSnap.data();
  const active =
    user?.proStatus === "active" && (!user?.proExpiresAt || user?.proExpiresAt > nowIso());
  if (!active) return "free";
  if (user?.proPlan === "premium") return "premium";
  return "pro";
}

export async function isOwnerPaid(groupId: string) {
  const group = await getGroup(groupId);
  if (!group.ownerUserId) return false;
  const plan = await getUserPlan(group.ownerUserId);
  return plan === "pro" || plan === "premium";
}

export async function requireGroupEdit(userId: string, groupId: string) {
  const group = await getGroup(groupId);
  if (group.ownerUserId === userId) {
    return { userId, role: "owner" as const };
  }

  const editorSnap = await groupEditorsRef(groupId).doc(userId).get();
  const ownerPaid = await isOwnerPaid(groupId);
  if (!editorSnap.exists || !ownerPaid) {
    throw new Error("FORBIDDEN");
  }

  return { userId, role: "editor" as const };
}

export async function canUsePremium(userId: string, groupId: string) {
  const [userSnap, passSnap] = await Promise.all([
    adminDb.collection("users").doc(userId).get(),
    groupPassesRef(groupId)
      .where("active", "==", true)
      .where("expiresAt", ">", nowIso())
      .limit(1)
      .get()
  ]);

  const user = userSnap.data();
  const userProActive =
    user?.proStatus === "active" && (!user?.proExpiresAt || user?.proExpiresAt > nowIso());

  return Boolean(userProActive || !passSnap.empty);
}
