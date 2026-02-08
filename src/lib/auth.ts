import { headers } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export type AuthUser = {
  id: string;
  email?: string | null;
  name?: string | null;
};

export async function requireAuth(request?: Request): Promise<AuthUser> {
  const headerSource = request?.headers ?? headers();
  const authHeader = headerSource.get("authorization") ?? headerSource.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("UNAUTHORIZED");
  }

  const token = authHeader.replace("Bearer ", "").trim();
  const decoded = await adminAuth.verifyIdToken(token);

  if (!decoded?.uid) {
    throw new Error("UNAUTHORIZED");
  }

  const userRef = adminDb.collection("users").doc(decoded.uid);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    await userRef.set({
      email: decoded.email ?? null,
      name: decoded.name ?? null,
      createdAt: new Date().toISOString()
    });
  }

  return {
    id: decoded.uid,
    email: decoded.email ?? null,
    name: decoded.name ?? null
  };
}
