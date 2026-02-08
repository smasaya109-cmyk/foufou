export default function Toast({ message }: { message: string }) {
  return (
    <div className="rounded-full bg-[var(--positive)] px-4 py-2 text-xs text-white">
      {message}
    </div>
  );
}
