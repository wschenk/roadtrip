'use client'

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Battery, MapPin, Search, Zap } from 'lucide-react'

// Simulated data for chargers and attractions
const chargers = [
  { id: 1, name: "SuperCharger A", location: "City Center", available: 3, total: 6 },
  { id: 2, name: "QuickCharge B", location: "Highway Rest Stop", available: 1, total: 4 },
  { id: 3, name: "EcoPlug C", location: "Shopping Mall", available: 5, total: 8 },
]

const attractions = [
  { id: 1, name: "Local Museum", type: "Culture", distance: "0.5 miles" },
  { id: 2, name: "Central Park", type: "Nature", distance: "0.8 miles" },
  { id: 3, name: "Gourmet Restaurant", type: "Dining", distance: "0.3 miles" },
]

export function RoadTripPlannerComponent() {
  const [selectedCharger, setSelectedCharger] = useState(null)

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="w-1/3 p-4 bg-white shadow-md overflow-auto">
        <Input
          type="text"
          placeholder="Enter destination"
          className="mb-4"
        />
        <Button className="w-full mb-4">
          <Search className="mr-2 h-4 w-4" /> Plan Route
        </Button>
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
              <p><MapPin className="inline mr-2 h-4 w-4" />{selectedCharger.location}</p>
              <p><Battery className="inline mr-2 h-4 w-4" />{selectedCharger.available} / {selectedCharger.total} available</p>
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
                  <div key={attraction.id} className="p-2 border-b last:border-b-0">
                    <h3 className="font-semibold">{attraction.name}</h3>
                    <p className="text-sm text-gray-600">{attraction.type} - {attraction.distance}</p>
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
        <div className="bg-gray-300 h-full rounded-lg flex items-center justify-center">
          <p className="text-gray-600">Map View (Placeholder)</p>
        </div>
      </div>
    </div>
  )
}