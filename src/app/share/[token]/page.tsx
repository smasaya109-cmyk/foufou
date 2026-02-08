import { adminDb } from "@/lib/firebase-admin";
import { groupSettlementsRef, groupMembersRef, groupExpensesRef } from "@/lib/firestore";
import ShareDetails from "@/components/share/ShareDetails";
import ShareTabs from "@/components/share/ShareTabs";
import { cookies } from "next/headers";
import { getCopy, LANG_KEY, LEGACY_LANG_KEY, normalizeLang } from "@/lib/i18n";
import { getUserPlan } from "@/lib/rbac";

function maskName(name: string | null, fallback: string) {
  if (!name) return fallback;
  const first = name.trim().slice(0, 1);
  return `${first}***`;
}

export default async function SharePage({
  params
}: {
  params: { token: string };
}) {
  const groupQuery = await adminDb
    .collection("groups")
    .where("shareToken", "==", params.token)
    .limit(1)
    .get();

  if (groupQuery.empty) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-2xl font-semibold">
          {getCopy(
            normalizeLang(
              cookies().get(LANG_KEY)?.value ?? cookies().get(LEGACY_LANG_KEY)?.value
            )
          ).share.invalid}
        </h1>
      </main>
    );
  }

  const groupDoc = groupQuery.docs[0]!;
  const group = groupDoc.data();

  const membersSnap = await groupMembersRef(groupDoc.id).get();
  const members = membersSnap.docs.map((doc) => doc.data());

  const expensesSnap = await groupExpensesRef(groupDoc.id)
    .orderBy("date", "desc")
    .get();
  const expenses = expensesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  const settlementSnap = await groupSettlementsRef(groupDoc.id)
    .orderBy("version", "desc")
    .limit(1)
    .get();

  const settlement = settlementSnap.empty ? null : settlementSnap.docs[0]!.data();
  const payload = settlement?.payloadJson as
    | { transfers?: Array<{ fromUserId: string; toUserId: string; amount: number }> }
    | undefined;

  const nameMap = new Map<string, string>();
  members.forEach((member: any) => {
    if (member?.userId) {
      nameMap.set(member.userId, member?.name ?? member?.userId);
    }
  });
  const ownerPlan = group.ownerUserId ? await getUserPlan(group.ownerUserId) : "free";
  const canViewPhotos = ownerPlan === "premium";
  const photosSnap = canViewPhotos
    ? await adminDb
        .collection("groups")
        .doc(groupDoc.id)
        .collection("photos")
        .orderBy("createdAt", "desc")
        .get()
    : null;
  const photos = photosSnap ? photosSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) : [];
  const lang = normalizeLang(
    cookies().get(LANG_KEY)?.value ?? cookies().get(LEGACY_LANG_KEY)?.value
  );
  const copy = getCopy(lang);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-16">
      <header>
        <h1 className="text-2xl font-semibold">{group.title}</h1>
        <p className="text-sm text-neutral-600">{copy.share.summary}</p>
      </header>

      <ShareTabs
        expenses={expenses.map((expense: any) => ({
          id: expense.id,
          title: expense.memo || expense.category || copy.tabs.expenses,
          amount: expense.amount,
          currency: expense.currency || group.currency || "JPY",
          date: expense.date,
          payerName: maskName(nameMap.get(expense.payerUserId) ?? null, copy.share.memberFallback)
        }))}
        transfers={(payload?.transfers ?? []).map((transfer) => ({
          fromName: maskName(nameMap.get(transfer.fromUserId) ?? null, copy.share.memberFallback),
          toName: maskName(nameMap.get(transfer.toUserId) ?? null, copy.share.memberFallback),
          amount: transfer.amount,
          currency: group.currency || "JPY"
        }))}
        photos={photos.map((photo: any) => ({
          id: photo.id,
          url: photo.url,
          name: photo.name ?? ""
        }))}
      />

      <ShareDetails token={params.token} />

      <section className="card p-5">
        <h2 className="text-lg font-semibold">{copy.share.ctaTitle}</h2>
        <p className="mt-2 text-sm text-muted">
          {copy.share.ctaBody}
        </p>
        <div className="mt-4">
          <a className="btn-primary px-5 py-2 text-sm" href="/login">
            {copy.share.ctaButton}
          </a>
        </div>
      </section>
    </main>
  );
}
