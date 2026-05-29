import { NextResponse } from "next/server";
import { getPassengers } from "../../../lib/passengers";

export async function GET() {
  return NextResponse.json({ passengers: await getPassengers() });
}
