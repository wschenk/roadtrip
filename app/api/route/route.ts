import { NextResponse } from "next/server";

const ORS_API_KEY = process.env.OPENROUTE_API_KEY;

export async function POST(request: Request) {
  if (!ORS_API_KEY) {
    console.error("OpenRouteService API key is not set");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  const { start, end } = await request.json();

  if (!start || !end) {
    return NextResponse.json(
      { error: "Start and end coordinates are required" },
      { status: 400 }
    );
  }

  const body = JSON.stringify({
    coordinates: [start, end],
  });

  try {
    const response = await fetch(
      "https://api.openrouteservice.org/v2/directions/driving-car",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, application/geo+json",
          Authorization: ORS_API_KEY,
        },
        body,
      }
    );

    if (!response.ok) {
      throw new Error(`OpenRouteService API error: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching route:", error);
    return NextResponse.json(
      { error: "Failed to fetch route" },
      { status: 500 }
    );
  }
}
