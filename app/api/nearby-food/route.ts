import { NextResponse } from "next/server";

const SERP_API_KEY = process.env.SERP_API_KEY;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!lat || !lng) {
    return NextResponse.json(
      { error: "Latitude and longitude are required" },
      { status: 400 }
    );
  }

  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.append("engine", "google_maps");
  url.searchParams.append("q", "food");
  url.searchParams.append("ll", `@${lat},${lng},14z`);
  url.searchParams.append("google_domain", "google.com");
  url.searchParams.append("hl", "en");
  url.searchParams.append("type", "search");
  url.searchParams.append("api_key", SERP_API_KEY || "");

  try {
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return NextResponse.json(data.local_results || []);
  } catch (error) {
    console.error("Error fetching nearby food:", error);
    return NextResponse.json(
      { error: "Failed to fetch nearby food" },
      { status: 500 }
    );
  }
}
