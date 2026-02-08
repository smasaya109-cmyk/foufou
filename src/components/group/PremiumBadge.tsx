export default function PremiumBadge({ label }: { label: string }) {
  const tone = label.includes("Free")
    ? "bg-[#F1F3F5] text-neutral-700"
    : "bg-[var(--accent)] text-white";
  return <span className={`pill ${tone}`}>{label}</span>;
}
