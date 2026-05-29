import { NextResponse } from "next/server";
import { bookSeat } from "../../../lib/store";

export async function POST(request) {
  try {
    const body = await request.json();
    const required = ["scheduleId", "firstName", "lastName", "email"];
    for (const field of required) {
      if (!body[field]) return NextResponse.json({ error: `${field} is required.` }, { status: 400 });
    }
    const booking = await bookSeat(body.scheduleId, {
      title: body.title || "",
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email
    });
    return NextResponse.json(booking);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
