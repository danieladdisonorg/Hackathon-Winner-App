"use client";

import { useState, useEffect, useRef } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MapPin, Navigation, Search } from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                                Global Types                                */
/* -------------------------------------------------------------------------- */

declare global {
  interface Window {
    google?: typeof google;
  }
}

/* -------------------------------------------------------------------------- */
/*                              Config Constants                              */
/* -------------------------------------------------------------------------- */

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

/* -------------------------------------------------------------------------- */
/*                                Main Component                              */
/* -------------------------------------------------------------------------- */

export default function MapRoute() {
  /* ------------------------------ State & Refs ------------------------------ */
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);
  const [placesService, setPlacesService] = useState<google.maps.places.PlacesService | null>(null);
  const [startAutocomplete, setStartAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [endAutocomplete, setEndAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);

  const [pointsOfInterest, setPointsOfInterest] = useState<any[]>([]);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const mapRef = useRef<HTMLDivElement>(null);
  const startInputRef = useRef<HTMLInputElement>(null);
  const endInputRef = useRef<HTMLInputElement>(null);

  /* -------------------------------------------------------------------------- */
  /*                               useEffect Hook                               */
  /*         Loads the Google Maps API and initializes map/services/etc.         */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    pointsOfInterest.map(point => fetchAudio(point));
  }, [pointsOfInterest])

  useEffect(() => {
    const loader = new Loader({
      apiKey: GOOGLE_MAPS_API_KEY,
      version: "weekly",
      libraries: ["places"],
    });

    loader.load().then(() => {
      if (!mapRef.current) return;

      // Initialize the map
      const mapInstance = new google.maps.Map(mapRef.current, {
        center: { lat: 40.7128, lng: -74.006 }, // Default to New York
        zoom: 12,
        mapTypeControl: false,
        disableDefaultUI: true,
      });
      setMap(mapInstance);

      // Initialize directions service and renderer
      const dsInstance = new google.maps.DirectionsService();
      const drInstance = new google.maps.DirectionsRenderer({
        map: mapInstance,
        suppressMarkers: false,
      });
      setDirectionsService(dsInstance);
      setDirectionsRenderer(drInstance);

      // Initialize places service
      const psInstance = new google.maps.places.PlacesService(mapInstance);
      setPlacesService(psInstance);

      // Initialize autocomplete for start and end inputs
      if (startInputRef.current && endInputRef.current) {
        const startAutoInst = new google.maps.places.Autocomplete(startInputRef.current, {
          fields: ["geometry", "name", "formatted_address"],
        });
        const endAutoInst = new google.maps.places.Autocomplete(endInputRef.current, {
          fields: ["geometry", "name", "formatted_address"],
        });
        setStartAutocomplete(startAutoInst);
        setEndAutocomplete(endAutoInst);
      }
    });
  }, []);

  /* -------------------------------------------------------------------------- */
  /*                                Helper Functions                             */
  /* -------------------------------------------------------------------------- */

