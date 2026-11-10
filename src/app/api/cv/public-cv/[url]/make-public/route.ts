import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import config from "@/payload.config";

export async function PATCH(req: NextRequest) {
  try {
    const { cvId, currentState, userId } = await req.json();

    if (!cvId || !userId) {
      return NextResponse.json({ error: "Missing CV ID or user ID" }, { status: 400 });
    }

    const payload = await getPayload({ config });

    const numericUserId = parseInt(userId.toString(), 10);
    if (isNaN(numericUserId)) return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });

    const cv = await payload.findByID({ collection: "cvs", id: cvId });
    if (!cv) return NextResponse.json({ error: "CV not found" }, { status: 404 });

    const cvUserId = typeof cv.user === "object" ? cv.user.id : cv.user;
    if (cvUserId !== numericUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    // ✅ Simply toggle isPublic
    const updated = await payload.update({
      collection: "cvs",
      id: cvId,
      data: { isPublic: !currentState },
    });

    return NextResponse.json({ success: true, cv: updated });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to toggle CV visibility" }, { status: 500 });
  }
}
