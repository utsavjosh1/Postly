import { NextRequest, NextResponse } from "next/server";

// In-memory storage for development (replace with database in production)
const betaSignups: Array<{
  id: string;
  name: string;
  email: string;
  discordUsername?: string;
  createdAt: Date;
}> = [];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, discordUsername } = body;

    // Validation
    if (!name || !email) {
      return NextResponse.json(
        { message: "Name and email are required" },
        { status: 400 },
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { message: "Please enter a valid email address" },
        { status: 400 },
      );
    }

    // Check if email already exists
    const existingSignup = betaSignups.find(
      (signup) => signup.email.toLowerCase() === email.toLowerCase(),
    );
    if (existingSignup) {
      return NextResponse.json(
        { message: "This email is already registered for beta access" },
        { status: 409 },
      );
    }

    // Create new signup
    const newSignup = {
      id: Date.now().toString(),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      discordUsername: discordUsername?.trim() || undefined,
      createdAt: new Date(),
    };

    betaSignups.push(newSignup);

    // Log for development (replace with proper logging in production)
    console.log("New beta signup:", newSignup);

    return NextResponse.json(
      {
        message: "Successfully joined beta access!",
        id: newSignup.id,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Beta signup error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET() {
  // Return beta signup stats (for admin use)
  return NextResponse.json({
    totalSignups: betaSignups.length,
    recentSignups: betaSignups.slice(-5).map((signup) => ({
      id: signup.id,
      name: signup.name,
      email: signup.email.replace(/(.{2})(.*)(@.*)/, "$1***$3"), // Mask email for privacy
      createdAt: signup.createdAt,
    })),
  });
}
