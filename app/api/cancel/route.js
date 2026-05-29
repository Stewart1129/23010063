import { NextResponse } from "next/server";
import { cancelBooking } from "../../../lib/store";

export async function POST(request) {
  try {
    const { reference } = await request.json();
    if (!reference) return NextResponse.json({ error: "Booking reference is required." }, { status: 400 });
    return NextResponse.json(await cancelBooking(reference));
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
}
