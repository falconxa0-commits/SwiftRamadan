import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'SwiftRamadan API', version: '1.0.0' });
}