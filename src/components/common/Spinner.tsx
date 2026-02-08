export default function Spinner({ size = 20 }: { size?: number }) {
  return (
    <span
      className="inline-block animate-spin rounded-full border-2 border-[var(--stroke)] border-t-[var(--accent)]"
      style={{ width: size, height: size }}
      aria-hidden
    />
  );
}
