import React, {
    useEffect,
    useRef
} from 'react';
import mapboxgl
    from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

type PublicMapBoxWidgetProps = {
    containerHeight: string;
};

const PublicMapBoxWidget = ({ containerHeight }: PublicMapBoxWidgetProps) => {
    const mapContainer = useRef<HTMLDivElement | null>(null);
    const map = useRef<mapboxgl.Map | null>(null);

    useEffect(() => {
        // Initialize map only once
        if (map.current || !mapContainer.current) return;

        const brandColor = (typeof window !== 'undefined'
            ? getComputedStyle(document.documentElement)
                .getPropertyValue('--sg-brand')
                .trim()
            : '') || '#005aff';

        mapboxgl.accessToken = 'pk.eyJ1IjoiZ2FnYXNoZXMiLCJhIjoiY2xoa3k1OGp1MHFhMDNmb3hrNnMwbDNueCJ9.x5B4eELi1JD9bc109ph2dQ';

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/gagashes/clhkyv6bt01ov01p6esxs5v4h',
            center: [49.8424767, 40.3802289],
            zoom: 15
        });

        // Wait for map to load before adding marker
        map.current.on('load', () => {
            // Add marker
            if (map.current) {
                new mapboxgl.Marker({
                    color: brandColor,
                    scale: 1.2 // Make it slightly larger
                })
                    .setLngLat([49.8424767, 40.3802289])
                    .addTo(map.current);
            }
        });

        // Clean up on unmount
        return () => {
            if (map.current) map.current.remove();
        };
    }, []);

    return (
        <div
            ref={mapContainer}
            style={{
                height: `${containerHeight}vh`,
                width: '100%'
            }}
            className='w-full col-span-12'
        />
    );
}

export default PublicMapBoxWidget;
