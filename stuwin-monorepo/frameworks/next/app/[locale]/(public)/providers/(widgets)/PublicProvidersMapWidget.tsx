"use client";

import {
  useState,
  useEffect,
  useRef
} from 'react';
import mapboxgl
  from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Link } from '@/i18n/routing';

interface ProviderLocation {
  latitude: number;
  longitude: number;
  address?: string;
}

interface Provider {
  id: string;
  title: string;
  location?: ProviderLocation;
}

interface PublicProvidersMapWidgetProps {
  Providers?: Provider[];
}

export function PublicProvidersMapWidget({ Providers = [] }: PublicProvidersMapWidgetProps) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [49.8671, 40.4093], // Baku coordinates
      zoom: 10
    });

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    // Cleanup
    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (!mapLoaded || !map.current) return;

    // Clear existing markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Filter Providers with valid location coordinates
    const ProvidersWithLocation = Providers.filter(
      Provider => Provider.location?.latitude && Provider.location?.longitude
    );

    if (ProvidersWithLocation.length === 0) return;

    // Add markers for each Provider
    ProvidersWithLocation.forEach(Provider => {
      const { latitude, longitude } = Provider.location!;

      // Create popup content
      const popupContent = `
        <div class="p-2">
          <h3 class="font-semibold text-sm mb-1">${Provider.title}</h3>
          ${Provider.location!.address ? `<p class="text-xs text-gray-600 mb-2">${Provider.location!.address}</p>` : ''}
          <a 
            href="/providers/${Provider.id}" 
            class="text-xs text-brand hover:underline"
          >
            Ətraflı bax
          </a>
        </div>
      `;

      // Create popup
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: true,
        closeOnClick: false
      }).setHTML(popupContent);

      // Create marker
      const marker = new mapboxgl.Marker({
        color: '#ff0032'
      })
        .setLngLat([longitude, latitude])
        .setPopup(popup)
        .addTo(map.current!);

      markers.current.push(marker);
    });

    // Fit map to markers bounds
    if (ProvidersWithLocation.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();

      ProvidersWithLocation.forEach(Provider => {
        bounds.extend([
          Provider.location!.longitude,
          Provider.location!.latitude
        ]);
      });

      map.current!.fitBounds(bounds, {
        padding: 50,
        maxZoom: 15
      });
    }
  }, [mapLoaded, Providers]);

  if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
    return (
      <div className="w-full h-[500px] bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Xəritə mövcud deyil</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[500px] rounded-lg overflow-hidden border border-gray-200">
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
}

