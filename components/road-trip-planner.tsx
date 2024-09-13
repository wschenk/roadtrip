"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Battery, MapPin, Zap } from "lucide-react";
import { MapComponent } from "./MapComponent";
import { useDebounce } from "use-debounce";
import polyline from "@mapbox/polyline";
import { Switch } from "@/components/ui/switch";

type ChargerType = {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  level1: number | null;
  level2: number | null;
  dcfast: number | null;
  location?: string;
  available?: number;
  total?: number;
};

type FoodLocationType = {
  position: number[];
  title: string;
  address: string;
  rating: number;
  reviews: number;
  type: string;
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
  //const [chargers, setChargers] = useState<ChargerType[]>([]);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>(
    []
  );
  const [nearbyFood, setNearbyFood] = useState<FoodLocationType[]>([]);
  const [visibleChargers, setVisibleChargers] = useState<ChargerType[]>([]);
  const [clearMap, setClearMap] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodLocationType | null>(
    null
  );
  const [chargerFilters, setChargerFilters] = useState({
    dcFast: true,
    level2: false,
    level1: false,
  });

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

  const fetchNearbyFood = useCallback(async (lat: number, lng: number) => {
    try {
      const response = await fetch(`/api/nearby-food?lat=${lat}&lng=${lng}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setNearbyFood(data);
    } catch (error) {
      console.error("Error fetching nearby food:", error);
    }
  }, []);

  const selectCharger = (charger: ChargerType) => {
    setSelectedCharger(charger);
    fetchNearbyFood(charger.latitude, charger.longitude);
  };

  const handleChargersUpdate = useCallback((updatedChargers: ChargerType[]) => {
    setVisibleChargers(updatedChargers);
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
    setClearMap(true);
    setSelectedCity(city);
    setCityResults([]);
    setDestination(city.properties.name);
    setSelectedCharger(null);
    setNearbyFood([]);
    setVisibleChargers([]);
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
      setRouteCoordinates(routeGeometry.coordinates as [number, number][]);
      setClearMap(false);
    } catch (error) {
      console.error("Error planning route:", error);
      setClearMap(false);
    }
  };

  const selectFood = (food: FoodLocationType) => {
    setSelectedFood(food);
  };

  const handleChargerFilterChange = (type: "dcFast" | "level2" | "level1") => {
    setChargerFilters((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const filteredVisibleChargers = visibleChargers.filter(
    (charger) =>
      (chargerFilters.dcFast && charger.dcfast) ||
      (chargerFilters.level2 && charger.level2) ||
      (chargerFilters.level1 && charger.level1)
  );

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

        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-2">Charger Types</h2>
          <div className="flex items-center space-x-2">
            <Switch
              checked={chargerFilters.dcFast}
              onCheckedChange={() => handleChargerFilterChange("dcFast")}
            />
            <label>DC Fast</label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              checked={chargerFilters.level2}
              onCheckedChange={() => handleChargerFilterChange("level2")}
            />
            <label>Level 2</label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              checked={chargerFilters.level1}
              onCheckedChange={() => handleChargerFilterChange("level1")}
            />
            <label>Level 1</label>
          </div>
        </div>

        <h2 className="text-lg font-semibold mb-2">Chargers on Map</h2>
        <ScrollArea className="h-64 rounded-md border">
          {filteredVisibleChargers.map((charger) => (
            <Button
              key={charger.id}
              variant="ghost"
              className="w-full justify-start"
              onClick={() => selectCharger(charger)}
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
                {selectedCharger.address}
              </p>
              <p>
                <Battery className="inline mr-2 h-4 w-4" />
                Level 1: {selectedCharger.level1 || 0}
              </p>
              <p>
                <Battery className="inline mr-2 h-4 w-4" />
                Level 2: {selectedCharger.level2 || 0}
              </p>
              <p>
                <Battery className="inline mr-2 h-4 w-4" />
                DC Fast: {selectedCharger.dcfast || 0}
              </p>
            </CardContent>
          </Card>
        )}
        {selectedCharger && (
          <Tabs defaultValue="attractions" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="attractions">Nearby Food</TabsTrigger>
              <TabsTrigger value="amenities">Amenities</TabsTrigger>
            </TabsList>
            <TabsContent value="attractions">
              <ScrollArea className="h-48 rounded-md border">
                {nearbyFood.map((food, index) => (
                  <div
                    key={index}
                    className="p-2 border-b last:border-b-0 cursor-pointer hover:bg-gray-100"
                    onClick={() => selectFood(food)}
                  >
                    <h3 className="font-semibold">{food.title}</h3>
                    <p className="text-sm text-gray-600">{food.address}</p>
                    <p className="text-sm text-gray-600">
                      Rating: {food.rating} ({food.reviews} reviews)
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
          routeCoordinates={routeCoordinates}
          onChargersUpdate={handleChargersUpdate}
          selectedCharger={selectedCharger}
          nearbyFood={nearbyFood as any}
          clearMap={clearMap}
          selectedFood={selectedFood as any}
          chargerFilters={chargerFilters}
        />
      </div>
    </div>
  );
}
