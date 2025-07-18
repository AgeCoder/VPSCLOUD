import { signIn } from "@/lib/auth/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, otp } = body;


    try {
      await signIn("credentials", {
        email,
        otp,
        redirect: false,
      });
    } catch (error) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 401 });
    }

    return NextResponse.json({ success: true, message: "OTP verified and sync started" });
  } catch (error) {
    console.error("OTP Verify Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
