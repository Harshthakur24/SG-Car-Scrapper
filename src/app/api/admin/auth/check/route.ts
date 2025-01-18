/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server";
import { verify } from "jsonwebtoken";

export async function GET(request: Request) {
  try {
    const token = request.headers
      .get("Cookie")
      ?.split(";")
      .find((c) => c.trim().startsWith("admin_token="))
      ?.split("=")[1];

    if (!token) {
      return NextResponse.json({ authenticated: false });
    }

    verify(token, process.env.JWT_SECRET || "fallback-secret");
    return NextResponse.json({ authenticated: true });
  } catch (error) {
    return NextResponse.json({ authenticated: false });
  }
}
