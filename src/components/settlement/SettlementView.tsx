import TransferList, { TransferItem } from "@/components/settlement/TransferList";
import MemberNetTable, { NetItem } from "@/components/settlement/MemberNetTable";

export default function SettlementView({
  transfers,
  nets
}: {
  transfers: TransferItem[];
  nets: NetItem[];
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <TransferList items={transfers} />
      <MemberNetTable items={nets} />
    </div>
  );
}
