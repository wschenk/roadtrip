"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

// Set Mapbox access token from environment variable
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

interface MapComponentProps {
  userLocation: [number, number] | null;
  route: any;
  destination: [number, number] | null;
  routeCoordinates: [number, number][];
  onChargersUpdate: (chargers: ChargerType[]) => void;
  selectedCharger: ChargerType | null;
  nearbyFood: FoodLocationType[];
  clearMap: boolean;
  selectedFood: FoodLocationType | null;
  chargerFilters: {
    dcFast: boolean;
    level2: boolean;
    level1: boolean;
  };
}

type ChargerType = {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  level1: number | null;
  level2: number | null;
  dcfast: number | null;
};

type FoodLocationType = {
  position: number[];
  title: string;
  address: string;
  rating: number;
  reviews: number;
  type: string;
  gps_coordinates: {
    longitude: number;
    latitude: number;
  };
  thumbnail: string | null;
  place_id_search: string | null;
};

const chargerIcons = {
  level1: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="#FFA500" stroke="black" stroke-width="2"/>
  </svg>`,
  level2: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="#00FF00" stroke="black" stroke-width="2"/>
    <path d="M17 6L7 18H16L15 26L25 14H16L17 6Z" fill="#00FF00" stroke="black" stroke-width="2"/>
  </svg>`,
  dcfast: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="4" width="20" height="16" rx="2" fill="#0000FF" stroke="black" stroke-width="2"/>
    <path d="M13 8L7 14H12L11 20L17 14H12L13 8Z" fill="white" stroke="white"/>
  </svg>`,
};

const foodIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="10" fill="#FF6B6B" stroke="#4A4A4A" stroke-width="2"/>
  <path d="M7 11L12 16L17 11" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M12 16V8" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export function MapComponent({
  userLocation,
  route,
  destination,
  routeCoordinates,
  onChargersUpdate,
  selectedCharger,
  nearbyFood,
  clearMap,
  selectedFood,
  chargerFilters,
}: MapComponentProps) {
  const mapContainer = useRef(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const destinationMarker = useRef<mapboxgl.Marker | null>(null);
  const chargerMarkers = useRef<mapboxgl.Marker[]>([]);
  const foodMarkers = useRef<mapboxgl.Marker[]>([]);

  const [chargers, setChargers] = useState<ChargerType[]>([]);

  const fetchChargers = useCallback(
    async (bounds: mapboxgl.LngLatBounds) => {
      const { _ne, _sw } = bounds;
      const url = `/api/chargers?n=${_ne.lat}&e=${_ne.lng}&s=${_sw.lat}&w=${_sw.lng}`;
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setChargers(data);
        onChargersUpdate(data);
      } catch (error) {
        console.error("Error fetching chargers:", error);
      }
    },
    [onChargersUpdate]
  );

  const updateVisibleChargers = useCallback(() => {
    if (!map.current) return;
    const bounds = map.current.getBounds();
    const visibleChargers = chargers.filter((charger) =>
      bounds.contains([charger.longitude, charger.latitude])
    );
    onChargersUpdate(visibleChargers);
  }, [chargers, onChargersUpdate]);

  useEffect(() => {
    if (!map.current) return;
    map.current.on("moveend", updateVisibleChargers);
    return () => {
      if (map.current) {
        map.current.off("moveend", updateVisibleChargers);
      }
    };
  }, [updateVisibleChargers]);

  useEffect(() => {
    if (!map.current || routeCoordinates.length === 0) return;

    const bounds = new mapboxgl.LngLatBounds();
    routeCoordinates.forEach((coord) => bounds.extend(coord));
    map.current.fitBounds(bounds, { padding: 50 });

    fetchChargers(bounds);
  }, [routeCoordinates, fetchChargers]);

  useEffect(() => {
    if (clearMap && map.current) {
      // Clear route
      if (map.current.getLayer("route")) {
        map.current.removeLayer("route");
        map.current.removeSource("route");
      }

      // Clear charger markers
      chargerMarkers.current.forEach((marker) => marker.remove());
      chargerMarkers.current = [];

      // Clear food markers
      foodMarkers.current.forEach((marker) => marker.remove());
      foodMarkers.current = [];

      // Clear destination marker
      if (destinationMarker.current) {
        destinationMarker.current.remove();
        destinationMarker.current = null;
      }

      // Reset state
      setChargers([]);
    }
  }, [clearMap]);

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

  useEffect(() => {
    if (!map.current) return;

    // Remove existing charger markers
    chargerMarkers.current.forEach((marker) => marker.remove());
    chargerMarkers.current = [];

    // Add new charger markers
    chargers.forEach((charger) => {
      if (
        (chargerFilters.dcFast && charger.dcfast) ||
        (chargerFilters.level2 && charger.level2) ||
        (chargerFilters.level1 && charger.level1)
      ) {
        const el = document.createElement("div");
        el.className = "charger-marker";

        let iconSvg;
        if (charger.dcfast && chargerFilters.dcFast) {
          iconSvg = chargerIcons.dcfast;
        } else if (charger.level2 && chargerFilters.level2) {
          iconSvg = chargerIcons.level2;
        } else if (charger.level1 && chargerFilters.level1) {
          iconSvg = chargerIcons.level1;
        } else {
          return; // Skip this charger if it doesn't match the filters
        }

        el.innerHTML = iconSvg;

        const marker = new mapboxgl.Marker(el)
          .setLngLat([charger.longitude, charger.latitude])
          .setPopup(
            new mapboxgl.Popup().setHTML(`
              <h3>${charger.name}</h3>
              <p>${charger.address}</p>
              <p>Level 1: ${charger.level1 || 0}</p>
              <p>Level 2: ${charger.level2 || 0}</p>
              <p>DC Fast: ${charger.dcfast || 0}</p>
              <a href="https://www.google.com/maps/search/?api=1&query=${
                charger.latitude
              },${
              charger.longitude
            }" target="_blank" rel="noopener noreferrer">View on Google Maps</a>
            `)
          )
          .addTo(map.current!);

        chargerMarkers.current.push(marker);
      }
    });

    updateVisibleChargers();
  }, [chargers, chargerFilters, updateVisibleChargers]);

  useEffect(() => {
    if (!map.current) return;

    // Remove existing food markers and close their popups
    foodMarkers.current.forEach((marker) => {
      marker.getPopup().remove();
      marker.remove();
    });
    foodMarkers.current = [];

    // Add new food markers
    nearbyFood.forEach((food) => {
      const el = document.createElement("div");
      el.className = "food-marker";
      el.innerHTML = foodIcon;
      el.style.width = "30px";
      el.style.height = "30px";
      el.style.cursor = "pointer";

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div style="max-width: 200px;">
          <h3 style="font-weight: bold; margin-bottom: 5px;">${food.title}</h3>
          ${
            food.thumbnail
              ? `<img src="${food.thumbnail}" alt="${food.title}" style="width: 100%; margin-bottom: 5px;">`
              : ""
          }
          <p style="font-size: 0.9em; margin-bottom: 5px;">${food.address}</p>
          <p style="font-size: 0.9em; margin-bottom: 5px;">Rating: ${
            food.rating
          } (${food.reviews} reviews)</p>
          <p style="font-size: 0.9em; margin-bottom: 5px;">${food.type}</p>
          <a href="https://www.google.com/maps/search/?api=1&query=${
            food.gps_coordinates.latitude
          },${
        food.gps_coordinates.longitude
      }" target="_blank" rel="noopener noreferrer" style="color: blue; text-decoration: underline;">View on Google Maps</a>
        </div>
      `);

      const marker = new mapboxgl.Marker(el)
        .setLngLat({
          lng: food.gps_coordinates.longitude,
          lat: food.gps_coordinates.latitude,
        })
        .setPopup(popup)
        .addTo(map.current!);

      foodMarkers.current.push(marker);
    });
  }, [nearbyFood]);

  useEffect(() => {
    if (!map.current || !selectedCharger) return;

    // Zoom to the selected charger
    map.current.flyTo({
      center: [selectedCharger.longitude, selectedCharger.latitude],
      zoom: 15,
      essential: true,
    });

    // Highlight the selected charger
    chargerMarkers.current.forEach((marker) => {
      const el = marker.getElement();
      if (
        marker.getLngLat().lng === selectedCharger.longitude &&
        marker.getLngLat().lat === selectedCharger.latitude
      ) {
        el.style.zIndex = "1";
        el.style.transform = `${el.style.transform} scale(1.5)`;
      } else {
        el.style.zIndex = "0";
        el.style.transform = el.style.transform.replace(" scale(1.5)", "");
      }
    });
  }, [selectedCharger]);

  useEffect(() => {
    if (!map.current || !selectedFood) return;

    // Zoom to the selected food location
    map.current.flyTo({
      center: [
        selectedFood.gps_coordinates.longitude,
        selectedFood.gps_coordinates.latitude,
      ],
      zoom: 17,
      essential: true,
    });

    // Find the marker for the selected food and open its popup
    const selectedMarker = foodMarkers.current.find(
      (marker) =>
        marker.getLngLat().lng === selectedFood.gps_coordinates.longitude &&
        marker.getLngLat().lat === selectedFood.gps_coordinates.latitude
    );

    if (selectedMarker) {
      selectedMarker.togglePopup();
    }

    // Highlight the selected food marker
    foodMarkers.current.forEach((marker) => {
      const el = marker.getElement();
      if (
        marker.getLngLat().lng === selectedFood.gps_coordinates.longitude &&
        marker.getLngLat().lat === selectedFood.gps_coordinates.latitude
      ) {
        el.style.zIndex = "2";
        el.style.transform = `${el.style.transform} scale(1.5)`;
      } else {
        el.style.zIndex = "1";
        el.style.transform = el.style.transform.replace(" scale(1.5)", "");
      }
    });
  }, [selectedFood]);

  return <div ref={mapContainer} className="h-full rounded-lg" />;
}
