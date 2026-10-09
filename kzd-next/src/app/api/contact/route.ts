/* ==========================================================================
   POST /api/contact — replaces the legacy email-templates/contact-form.php.

   TODO(email): this only validates and logs the submission. Wire real
   delivery (Resend/SMTP) once credentials exist, keeping this same request/
   response contract so ContactForm.tsx needs no change.
   ========================================================================== */

import { NextResponse } from "next/server";

type ContactPayload = {
  first_name?: string;
  surname?: string;
  phone?: string;
  email?: string;
  comment?: string;
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  let body: ContactPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid request body." }, { status: 400 });
  }

  const first_name = (body.first_name ?? "").trim();
  const surname = (body.surname ?? "").trim();
  const phone = (body.phone ?? "").trim();
  const email = (body.email ?? "").trim();
  const comment = (body.comment ?? "").trim();

  if (!first_name || !surname || !phone || !email) {
    return NextResponse.json(
      { success: false, message: "Please fill in your first name, surname, phone and email." },
      { status: 400 }
    );
  }

  if (!isValidEmail(email)) {
    return NextResponse.json({ success: false, message: "Please enter a valid email address." }, { status: 400 });
  }

  // TODO(email): send this on to info@kzdsolutions.co.za.
  console.log("[contact] submission received", { first_name, surname, phone, email, comment });

  return NextResponse.json({ success: true, message: "Thanks — we'll be in touch shortly." });
}
