import { NextResponse } from "next/server";
import { airports } from "../../../lib/data";

export async function GET() {
  return NextResponse.json(airports);
}
