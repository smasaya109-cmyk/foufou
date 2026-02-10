import { NextResponse } from "next/server";

import { adminDb } from "@/lib/firebase-admin";

function escapeCsv(value: string) {
  if (value.includes(",") || value.includes("\"") || value.includes("\n")) {
    return `"${value.replace(/"/g, "\"\"")}"`;
  }
  return value;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key") ?? request.headers.get("x-admin-key");
  const expected = process.env.ADMIN_EXPORT_KEY;

  if (!expected || key !== expected) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 401 });
  }

  const snap = await adminDb.collection("cancelFeedback").orderBy("createdAt", "desc").get();
  const rows = [
    ["createdAt", "userId", "email", "name", "plan", "usagePeriod", "reason"]
  ];

  snap.forEach((doc) => {
    const data = doc.data();
    rows.push([
      String(data.createdAt ?? ""),
      String(data.userId ?? ""),
      String(data.email ?? ""),
      String(data.name ?? ""),
      String(data.plan ?? ""),
      String(data.usagePeriod ?? ""),
      String(data.reason ?? "")
    ]);
  });

  const csv = rows
    .map((row) => row.map((cell) => escapeCsv(cell)).join(","))
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=cancel-feedback.csv"
    }
  });
}
