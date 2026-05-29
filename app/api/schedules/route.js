import { NextResponse } from "next/server";
import { listSchedules } from "../../../lib/store";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const orig = searchParams.get("orig") || "NZNE";
  const dest = searchParams.get("dest") || "YSSY";
  const date1 = searchParams.get("date1");
  const date2 = searchParams.get("date2");

  if (!date1 || !date2) {
    return NextResponse.json({ error: "date1 and date2 are required." }, { status: 400 });
  }

  try {
    const schedules = await listSchedules({ orig, dest, date1, date2 });
    return NextResponse.json({ schedules });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
