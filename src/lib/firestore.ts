import { adminDb } from "@/lib/firebase-admin";

export const collections = {
  users: "users",
  groups: "groups"
};

export function groupMembersRef(groupId: string) {
  return adminDb.collection(collections.groups).doc(groupId).collection("members");
}

export function groupExpensesRef(groupId: string) {
  return adminDb.collection(collections.groups).doc(groupId).collection("expenses");
}

export function groupSettlementsRef(groupId: string) {
  return adminDb.collection(collections.groups).doc(groupId).collection("settlements");
}

export function groupEditorsRef(groupId: string) {
  return adminDb.collection(collections.groups).doc(groupId).collection("editors");
}

export function groupPassesRef(groupId: string) {
  return adminDb.collection(collections.groups).doc(groupId).collection("passes");
}

export function groupTransfersRef(groupId: string) {
  return adminDb.collection(collections.groups).doc(groupId).collection("ownershipTransfers");
}

export function groupAuditRef(groupId: string) {
  return adminDb.collection(collections.groups).doc(groupId).collection("auditLogs");
}

export function nowIso() {
  return new Date().toISOString();
}
