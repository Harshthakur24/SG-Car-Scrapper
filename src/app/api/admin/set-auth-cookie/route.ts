/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();
    console.log(`set-auth-cookie route token: ${token}`);

    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: "admin_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
    });
    console.log(`set-auth-cookie route response: ${response}`);
    console.log(`set-auth-cookie route response cookies: ${response.cookies}`);
    return response;
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
