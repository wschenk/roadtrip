import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const n = searchParams.get("n");
  const e = searchParams.get("e");
  const s = searchParams.get("s");
  const w = searchParams.get("w");

  if (!n || !e || !s || !w) {
    return NextResponse.json(
      { error: "Missing bounding box parameters" },
      { status: 400 }
    );
  }

  const url = `https://chargermap.fly.dev/in_map?n=${n}&e=${e}&s=${s}&w=${w}&connectors=null&dc=true&level1=true&level2=true`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching chargers:", error);
    return NextResponse.json(
      { error: "Failed to fetch chargers" },
      { status: 500 }
    );
  }
}
