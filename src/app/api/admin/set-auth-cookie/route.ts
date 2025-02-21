import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    const response = NextResponse.json({ success: true });
    response.cookies.set({
      name: "admin_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/", // Important: Set cookie path to root
    });

    return response;
  } catch (error) {
    console.error("Set auth cookie error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to set authentication cookie" },
      { status: 500 }
    );
  }
}
