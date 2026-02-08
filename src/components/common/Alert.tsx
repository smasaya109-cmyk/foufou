export default function Alert({
  type = "error",
  message
}: {
  type?: "error" | "success" | "info";
  message: string;
}) {
  const styles =
    type === "success"
      ? "border-2 border-emerald-200 bg-emerald-50 text-emerald-700"
      : type === "info"
        ? "border-2 border-[var(--stroke)] bg-[var(--bg-soft)] text-[var(--ink-muted)]"
        : "border-2 border-red-200 bg-red-50 text-red-700";

  return (
    <div className={`rounded-2xl px-4 py-2 text-sm ${styles}`}>
      {message}
    </div>
  );
}
