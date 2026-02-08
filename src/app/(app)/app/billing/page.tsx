import ProStatusCard from "@/components/billing/ProStatusCard";
import ProCheckoutButton from "@/components/billing/ProCheckoutButton";
import ManageSubscriptionButton from "@/components/billing/ManageSubscriptionButton";
import { cookies } from "next/headers";
import { getCopy, LANG_KEY, LEGACY_LANG_KEY, normalizeLang } from "@/lib/i18n";

export default function BillingPage() {
  const lang = normalizeLang(
    cookies().get(LANG_KEY)?.value ?? cookies().get(LEGACY_LANG_KEY)?.value
  );
  const copy = getCopy(lang);
  return (
    <div className="space-y-6">
      <div className="card p-6">
        <h1 className="text-3xl font-semibold">{copy.billing.title}</h1>
        <p className="text-sm text-muted">{copy.billing.subtitle}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <ProStatusCard />
        <div className="card p-4">
          <p className="font-semibold">{copy.billing.startPro}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <ProCheckoutButton />
            <ManageSubscriptionButton />
          </div>
        </div>
      </div>
    </div>
  );
}
