"use client";

import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Set Mapbox access token from environment variable
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

interface MapComponentProps {
  userLocation: [number, number] | null;
  route: any;
  destination: [number, number] | null;
}

export function MapComponent({
  userLocation,
  route,
  destination,
}: MapComponentProps) {
  const mapContainer = useRef(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const destinationMarker = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    if (map.current) return; // Initialize map only once
    map.current = new mapboxgl.Map({
      container: mapContainer.current!,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [-74.5, 40], // Default center
      zoom: 9,
    });

    // Add navigation control (zoom buttons)
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
  }, []);

  useEffect(() => {
    if (!map.current || !userLocation) return;
    if (!userMarker.current) {
      const el = document.createElement("div");
      el.className = "car-marker";
      el.style.backgroundImage =
        "url(https://img.icons8.com/color/48/000000/car.png)";
      el.style.width = "30px";
      el.style.height = "30px";
      el.style.backgroundSize = "100%";

      userMarker.current = new mapboxgl.Marker(el)
        .setLngLat(userLocation)
        .addTo(map.current);
    } else {
      userMarker.current.setLngLat(userLocation);
    }

    map.current.flyTo({
      center: userLocation,
      essential: true,
    });
  }, [userLocation]);

  useEffect(() => {
    if (!map.current || !destination) return;
    if (!destinationMarker.current) {
      destinationMarker.current = new mapboxgl.Marker()
        .setLngLat(destination)
        .addTo(map.current);
    } else {
      destinationMarker.current.setLngLat(destination);
    }

    // Fit map to show both user location and destination
    if (userLocation) {
      const bounds = new mapboxgl.LngLatBounds()
        .extend(userLocation)
        .extend(destination);
      map.current.fitBounds(bounds, { padding: 50 });
    }
  }, [destination, userLocation]);

  useEffect(() => {
    if (!map.current || !route) return;

    console.log("Received route data:", JSON.stringify(route, null, 2));

    try {
      // Add route to the map
      if (map.current.getSource("route")) {
        console.log("Updating existing route source");
        (map.current.getSource("route") as mapboxgl.GeoJSONSource).setData(
          route
        );
      } else {
        console.log("Adding new route layer");
        map.current.addLayer({
          id: "route",
          type: "line",
          source: {
            type: "geojson",
            data: route,
          },
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#3887be",
            "line-width": 5,
            "line-opacity": 0.75,
          },
        });
      }
    } catch (error) {
      console.error("Error rendering route:", error);
    }
  }, [route]);

  return <div ref={mapContainer} className="h-full rounded-lg" />;
}
