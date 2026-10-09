"use client";

/* Loads the Google Maps JavaScript API from a script tag and drops a marker
   on each office. The legacy site hardcoded its API key directly in
   contact.html (a known issue) and always rendered the <script> tag, so a
   blocked/missing key just produced a blank grey box. Here the key comes
   from NEXT_PUBLIC_GOOGLE_MAPS_API_KEY, and when it is absent we render a
   static fallback (addresses + "View on map" links) instead of loading the
   script at all. */

import { useEffect, useRef, useState } from "react";
import styles from "./contact.module.css";
import type { Location } from "./content";

declare global {
  interface Window {
    google?: {
      maps: {
        Map: new (el: HTMLElement, opts: Record<string, unknown>) => unknown;
        Marker: new (opts: Record<string, unknown>) => unknown;
        LatLngBounds: new () => {
          extend: (pos: { lat: number; lng: number }) => void;
        };
      };
    };
  }
}

const SCRIPT_ID = "kzd-google-maps-script";

function mapsSearchUrl(address: string): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(address)}`;
}

export default function Map({ locations }: { locations: Location[] }) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!apiKey || !containerRef.current) return;

    let cancelled = false;

    function render() {
      if (cancelled || !containerRef.current || !window.google) return;
      const { google } = window;
      const map = new google.maps.Map(containerRef.current, {
        center: { lat: locations[0]?.lat ?? 0, lng: locations[0]?.lng ?? 0 },
        zoom: 12,
      });
      const bounds = new google.maps.LatLngBounds();
      for (const loc of locations) {
        const pos = { lat: loc.lat, lng: loc.lng };
        new google.maps.Marker({ position: pos, map, title: loc.name });
        bounds.extend(pos);
      }
    }

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;

    if (window.google) {
      render();
      return;
    }

    if (existing) {
      existing.addEventListener("load", render);
      existing.addEventListener("error", () => setFailed(true));
      return () => {
        existing.removeEventListener("load", render);
      };
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", render);
    script.addEventListener("error", () => setFailed(true));
    document.body.appendChild(script);

    return () => {
      cancelled = true;
      script.removeEventListener("load", render);
    };
  }, [apiKey, locations]);

  if (!apiKey || failed) {
    return (
      <div className={styles.mapFallback}>
        <h3 className={styles.mapFallbackTitle}>Find us on the map</h3>
        <p className={styles.mapFallbackBody}>
          The interactive map isn&apos;t available right now — here are both addresses instead.
        </p>
        <ul className={styles.mapFallbackList}>
          {locations.map((loc) => (
            <li className={styles.mapFallbackItem} key={loc.name}>
              <p className={styles.mapFallbackName}>{loc.name}</p>
              <p className={styles.mapFallbackAddr}>{loc.address}</p>
              <a
                className={styles.mapFallbackLink}
                href={mapsSearchUrl(loc.address)}
                target="_blank"
                rel="noopener noreferrer"
              >
                View on map
              </a>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={styles.mapCanvas}
      role="img"
      aria-label="Map showing KZD Solutions office locations in Durban"
    />
  );
}
