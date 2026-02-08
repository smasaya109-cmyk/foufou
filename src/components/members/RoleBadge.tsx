export default function RoleBadge({ role }: { role: string }) {
  const config: Record<string, { label: string; className: string }> = {
    owner: {
      label: "Owner",
      className: "bg-[var(--accent-soft)] text-[var(--accent-strong)] border-[var(--accent)]"
    },
    viewer: {
      label: "Viewer",
      className: "bg-slate-50 text-slate-600 border-slate-200"
    },
    editor: {
      label: "Viewer",
      className: "bg-slate-50 text-slate-600 border-slate-200"
    },
    local: {
      label: "Local",
      className: "bg-amber-50 text-amber-700 border-amber-200"
    }
  };

  const fallback = { label: role, className: "bg-slate-50 text-slate-600 border-slate-200" };
  const { label, className } = config[role] ?? fallback;

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] ${className}`}>
      {label}
    </span>
  );
}
