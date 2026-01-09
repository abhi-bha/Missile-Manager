// Example Map component that reads token from NEXT_PUBLIC_* env var.
// Adapt this to your map library (Mapbox GL / react-map-gl / leaflet). This example uses mapbox-gl directly.
import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';

// Make sure token is available as NEXT_PUBLIC_MAPBOX_TOKEN in Vercel
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

export default function Map() {
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    // If token is missing, log helpful message
    if (!mapboxgl.accessToken) {
      console.error('Mapbox token is missing. Set NEXT_PUBLIC_MAPBOX_TOKEN in Vercel or .env.local');
      return;
    }

    // create map only on client
    mapRef.current = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/dark-v10', // change to your style
      center: [-98.5795, 39.8283],
      zoom: 2.0,
    });

    return () => {
      if (mapRef.current) mapRef.current.remove();
    };
  }, []);

  return (
    <div style={{ width: '100%', height: '800px' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
