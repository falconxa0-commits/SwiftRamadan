'use client';

import { useEffect, useRef, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
  ZoomControl,
} from 'react-leaflet';
import L from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import { Bike, Store, MapPin } from 'lucide-react';

/* ──────────────────────────────────────────────────────────
   Types (mirror RealTimeTrackingModal)
   ────────────────────────────────────────────────────────── */

interface GeoPoint {
  lat: number;
  lng: number;
}

export interface LiveDeliveryState {
  orderId: string;
  rider: {
    name: string;
    phone: string;
    photo: string;
    rating: number;
    vehicle: string;
    color: string;
  };
  location: GeoPoint;
  heading: number;
  route: GeoPoint[];
  status: string;
  eta: number;
  progress: number;
  customer: GeoPoint;
  store: { name: string; lat: number; lng: number };
}

/* ──────────────────────────────────────────────────────────
   Custom Leaflet divIcons (rendered from React SVG markup)
   ────────────────────────────────────────────────────────── */

function makeRiderIcon(heading: number, color: string): L.DivIcon {
  const html = renderToStaticMarkup(
    <div style={{ position: 'relative', width: 36, height: 36 }}>
      <div className="sr-rider-halo sr-marker-pulse" />
      <div
        className="sr-rider-marker"
        style={{
          width: 36,
          height: 36,
          background: color,
          transform: `rotate(${heading}deg)`,
        }}
      >
        <Bike />
      </div>
    </div>
  );
  return L.divIcon({
    html,
    className: 'sr-rider-icon',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

const storeIcon = L.divIcon({
  html: renderToStaticMarkup(
    <div className="sr-store-marker" style={{ width: 28, height: 28 }}>
      <Store />
    </div>
  ),
  className: 'sr-store-icon',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const customerIcon = L.divIcon({
  html: renderToStaticMarkup(
    <div className="sr-customer-marker" style={{ width: 28, height: 28 }}>
      <MapPin />
    </div>
  ),
  className: 'sr-customer-icon',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
});

/* ──────────────────────────────────────────────────────────
   Helper: auto-fit map bounds when route changes
   ────────────────────────────────────────────────────────── */

function FitBounds({
  delivery,
}: {
  delivery: LiveDeliveryState | null;
}) {
  const map = useMap();
  const lastOrderId = useRef<string | null>(null);

  useEffect(() => {
    if (!delivery) return;
    // Only re-fit when the order changes (not on every location tick)
    if (lastOrderId.current === delivery.orderId) return;
    lastOrderId.current = delivery.orderId;

    const pts: L.LatLngExpression[] = [
      [delivery.store.lat, delivery.store.lng],
      [delivery.customer.lat, delivery.customer.lng],
      ...delivery.route.map((p) => [p.lat, p.lng] as [number, number]),
    ];
    const bounds = L.latLngBounds(pts);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
  }, [delivery, map]);

  return null;
}

/* ──────────────────────────────────────────────────────────
   Helper: smoothly pan to follow the rider when it moves
   ────────────────────────────────────────────────────────── */

function FollowRider({
  delivery,
}: {
  delivery: LiveDeliveryState | null;
}) {
  const map = useMap();
  const lastLoc = useRef<string>('');

  useEffect(() => {
    if (!delivery) return;
    const key = `${delivery.location.lat.toFixed(5)},${delivery.location.lng.toFixed(5)}`;
    if (key === lastLoc.current) return;
    lastLoc.current = key;

    // Smoothly pan to the rider's new position without zoom changes
    map.panTo([delivery.location.lat, delivery.location.lng], {
      animate: true,
      duration: 1.5,
    });
  }, [delivery, map]);

  return null;
}

/* ──────────────────────────────────────────────────────────
   Main LiveMap component
   ────────────────────────────────────────────────────────── */

export default function LiveMap({
  delivery,
  className = '',
}: {
  delivery: LiveDeliveryState | null;
  className?: string;
}) {
  // Pull the fields we need up front so React Compiler sees stable references
  const loc = delivery?.location;
  const heading = delivery?.heading;
  const riderColor = delivery?.rider?.color;
  const route = delivery?.route;
  const progress = delivery?.progress;

  // Center on Lagos by default; FitBounds will adjust once delivery loads
  const center: L.LatLngExpression = useMemo(
    () => (loc ? [loc.lat, loc.lng] : [6.45, 3.43]),
    [loc]
  );

  const riderIcon = useMemo(
    () => makeRiderIcon(heading ?? 0, riderColor ?? '#13ec13'),
    [heading, riderColor]
  );

  const routePositions: L.LatLngExpression[] = useMemo(() => {
    if (!route?.length) return [];
    return route.map((p) => [p.lat, p.lng]);
  }, [route]);

  const traveledPositions: L.LatLngExpression[] = useMemo(() => {
    if (!route?.length || !loc) return [];
    // Build the portion of the route the rider has already traversed
    const maxIdx = route.length - 1;
    const currentIdx = ((progress ?? 0) / 100) * maxIdx;
    const upTo = Math.max(1, Math.ceil(currentIdx));
    const pts: L.LatLngExpression[] = [
      [route[0].lat, route[0].lng],
    ];
    for (let i = 1; i <= upTo && i <= maxIdx; i++) {
      pts.push([route[i].lat, route[i].lng]);
    }
    // Add interpolated current position
    const frac = currentIdx - Math.floor(currentIdx);
    if (upTo < maxIdx && frac > 0) {
      const a = route[Math.floor(currentIdx)];
      const b = route[Math.floor(currentIdx) + 1];
      pts.push([
        a.lat + (b.lat - a.lat) * frac,
        a.lng + (b.lng - a.lng) * frac,
      ]);
    } else {
      pts.push([loc.lat, loc.lng]);
    }
    return pts;
  }, [route, progress, loc]);

  if (!delivery) {
    return (
      <div className={`relative bg-[#080c12] flex items-center justify-center ${className}`}>
        <div className="text-white/65 text-sm">Loading live map…</div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <MapContainer
        center={center}
        zoom={14}
        zoomControl={false}
        attributionControl
        className="h-full w-full"
        style={{ background: '#080c12' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <ZoomControl position="bottomright" />

        {/* Full route (dashed gold) */}
        {routePositions.length > 1 && (
          <Polyline
            positions={routePositions}
            pathOptions={{
              color: '#FFD700',
              weight: 4,
              opacity: 0.45,
              dashArray: '6 8',
              lineCap: 'round',
            }}
          />
        )}

        {/* Traveled portion (solid green, glowing) */}
        {traveledPositions.length > 1 && (
          <Polyline
            positions={traveledPositions}
            pathOptions={{
              color: '#13ec13',
              weight: 5,
              opacity: 0.9,
              lineCap: 'round',
            }}
          />
        )}

        {/* Store marker */}
        <Marker
          position={[delivery.store.lat, delivery.store.lng]}
          icon={storeIcon}
          title={delivery.store.name}
        />

        {/* Customer marker */}
        <Marker
          position={[delivery.customer.lat, delivery.customer.lng]}
          icon={customerIcon}
          title="Your location"
        />

        {/* Rider marker (animated position) */}
        <Marker
          position={[delivery.location.lat, delivery.location.lng]}
          icon={riderIcon}
          title={delivery.rider.name}
          zIndexOffset={1000}
        />

        <FitBounds delivery={delivery} />
        <FollowRider delivery={delivery} />
      </MapContainer>

      {/* Map overlay: legend */}
      <div className="absolute top-2 sm:top-3 left-2 sm:left-3 z-[500] bg-[var(--sr-surface-base)]/80 backdrop-blur-md rounded-xl border border-white/10 px-3 py-2 flex flex-col gap-1.5 pointer-events-none">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FFD700]" />
          <span className="text-white/70 text-[10px] font-medium">Route</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#13ec13]" />
          <span className="text-white/70 text-[10px] font-medium">Traveled</span>
        </div>
        <div className="flex items-center gap-2">
          <Bike className="w-3 h-3 text-[#13ec13]" />
          <span className="text-white/70 text-[10px] font-medium">Rider</span>
        </div>
      </div>

      {/* Map overlay: live badge */}
      <div className="absolute top-3 right-3 z-[500] bg-[#13ec13]/15 backdrop-blur-md rounded-full border border-[#13ec13]/40 px-3 py-1 flex items-center gap-1.5 pointer-events-none">
        <span className="w-1.5 h-1.5 rounded-full bg-[#13ec13] animate-pulse" />
        <span className="text-[#13ec13] text-[10px] font-bold uppercase tracking-wider">Live</span>
      </div>
    </div>
  );
}
