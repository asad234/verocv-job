import { getPayload } from "payload";
import config from "@/payload.config";
import { NextResponse } from "next/server";

export async function GET(req: Request, context: any) {
  const { params } = context;
  const { url } = await params;

  if (!url) {
    return new Response(
      JSON.stringify({ error: "Missing URL" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const payload = await getPayload({ config });

    const result = await payload.find({
      collection: "cvs",
      where: {
        and: [
          { url: { equals: url } },
          { isPublic: { equals: true } },
        ],
      },
      limit: 1,
      depth: 5,
    });

    if (!result.docs || result.docs.length === 0) {
      return new Response(
        JSON.stringify({ error: "Public CV not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify(result.docs[0]),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error fetching public CV:", err);
    return new Response(
      JSON.stringify({ error: "Failed to fetch CV" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