//replace sapce with underscore

  const nameParser = (poi: any) => {
    console.log(poi.name);
    return poi.name.split(" ").join("_");
  }

  const fetchAudio = async (place: string) => {
    let poi = nameParser(place)
    await fetch(`http://127.0.0.1:3100/get-location-info?place=${poi}`)
    .then(response => response)
    .then(data => console.log(data.json()))
    // .then(blob => {
    //   const audioUrl = URL.createObjectURL(blob);
    //   const audioElement = new Audio(audioUrl);
    //   audioElement.play();
    // });
  }


  // Extracts a detailed list of LatLng points from the DirectionsRoute.
  function getRoutePathPoints(route: google.maps.DirectionsRoute): google.maps.LatLng[] {
    const points: google.maps.LatLng[] = [];
    route?.legs?.forEach((leg) => {
      leg?.steps?.forEach((step) => {
        step.path?.forEach((point) => {
          points.push(point);
        });
      });
    });
    return points;
  }

  // Finds points of interest along a given route.
  async function findPointsOfInterest(route: google.maps.DirectionsRoute) {
    if (!placesService || !map) return;

    // Get detailed path points
    const routePoints = getRoutePathPoints(route);

    // If we don't have enough detail, fall back to overview path
    const pathPoints = routePoints.length > 10 ? routePoints : route.overview_path;

    const allPOIs: any[] = [];
    const newMarkers: google.maps.Marker[] = [];

    // Create a polyline for distance checks
    const routePath = new google.maps.Polyline({
      path: pathPoints,
      geodesic: true,
    });

    // Maximum allowed distance from route (in meters)
    const MAX_DISTANCE_FROM_ROUTE = 1000;

    // Sample the route at intervals for searching
    const routeLength = route.legs.reduce((sum, leg) => sum + (leg.distance?.value || 0), 0);
    const numPoints = Math.max(3, Math.floor(routeLength / 10000)); // 1 sample each 10km, min 3
    const searchPoints: google.maps.LatLng[] = [];

    for (let i = 0; i < numPoints; i++) {
      const fraction = i / (numPoints - 1);
      const routeIndex = Math.floor(fraction * (routePoints.length - 1));
      searchPoints.push(routePoints[routeIndex]);
    }

    // Perform a placesService.nearbySearch at each sample point
    const searchPromises = searchPoints.map((point) => {
      return new Promise<void>((resolve) => {
        const request: google.maps.places.PlaceSearchRequest = {
          location: point,
          radius: 2000, // 2km radius
          type: "tourist_attraction", // or any other type
        };

        placesService.nearbySearch(request, (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            results.forEach((place) => {
              if (!place.geometry?.location) return;

              // Avoid duplicates
              if (allPOIs.some((poi) => poi.place_id === place.place_id)) {
                return;
              }

              // Check if the place is within our route corridor
              const isOnRoute = google.maps.geometry.poly.isLocationOnEdge(
                place.geometry.location,
                routePath,
                MAX_DISTANCE_FROM_ROUTE / 1e6 // degrees approximation
              );

              // Create a marker if it's close to the route
              if (isOnRoute) {
                allPOIs.push(place);

                const marker = new google.maps.Marker({
                  position: place.geometry.location,
                  map,
                  title: place.name,
                  icon: {
                    url: place.icon ?? "", // Fallback to empty if undefined
                    scaledSize: new google.maps.Size(24, 24),
                  },                  
                });

                // Info window
                const infoWindow = new google.maps.InfoWindow({
                  content: `<div><strong>${place.name}</strong><br>${place.vicinity}</div>`,
                });

                marker.addListener("click", () => {
                  infoWindow.open(map, marker);
                });

                newMarkers.push(marker);
              }
            });
          }
          resolve();
        });
      });
    });

    await Promise.all(searchPromises);
    setPointsOfInterest(allPOIs);
    setMarkers(newMarkers);
    setIsLoading(false);
  }

  // Calculates a walking route between Start and End inputs, then finds POIs.
  function calculateRoute() {
    // Ensure we have everything needed
    if (!directionsService || !directionsRenderer || !placesService) return;
    if (!startInputRef.current || !endInputRef.current) return;

    // Reset loading & data
    setIsLoading(true);
    markers.forEach((marker) => marker.setMap(null));
    setMarkers([]);
    setPointsOfInterest([]);

    const startValue = startInputRef.current.value;
    const endValue = endInputRef.current.value;

    if (!startValue || !endValue) {
      alert("Please enter both start and destination locations");
      setIsLoading(false);
      return;
    }

    // Request route
    directionsService.route(
      {
        origin: startValue,
        destination: endValue,
        travelMode: google.maps.TravelMode.WALKING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          directionsRenderer.setDirections(result);
          const route = result.routes[0];
          findPointsOfInterest(route);
        } else {
          alert("Could not calculate route: " + status);
          setIsLoading(false);
        }
      }
    );
  }

  /* -------------------------------------------------------------------------- */
  /*                                   Render                                    */
  /* -------------------------------------------------------------------------- */

  return (
    <div className="flex flex-col md:flex-row h-screen">
      {/* Left panel */}
      <div className="w-full md:w-1/3 p-4 overflow-y-auto">
        {/* Header / Input Section */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-4">Route Planner</h1>
          <div className="space-y-4">
            {/* Starting Point */}
            <div className="space-y-2">
              <label htmlFor="start" className="block text-sm font-medium">
                Starting Point
              </label>
              <div className="relative">
                <MapPin className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="start"
                  ref={startInputRef}
                  placeholder="Enter starting location"
                  className="pl-8"
                />
              </div>
            </div>

            {/* Destination */}
            <div className="space-y-2">
              <label htmlFor="destination" className="block text-sm font-medium">
                Destination
              </label>
              <div className="relative">
                <Navigation className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="destination"
                  ref={endInputRef}
                  placeholder="Enter destination"
                  className="pl-8"
                />
              </div>
            </div>

            {/* Calculate Button */}
            <Button onClick={calculateRoute} className="w-full" disabled={isLoading}>
              {isLoading ? "Calculating..." : "Calculate Route"}
            </Button>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Points of Interest */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Search className="mr-2 h-5 w-5" />
            Points of Interest
            {pointsOfInterest.length > 0 && (
              <span className="ml-2 text-sm text-muted-foreground">
                ({pointsOfInterest.length})
              </span>
            )}
          </h2>

          {isLoading ? (
            <div className="text-center py-8">Loading points of interest...</div>
          ) : pointsOfInterest.length > 0 ? (
            <div className="space-y-3">
              {pointsOfInterest.map((poi, index) => (
                <Card key={poi.place_id || index} className="overflow-hidden">
                  <CardContent className="p-3">
                    <div>
                      <h3 className="font-medium">{poi.name}</h3>
                      <p className="text-sm text-muted-foreground">{poi.vicinity}</p>
                      {poi.rating && (
                        <div className="flex items-center mt-1">
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <svg
                                key={i}
                                className={`w-4 h-4 ${
                                  i < Math.floor(poi.rating) ? "text-yellow-400" : "text-gray-300"
                                }`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="ml-1 text-xs text-muted-foreground">
                            {poi.rating} ({poi.user_ratings_total || 0})
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Calculate a route to see points of interest
            </div>
          )}
        </div>
      </div>

      {/* Right panel - Map */}
      <div className="w-full md:w-2/3 h-[50vh] md:h-screen">
        <div ref={mapRef} className="w-full h-full" />
      </div>
    </div>
  );
}
