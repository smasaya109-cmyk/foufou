export default function Modal({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-6">
      <h3 className="font-semibold">{title}</h3>
      <div className="mt-3 text-sm text-muted">{children}</div>
    </div>
  );
}
