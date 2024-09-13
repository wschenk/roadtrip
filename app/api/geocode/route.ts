import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (!query) {
    return NextResponse.json(
      { error: "Query parameter is required" },
      { status: 400 }
    );
  }

  console.log("API route called");
  const apiKey = process.env.OPENROUTE_API_KEY;

  try {
    const url = `https://api.openrouteservice.org/geocode/search?api_key=${apiKey}&text=${encodeURIComponent(
      query
    )}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Accept: "*/*",
        //          "application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8",
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      console.log(await response.text());
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data && data.features && data.features.length > 0) {
      return NextResponse.json(data);
    } else {
      return NextResponse.json({ error: "No results found" }, { status: 404 });
    }
  } catch (error) {
    console.error("Error fetching geocode data:", error);
    return NextResponse.json(
      { error: "Error fetching geocode data" },
      { status: 500 }
    );
  }
}
