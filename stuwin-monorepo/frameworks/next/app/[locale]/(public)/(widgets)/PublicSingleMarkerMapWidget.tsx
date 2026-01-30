'use client'

import React, {
  useEffect,
  useRef
} from 'react';
import mapboxgl
  from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Assuming your Mapbox access token is set correctly in environment variables
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

type Location = {
  lat: number;
  lng: number;
};

type PublicSingleMarkerMapWidgetProps = {
  location?: Location;
};

const PublicSingleMarkerMapWidget = ({ location }: PublicSingleMarkerMapWidgetProps) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number' || !mapContainerRef.current) {
      // If location is not provided or invalid, do not attempt to render the map
      return;
    }

    const { lat, lng } = location;

    // Initialize map
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v11', // Example Mapbox style
      center: [lng, lat],
      zoom: 8,
    });

    // Add navigation control (zoom in/out buttons)
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add marker to map
    new mapboxgl.Marker()
      .setLngLat([lng, lat])
      .addTo(map);

    // Clean up on unmount
    return () => map.remove();
  }, [location]); // Dependency array to re-run effect if location changes

  if (!location) {
    // Optionally, render a placeholder or nothing if location is not provided
    return null; // or <div>Location not provided</div>
  }

  return <div ref={mapContainerRef} className="map-container" style={{ height: '400px', width: '100%' }} />;
};

export default PublicSingleMarkerMapWidget;
export { PublicSingleMarkerMapWidget };
