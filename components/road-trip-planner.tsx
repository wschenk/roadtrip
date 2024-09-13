"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Battery, MapPin, Zap } from "lucide-react";
import { MapComponent } from "./MapComponent";
import { useDebounce } from "use-debounce";
import polyline from "@mapbox/polyline";

// Simulated data for chargers and attractions
const chargers = [
  {
    id: 1,
    name: "SuperCharger A",
    location: "City Center",
    available: 3,
    total: 6,
  },
  {
    id: 2,
    name: "QuickCharge B",
    location: "Highway Rest Stop",
    available: 1,
    total: 4,
  },
  {
    id: 3,
    name: "EcoPlug C",
    location: "Shopping Mall",
    available: 5,
    total: 8,
  },
];

const attractions = [
  { id: 1, name: "Local Museum", type: "Culture", distance: "0.5 miles" },
  { id: 2, name: "Central Park", type: "Nature", distance: "0.8 miles" },
  { id: 3, name: "Gourmet Restaurant", type: "Dining", distance: "0.3 miles" },
];

type ChargerType = {
  id: number;
  name: string;
  location: string;
  available: number;
  total: number;
};

export function RoadTripPlannerComponent() {
  const [selectedCharger, setSelectedCharger] = useState<ChargerType | null>(
    null
  );
  const [destination, setDestination] = useState("");
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null
  );
  const [route, setRoute] = useState<any>(null);
  const [cityResults, setCityResults] = useState<any[]>([]);
  const [selectedCity, setSelectedCity] = useState<any>(null);

  const [debouncedDestination] = useDebounce(destination, 300);

  useEffect(() => {
    if (debouncedDestination) {
      searchCities();
    } else {
      setCityResults([]);
    }
  }, [debouncedDestination]);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { longitude, latitude } = position.coords;
        setUserLocation([longitude, latitude]);
      },
      (err) => {
        console.error("Error getting user location:", err);
      }
    );
  }, []);

  const searchCities = async () => {
    if (!debouncedDestination) return;

    try {
      const response = await fetch(
        `/api/geocode?query=${encodeURIComponent(debouncedDestination)}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setCityResults(data.features || []);
    } catch (error) {
      console.error("Error searching cities:", error);
    }
  };

  const selectCity = (city: any) => {
    setSelectedCity(city);
    setCityResults([]);
    setDestination(city.properties.name);
    planRoute(city);
  };

  const planRoute = async (selectedCity: any) => {
    if (!userLocation || !selectedCity) return;

    try {
      const start = userLocation;
      const end = selectedCity.geometry.coordinates;
      const response = await fetch("/api/route", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ start, end }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const encodedGeometry = data.routes[0].geometry;
      const decodedGeometry = polyline.decode(encodedGeometry);

      const routeGeometry = {
        type: "LineString",
        coordinates: decodedGeometry.map(([lat, lng]) => [lng, lat]),
      };

      const routeGeoJSON = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {},
            geometry: routeGeometry,
          },
        ],
      };

      setRoute(routeGeoJSON);
    } catch (error) {
      console.error("Error planning route:", error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-1/3 p-4 bg-white shadow-md overflow-auto">
        <Input
          type="text"
          placeholder="Enter destination"
          className="mb-4"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
        />
        {cityResults.length > 0 && (
          <ScrollArea className="h-48 rounded-md border mb-4">
            {cityResults.map((city) => (
              <Button
                key={city.properties.id}
                variant="ghost"
                className="w-full justify-start"
                onClick={() => selectCity(city)}
              >
                {city.properties.label}
              </Button>
            ))}
          </ScrollArea>
        )}
        <h2 className="text-lg font-semibold mb-2">Chargers on Route</h2>
        <ScrollArea className="h-64 rounded-md border">
          {chargers.map((charger) => (
            <Button
              key={charger.id}
              variant="ghost"
              className="w-full justify-start"
              onClick={() => setSelectedCharger(charger)}
            >
              <Zap className="mr-2 h-4 w-4" />
              {charger.name}
            </Button>
          ))}
        </ScrollArea>
        {selectedCharger && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>{selectedCharger.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                <MapPin className="inline mr-2 h-4 w-4" />
                {selectedCharger.location}
              </p>
              <p>
                <Battery className="inline mr-2 h-4 w-4" />
                {selectedCharger.available} / {selectedCharger.total} available
              </p>
            </CardContent>
          </Card>
        )}
        {selectedCharger && (
          <Tabs defaultValue="attractions" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="attractions">Nearby Attractions</TabsTrigger>
              <TabsTrigger value="amenities">Amenities</TabsTrigger>
            </TabsList>
            <TabsContent value="attractions">
              <ScrollArea className="h-48 rounded-md border">
                {attractions.map((attraction) => (
                  <div
                    key={attraction.id}
                    className="p-2 border-b last:border-b-0"
                  >
                    <h3 className="font-semibold">{attraction.name}</h3>
                    <p className="text-sm text-gray-600">
                      {attraction.type} - {attraction.distance}
                    </p>
                  </div>
                ))}
              </ScrollArea>
            </TabsContent>
            <TabsContent value="amenities">
              <ul className="list-disc list-inside">
                <li>Restrooms</li>
                <li>Cafe</li>
                <li>Wi-Fi</li>
                <li>Parking</li>
              </ul>
            </TabsContent>
          </Tabs>
        )}
      </div>
      <div className="w-2/3 p-4">
        <MapComponent
          userLocation={userLocation}
          route={route}
          destination={selectedCity ? selectedCity.geometry.coordinates : null}
        />
      </div>
    </div>
  );
}
