import { adminDb, fieldValue } from "@/lib/firebase-admin";
import { nowIso } from "@/lib/firestore";

export async function addUserGroup(userId: string, groupId: string) {
  const userRef = adminDb.collection("users").doc(userId);
  await userRef.set(
    {
      groupIds: fieldValue.arrayUnion(groupId),
      updatedAt: nowIso()
    },
    { merge: true }
  );
}

export async function removeUserGroup(userId: string, groupId: string) {
  const userRef = adminDb.collection("users").doc(userId);
  await userRef.set(
    {
      groupIds: fieldValue.arrayRemove(groupId),
      updatedAt: nowIso()
    },
    { merge: true }
  );
}
