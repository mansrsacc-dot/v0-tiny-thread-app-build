import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

// GET /api/session — returns the logged-in customer from the first-party httpOnly cookie, or
// { customer: null }. The app calls this on load (cookie is sent automatically, same-origin) so
// returning users are recognized without depending on localStorage.
export async function GET(req: NextRequest) {
  const data = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!data) return NextResponse.json({ customer: null });
  return NextResponse.json({
    customer: { id: data.id, email: data.email, firstName: data.firstName, lastName: data.lastName },
  });
}
