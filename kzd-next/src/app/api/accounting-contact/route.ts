/* ==========================================================================
   POST /api/accounting-contact — replaces the legacy
   email-templates/accounting-contact.php. The static page's inline JS did a
   fetch() POST to that PHP script and expected a JSON { success, message }
   response back (not a form redirect) — this route keeps that exact
   contract so the ported form/checklist code needs no change.

   TODO(email): this only validates and logs the submission. Wire real
   delivery (Resend/SMTP) once credentials exist.
   ========================================================================== */

import { NextResponse } from "next/server";

type AccountingPayload = {
  selected_package?: string;
  name?: string;
  email?: string;
  phone?: string;
  business_type?: string;
  business_size?: string;
  monthly_revenue?: string;
  checklist_result_display?: string;
  checklist_score?: string | number;
  recommended_package?: string;
  checklist_answers?: string;
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  let body: AccountingPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid request body." }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim();
  const phone = (body.phone ?? "").trim();

  if (!name || !email || !phone) {
    return NextResponse.json(
      { success: false, message: "Please fill in your name, email and phone number." },
      { status: 400 }
    );
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ success: false, message: "Please enter a valid email address." }, { status: 400 });
  }

  // TODO(email): send this on to info@kzdsolutions.co.za, including the
  // checklist score/package recommendation for context.
  console.log("[accounting-contact] submission received", {
    name,
    email,
    phone,
    business_type: body.business_type,
    business_size: body.business_size,
    monthly_revenue: body.monthly_revenue,
    selected_package: body.selected_package,
    recommended_package: body.recommended_package,
    checklist_score: body.checklist_score,
  });

  return NextResponse.json({ success: true, message: "Thanks — we'll be in touch shortly." });
}
