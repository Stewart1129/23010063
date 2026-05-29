import { NextResponse } from "next/server";
import { findPassengerBookings } from "../../../lib/store";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  if (!email) return NextResponse.json({ error: "Email is required." }, { status: 400 });
  return NextResponse.json({ bookings: await findPassengerBookings(email) });
}
