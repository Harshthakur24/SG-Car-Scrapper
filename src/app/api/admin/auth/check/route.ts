import { NextResponse } from "next/server";
import { verify } from "jsonwebtoken";

export async function GET(request: Request) {
  try {
    const cookieHeader = request.headers.get("Cookie") || "";
    const token = cookieHeader
      .split(';')
      .find(c => c.trim().startsWith('admin_token='))
      ?.split('=')[1];

    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const decoded = verify(token, process.env.JWT_SECRET || "fallback-secret");
    
    if (!decoded) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({ authenticated: true });
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}