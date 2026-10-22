/* ==========================================================================
   POST /api/notify — "Notify me" on the coming-soon pages.

   TODO(email): this only validates and logs the signup. Wire it to a real
   mailing list once one exists, keeping this request/response contract so
   NotifyForm.tsx needs no change.
   ========================================================================== */

import { NextResponse } from "next/server";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  let body: { email?: string; topic?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid request body." }, { status: 400 });
  }

  const email = (body.email ?? "").trim();
  const topic = (body.topic ?? "").trim().slice(0, 64);

  if (!isValidEmail(email)) {
    return NextResponse.json({ success: false, message: "Please enter a valid email address." }, { status: 400 });
  }

  // TODO(email): add to the launch list for `topic`.
  console.log("[notify] signup received", { email, topic });

  return NextResponse.json({ success: true, message: "You are on the list" });
}
