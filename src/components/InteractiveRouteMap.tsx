import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as maplibregl from 'maplibre-gl';
import {
  JourneyConfig,
  LocationPoint,
  RouteGeometry,
  MapTheme,
  VehicleType
} from '../types/route';
import {
  computeCumulativeDistances,
  getInterpolatedState,
  getArticulatedTrainStates,
  getShortestAngleDiff,
  haversineDistance
} from '../utils/geoUtils';
import { BANGLADESH_LOCATIONS } from '../data/bangladeshLocations';
import { CarIcon, BusIcon, TrainIcon, MotorcycleIcon, AirplaneIcon } from '../utils/vehicleIcons';
import {
  Play,
  Pause,
  RotateCcw,
  Eye,
  Maximize2,
  Volume2,
  VolumeX,
  Gauge,
  Navigation,
  MapPin,
  Share2
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface InteractiveRouteMapProps {
  config: JourneyConfig;
  route: RouteGeometry;
  isPlaying: boolean;
  onTogglePlay: () => void;
  progress: number;
  onSeek: (progress: number) => void;
  onComplete?: () => void;
  cameraMode?: 'follow' | 'overview';
  onToggleCameraMode?: () => void;
  onSelectLocation?: (location: LocationPoint, type: 'start' | 'destination') => void;
  onOpenShare?: () => void;
  heightClass?: string;
}

// High-contrast, professional satellite and topographic map styles highlighting Bangladesh's geography
const MAP_STYLES: Record<MapTheme, any> = {
  // 1. High-contrast Topographic & Shaded Relief with 3D Terrain DEM (Vivid terrain contours, river deltas, hills)
  classic: {
    version: 8,
    sources: {
      'topo-tiles': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}'
        ],
        tileSize: 256,
        attribution: '© Esri Topographic, USGS, Garmin, Bangladesh Survey'
      },
      'relief-overlay': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}'
        ],
        tileSize: 256
      },
      'terrain-dem': {
        type: 'raster-dem',
        tiles: [
          'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'
        ],
        encoding: 'terrarium',
        tileSize: 256,
        maxzoom: 15
      },
      'transport-overlay': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}'
        ],
        tileSize: 256
      },
      'labels-overlay': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'
        ],
        tileSize: 256
      }
    },
    layers: [
      {
        id: 'topo-tiles-layer',
        type: 'raster',
        source: 'topo-tiles',
        minzoom: 0,
        maxzoom: 19,
        paint: {
          'raster-contrast': 0.12,
          'raster-saturation': 0.15
        }
      },
      {
        id: 'relief-overlay-layer',
        type: 'raster',
        source: 'relief-overlay',
        minzoom: 0,
        maxzoom: 19,
        paint: {
          'raster-opacity': 0.42,
          'raster-contrast': 0.3
        }
      },
      {
        id: 'hills-shading',
        type: 'hillshade',
        source: 'terrain-dem',
        paint: {
          'hillshade-exaggeration': 0.7,
          'hillshade-shadow-color': '#0f172a',
          'hillshade-highlight-color': '#ffffff',
          'hillshade-accent-color': '#334155',
          'hillshade-illumination-direction': 315
        }
      },
      {
        id: 'transport-overlay-layer',
        type: 'raster',
        source: 'transport-overlay',
        minzoom: 0,
        maxzoom: 19,
        paint: {
          'raster-opacity': 0.75
        }
      },
      {
        id: 'labels-overlay-layer',
        type: 'raster',
        source: 'labels-overlay',
        minzoom: 0,
        maxzoom: 19
      }
    ]
  },
  // 2. High-Contrast Cinematic Satellite Hybrid (Lush delta imagery, rivers, ocean, road network & place names)
  satellite: {
    version: 8,
    sources: {
      'esri-satellite': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        ],
        tileSize: 256,
        attribution: '© Esri, Maxar, Earthstar Geographics'
      },
      'terrain-dem': {
        type: 'raster-dem',
        tiles: [
          'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'
        ],
        encoding: 'terrarium',
        tileSize: 256,
        maxzoom: 15
      },
      'esri-transportation': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}'
        ],
        tileSize: 256
      },
      'esri-places': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'
        ],
        tileSize: 256
      }
    },
    layers: [
      {
        id: 'satellite-base',
        type: 'raster',
        source: 'esri-satellite',
        minzoom: 0,
        maxzoom: 19,
        paint: {
          'raster-contrast': 0.18,
          'raster-saturation': 0.22
        }
      },
      {
        id: 'satellite-hills',
        type: 'hillshade',
        source: 'terrain-dem',
        paint: {
          'hillshade-exaggeration': 0.5,
          'hillshade-shadow-color': '#020617',
          'hillshade-highlight-color': '#ffffff',
          'hillshade-illumination-direction': 315
        }
      },
      {
        id: 'satellite-roads',
        type: 'raster',
        source: 'esri-transportation',
        minzoom: 0,
        maxzoom: 19,
        paint: {
          'raster-opacity': 0.88
        }
      },
      {
        id: 'satellite-places',
        type: 'raster',
        source: 'esri-places',
        minzoom: 0,
        maxzoom: 19
      }
    ]
  },
  // 3. Dark Travel (High-contrast Night Road Map)
  dark: {
    version: 8,
    sources: {
      'dark-tiles': {
        type: 'raster',
        tiles: [
          'https://a.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png',
          'https://b.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png',
          'https://c.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png'
        ],
        tileSize: 256,
        attribution: '© CARTO, OpenStreetMap'
      }
    },
    layers: [
      {
        id: 'dark-tiles-layer',
        type: 'raster',
        source: 'dark-tiles',
        minzoom: 0,
        maxzoom: 19
      }
    ]
  },
  // 4. Minimal Clean (Voyager Road Map)
  minimal: {
    version: 8,
    sources: {
      'voyager-tiles': {
        type: 'raster',
        tiles: [
          'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
          'https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
          'https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png'
        ],
        tileSize: 256,
        attribution: '© CARTO, OpenStreetMap'
      }
    },
    layers: [
      {
        id: 'voyager-tiles-layer',
        type: 'raster',
        source: 'voyager-tiles',
        minzoom: 0,
        maxzoom: 19
      }
    ]
  }
};

export const InteractiveRouteMap: React.FC<InteractiveRouteMapProps> = ({
  config,
  route,
  isPlaying,
  onTogglePlay,
  progress,
  onSeek,
  onComplete,
  cameraMode = 'overview',
  onToggleCameraMode,
  onSelectLocation,
  onOpenShare,
  heightClass = 'h-[520px]'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const vehicleMarkerRef = useRef<maplibregl.Marker | null>(null);
  const coachMarkersRef = useRef<maplibregl.Marker[]>([]);
  const startMarkerRef = useRef<maplibregl.Marker | null>(null);
  const destMarkerRef = useRef<maplibregl.Marker | null>(null);
  const vehicleElementRef = useRef<HTMLDivElement | null>(null);

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentSpeed, setCurrentSpeed] = useState(65);
  const [currentMilestone, setCurrentMilestone] = useState('');
  const hasTriggeredArrivalRef = useRef(false);

  // Map pin drop state
  const [isDropPinActive, setIsDropPinActive] = useState(false);
  const [droppedPoint, setDroppedPoint] = useState<{
    lng: number;
    lat: number;
    name: string;
    district: string;
  } | null>(null);
  const dropMarkerRef = useRef<maplibregl.Marker | null>(null);

  // Continuous smoothed rotation angle to prevent 360-degree flip glitch
  const smoothAngleRef = useRef<number>(0);

  // Cumulative distances for interpolation
  const cumulativeDistances = useRef<number[]>([]);

  useEffect(() => {
    cumulativeDistances.current = computeCumulativeDistances(route.coordinates);
  }, [route]);

  // Fit bounds helper
  const fitRouteBounds = useCallback(
    (map: maplibregl.Map) => {
      const { minLng, minLat, maxLng, maxLat } = route.bounds;
      map.fitBounds(
        [
          [minLng, minLat],
          [maxLng, maxLat]
        ],
        {
          padding: { top: 70, bottom: 90, left: 60, right: 60 },
          duration: 1200,
          maxZoom: 13
        }
      );
    },
    [route.bounds]
  );

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initialCenter: [number, number] = [
      (route.bounds.minLng + route.bounds.maxLng) / 2,
      (route.bounds.minLat + route.bounds.maxLat) / 2
    ];

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLES[config.mapTheme] || MAP_STYLES.classic,
      center: initialCenter,
      zoom: 7.5,
      pitch: 48, // 3D isometric perspective view
      maxPitch: 85,
      attributionControl: false
    } as any);

    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      'bottom-right'
    );
    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    mapRef.current = map;

    map.on('load', () => {
      // 0. Enable 3D terrain elevation for Bangladesh topography
      if (config.mapTheme === 'classic' || config.mapTheme === 'satellite') {
        try {
          if (typeof (map as any).setTerrain === 'function') {
            (map as any).setTerrain({
              source: 'terrain-dem',
              exaggeration: 2.2
            });
          }
        } catch (err) {
          console.warn('3D terrain setup:', err);
        }
      }

      // 0b. Cinematic atmospheric sky & horizon
      try {
        if (typeof (map as any).setSky === 'function') {
          (map as any).setSky({
            'sky-color': config.mapTheme === 'dark' ? '#0f172a' : '#93c5fd',
            'horizon-color': config.mapTheme === 'dark' ? '#1e293b' : '#e0f2fe',
            'fog-color': config.mapTheme === 'dark' ? '#020617' : '#f8fafc',
            'horizon-fog-blend': 0.6
          });
        }
      } catch (_) {}

      // 1. Add background full planned route (faint dashed)
      map.addSource('route-full', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: route.coordinates
          }
        }
      });

      map.addLayer({
        id: 'route-full-casing',
        type: 'line',
        source: 'route-full',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#dc2626',
          'line-opacity': 0.25,
          'line-width': 4,
          'line-dasharray': [3, 3]
        }
      });

      // 2. Add revealed animated path (vibrant red with drop shadow)
      map.addSource('route-revealed', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [route.coordinates[0]]
          }
        }
      });

      map.addLayer({
        id: 'route-revealed-glow',
        type: 'line',
        source: 'route-revealed',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': config.routeColor || '#dc2626',
          'line-width': 8,
          'line-opacity': 0.4,
          'line-blur': 3
        }
      });

      // 2b. Add Railway Track Sleeper Ties Layer (Bangladesh Railway track visualization)
      map.addLayer({
        id: 'route-rail-ties',
        type: 'line',
        source: 'route-revealed',
        layout: {
          'line-join': 'miter',
          'line-cap': 'butt',
          visibility: config.vehicle === 'train' ? 'visible' : 'none'
        },
        paint: {
          'line-color': '#0f172a',
          'line-width': 9,
          'line-dasharray': [0.25, 0.75]
        }
      });

      map.addLayer({
        id: 'route-revealed-line',
        type: 'line',
        source: 'route-revealed',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': config.vehicle === 'train' ? '#cbd5e1' : (config.routeColor || '#dc2626'),
          'line-width': config.vehicle === 'train' ? 3.5 : 5,
          'line-opacity': 0.95
        }
      });

      // 3. Create Start Marker
      const startEl = document.createElement('div');
      startEl.className =
        'flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[11px] font-bold shadow-lg border border-white select-none cursor-pointer';
      startEl.innerHTML = `<span>🟢</span><span>${config.startLocation.name}</span>`;

      startMarkerRef.current = new maplibregl.Marker({
        element: startEl,
        anchor: 'bottom'
      })
        .setLngLat(route.coordinates[0])
        .addTo(map);

      // 4. Create Destination Marker
      const destEl = document.createElement('div');
      destEl.className =
        'flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-600 text-white text-[11px] font-bold shadow-lg border border-white select-none cursor-pointer';
      destEl.innerHTML = `<span>🏁</span><span>${config.destination.name}</span>`;

      const lastIdx = route.coordinates.length - 1;
      destMarkerRef.current = new maplibregl.Marker({
        element: destEl,
        anchor: 'bottom'
      })
        .setLngLat(route.coordinates[lastIdx])
        .addTo(map);

      // 5. Create Vehicle Marker (Contains 3D Vehicle + Floating Distance Pill)
      const vehicleEl = document.createElement('div');
      vehicleEl.className =
        'vehicle-marker-wrapper pointer-events-none select-none z-20';
      vehicleElementRef.current = vehicleEl;

      updateVehicleDOM(vehicleEl, config.vehicle);

      vehicleMarkerRef.current = new maplibregl.Marker({
        element: vehicleEl,
        anchor: 'center'
      })
        .setLngLat(route.coordinates[0])
        .addTo(map);

      // 5b. Create Articulated Train Coach Markers (3 connected bogies with couplers)
      coachMarkersRef.current.forEach(m => m.remove());
      coachMarkersRef.current = [];

      for (let i = 0; i < 3; i++) {
        const coachEl = document.createElement('div');
        coachEl.className =
          'coach-marker-wrapper pointer-events-none select-none z-10';
        coachEl.style.display = config.vehicle === 'train' ? 'block' : 'none';

        const isLast = i === 2;
        coachEl.innerHTML = `
          <div class="coach-rotator flex items-center justify-center">
            <svg viewBox="0 0 38 18" class="w-9 h-4.5 drop-shadow-md overflow-visible">
              <!-- Front Coupler / Accordion Gangway (কানেক্টিং কাপলিং) -->
              <rect x="0" y="6" width="4" height="6" rx="1" fill="#1E293B"/>
              <line x1="1" y1="9" x2="3" y2="9" stroke="#94A3B8" stroke-width="1.5"/>
              <!-- Bangladesh Railway Green Carriage Body -->
              <rect x="4" y="2" width="30" height="14" rx="2.5" fill="#065F46"/>
              <rect x="4" y="7.5" width="30" height="2.5" fill="#F59E0B"/>
              <!-- Passenger Windows -->
              <rect x="7" y="3.5" width="4" height="3" rx="0.5" fill="#0F172A"/>
              <rect x="13" y="3.5" width="4" height="3" rx="0.5" fill="#0F172A"/>
              <rect x="19" y="3.5" width="4" height="3" rx="0.5" fill="#0F172A"/>
              <rect x="25" y="3.5" width="4" height="3" rx="0.5" fill="#0F172A"/>
              <rect x="7" y="11.5" width="4" height="3" rx="0.5" fill="#0F172A"/>
              <rect x="13" y="11.5" width="4" height="3" rx="0.5" fill="#0F172A"/>
              <rect x="19" y="11.5" width="4" height="3" rx="0.5" fill="#0F172A"/>
              <rect x="25" y="11.5" width="4" height="3" rx="0.5" fill="#0F172A"/>
              <!-- Rear Connector / Safety Marker Lights on last bogie -->
              ${
                isLast
                  ? '<circle cx="33" cy="5" r="1.5" fill="#EF4444"/><circle cx="33" cy="13" r="1.5" fill="#EF4444"/>'
                  : '<rect x="34" y="6.5" width="3" height="5" rx="0.8" fill="#1E293B"/>'
              }
            </svg>
          </div>
        `;

        const marker = new maplibregl.Marker({
          element: coachEl,
          anchor: 'center'
        })
          .setLngLat(route.coordinates[0])
          .addTo(map);

        coachMarkersRef.current.push(marker);
      }

      // Fit bounds
      fitRouteBounds(map);

      // 6. Map Click Handler for Dropping Pins
      map.on('click', (e) => {
        let closestLoc = BANGLADESH_LOCATIONS[0];
        let minDist = 999999;
        for (const loc of BANGLADESH_LOCATIONS) {
          const d = haversineDistance(
            [e.lngLat.lng, e.lngLat.lat],
            [loc.lng, loc.lat]
          );
          if (d < minDist) {
            minDist = d;
            closestLoc = loc;
          }
        }

        const pointName = minDist < 35 ? closestLoc.name : `${closestLoc.name} Area`;
        const pointDistrict = closestLoc.district;

        setDroppedPoint({
          lng: e.lngLat.lng,
          lat: e.lngLat.lat,
          name: pointName,
          district: pointDistrict
        });

        // Update visual drop marker
        if (dropMarkerRef.current) {
          dropMarkerRef.current.setLngLat(e.lngLat);
        } else {
          const pinEl = document.createElement('div');
          pinEl.className =
            'flex items-center justify-center text-rose-500 animate-bounce pointer-events-none select-none';
          pinEl.innerHTML = `
            <svg viewBox="0 0 24 24" class="w-8 h-8 fill-rose-600 stroke-white stroke-2 drop-shadow-2xl">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              <circle cx="12" cy="9" r="2.5" fill="white"/>
            </svg>
          `;
          dropMarkerRef.current = new maplibregl.Marker({
            element: pinEl,
            anchor: 'bottom'
          })
            .setLngLat(e.lngLat)
            .addTo(map);
        }
      });
    });

    return () => {
      coachMarkersRef.current.forEach(m => m.remove());
      coachMarkersRef.current = [];
      map.remove();
      mapRef.current = null;
      if (dropMarkerRef.current) {
        dropMarkerRef.current.remove();
        dropMarkerRef.current = null;
      }
    };
  }, [config.mapTheme, route]);

  // Update vehicle appearance when vehicle type changes
  const updateVehicleDOM = (el: HTMLElement, vehicle: VehicleType) => {
    let iconSvg = '';
    if (vehicle === 'car') {
      // TravelBoast 3D Retro Red Car with Purple Roof Luggage
      iconSvg = `
        <svg viewBox="0 0 52 30" class="w-14 h-8 drop-shadow-xl overflow-visible">
          <!-- Wheels -->
          <rect x="7" y="2" width="9" height="4" rx="2" fill="#0F172A"/>
          <rect x="33" y="2" width="9" height="4" rx="2" fill="#0F172A"/>
          <rect x="7" y="24" width="9" height="4" rx="2" fill="#0F172A"/>
          <rect x="33" y="24" width="9" height="4" rx="2" fill="#0F172A"/>
          <!-- Car Body (Retro Red) -->
          <rect x="2" y="5" width="46" height="20" rx="5" fill="#DC2626"/>
          <!-- Chrome Bumpers -->
          <rect x="46" y="7" width="3" height="16" rx="1.5" fill="#E2E8F0"/>
          <rect x="1" y="7" width="2.5" height="16" rx="1" fill="#E2E8F0"/>
          <!-- Windshields -->
          <rect x="29" y="7" width="11" height="16" rx="2" fill="#0F172A"/>
          <rect x="6" y="8" width="6" height="14" rx="1.5" fill="#0F172A"/>
          <!-- Roof Rack -->
          <rect x="14" y="6" width="14" height="18" rx="1" stroke="#1E293B" stroke-width="1.2" fill="none"/>
          <!-- Purple Luggage on Roof (TravelBoast style) -->
          <rect x="15" y="7" width="12" height="16" rx="3" fill="#9333EA"/>
          <rect x="18" y="7" width="1.5" height="16" fill="#FBBF24"/>
          <rect x="23" y="7" width="1.5" height="16" fill="#FBBF24"/>
          <!-- Headlights -->
          <circle cx="46" cy="9" r="2" fill="#FEF08A"/>
          <circle cx="46" cy="21" r="2" fill="#FEF08A"/>
        </svg>
      `;
    } else if (vehicle === 'train') {
      // Locomotive Engine (Aerodynamic green & gold head with rear coupler)
      iconSvg = `
        <svg viewBox="0 0 46 24" class="w-12 h-6 drop-shadow-xl overflow-visible">
          <!-- Rear coupler to Coach 1 -->
          <rect x="0" y="9" width="3" height="6" rx="1" fill="#1E293B"/>
          <!-- Main Engine Cab -->
          <rect x="3" y="3" width="30" height="18" rx="4" fill="#065F46"/>
          <!-- Aerodynamic Nose -->
          <path d="M30 3H38C42 3 44 8 44 12C44 16 42 21 38 21H30V3Z" fill="#047857"/>
          <!-- Livery Stripe -->
          <rect x="3" y="10.5" width="40" height="3" fill="#F59E0B"/>
          <!-- Windshield & Windows -->
          <rect x="27" y="5.5" width="7" height="4.5" rx="1" fill="#0F172A"/>
          <rect x="8" y="5.5" width="6" height="3.5" rx="0.5" fill="#1E293B"/>
          <!-- Headlight -->
          <circle cx="43" cy="12" r="2.5" fill="#FEF08A"/>
        </svg>
      `;
    } else if (vehicle === 'motorcycle') {
      // Adventure Motorbike with Rider
      iconSvg = `
        <svg viewBox="0 0 38 22" class="w-10 h-6 drop-shadow-xl overflow-visible">
          <rect x="25" y="9" width="8" height="4" rx="2" fill="#0F172A"/>
          <rect x="5" y="9" width="8" height="4" rx="2" fill="#0F172A"/>
          <rect x="12" y="8" width="14" height="6" rx="2" fill="#EA580C"/>
          <rect x="22" y="4" width="3" height="14" rx="1" fill="#334155"/>
          <circle cx="17" cy="11" r="4" fill="#0284C7"/>
          <circle cx="18" cy="11" r="3" fill="#F8FAFC"/>
          <circle cx="32" cy="11" r="2" fill="#FEF08A"/>
        </svg>
      `;
    } else if (vehicle === 'airplane') {
      // High-altitude Airplane with Flight Shadow and Contrails
      iconSvg = `
        <svg viewBox="0 0 54 54" class="w-14 h-14 drop-shadow-2xl overflow-visible">
          <!-- Flight Altitude Drop Shadow -->
          <ellipse cx="22" cy="36" rx="20" ry="7" fill="rgba(0, 0, 0, 0.28)"/>
          <!-- Vapor Contrails -->
          <path d="M14 21 L-8 19" stroke="rgba(255, 255, 255, 0.75)" stroke-width="2.5" stroke-linecap="round"/>
          <path d="M14 33 L-8 35" stroke="rgba(255, 255, 255, 0.75)" stroke-width="2.5" stroke-linecap="round"/>
          <!-- Delta Swept Wings -->
          <path d="M26 27 L10 5 L5 5 L14 24 L14 30 L5 49 L10 49 L26 27 Z" fill="#E2E8F0" stroke="#94A3B8" stroke-width="1"/>
          <!-- Jet Turbines under wings -->
          <rect x="13" y="16" width="10" height="4" rx="2" fill="#334155"/>
          <rect x="13" y="34" width="10" height="4" rx="2" fill="#334155"/>
          <!-- Horizontal Stabilizers -->
          <path d="M4 27 L-4 16 L-7 16 L-2 27 L-7 38 L-4 38 Z" fill="#CBD5E1"/>
          <!-- Fuselage Body facing East -->
          <path d="M46 27 C42 22 34 21 16 21 L-2 23 L-8 27 L-2 31 L16 33 C34 33 42 32 46 27 Z" fill="#FFFFFF" stroke="#94A3B8" stroke-width="1"/>
          <!-- Cockpit Glass -->
          <path d="M38 24.5 C40 25.5 40 28.5 38 29.5 L34 29 L34 25 Z" fill="#0F172A"/>
          <!-- Passenger Windows -->
          <circle cx="28" cy="23.5" r="1" fill="#38BDF8"/>
          <circle cx="24" cy="23.5" r="1" fill="#38BDF8"/>
          <circle cx="20" cy="23.5" r="1" fill="#38BDF8"/>
          <circle cx="16" cy="23.5" r="1" fill="#38BDF8"/>
          <circle cx="28" cy="30.5" r="1" fill="#38BDF8"/>
          <circle cx="24" cy="30.5" r="1" fill="#38BDF8"/>
          <circle cx="20" cy="30.5" r="1" fill="#38BDF8"/>
          <circle cx="16" cy="30.5" r="1" fill="#38BDF8"/>
          <!-- Wingtip Strobes (Red Port, Green Starboard) -->
          <circle cx="8" cy="5" r="1.5" fill="#EF4444"/>
          <circle cx="8" cy="49" r="1.5" fill="#10B981"/>
          <!-- Red Tail Livery Accent -->
          <rect x="-4" y="26" width="6" height="2" rx="1" fill="#DC2626"/>
        </svg>
      `;
    } else {
      // Bus
      iconSvg = `
        <svg viewBox="0 0 54 28" class="w-14 h-8 drop-shadow-xl overflow-visible">
          <rect x="2" y="4" width="46" height="20" rx="4" fill="#0284C7"/>
          <rect x="5" y="6" width="40" height="16" rx="2" fill="#F8FAFC"/>
          <rect x="36" y="8" width="7" height="12" rx="1" fill="#0F172A"/>
          <rect x="28" y="7" width="5" height="4" rx="1" fill="#0F172A"/>
          <rect x="20" y="7" width="5" height="4" rx="1" fill="#0F172A"/>
          <rect x="12" y="7" width="5" height="4" rx="1" fill="#0F172A"/>
          <circle cx="46" cy="7" r="2" fill="#FEF08A"/>
          <circle cx="46" cy="21" r="2" fill="#FEF08A"/>
        </svg>
      `;
    }

    el.innerHTML = `
      <div class="relative flex flex-col items-center justify-center">
        <div class="vehicle-rotator flex items-center justify-center">
          ${iconSvg}
        </div>
        <div class="route-distance-pill mt-1 px-2 py-0.5 rounded-lg bg-red-600 text-white font-extrabold text-[11px] shadow-lg border border-white whitespace-nowrap tabular-nums pointer-events-none">
          0 km
        </div>
      </div>
    `;

    // Toggle coach markers visibility
    coachMarkersRef.current.forEach(m => {
      const cel = m.getElement();
      if (cel) {
        cel.style.display = vehicle === 'train' ? 'block' : 'none';
      }
    });
  };

  useEffect(() => {
    if (vehicleElementRef.current) {
      updateVehicleDOM(vehicleElementRef.current, config.vehicle);
    }

    const map = mapRef.current;
    if (map && map.isStyleLoaded()) {
      if (map.getLayer('route-rail-ties')) {
        map.setLayoutProperty(
          'route-rail-ties',
          'visibility',
          config.vehicle === 'train' ? 'visible' : 'none'
        );
      }
      if (map.getLayer('route-revealed-line')) {
        map.setPaintProperty(
          'route-revealed-line',
          'line-color',
          config.vehicle === 'train' ? '#cbd5e1' : (config.routeColor || '#dc2626')
        );
        map.setPaintProperty(
          'route-revealed-line',
          'line-width',
          config.vehicle === 'train' ? 3.5 : 5
        );
      }
    }
  }, [config.vehicle]);

  // Update route line colors if changed
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    if (map.getLayer('route-revealed-line')) {
      map.setPaintProperty(
        'route-revealed-line',
        'line-color',
        config.vehicle === 'train' ? '#cbd5e1' : (config.routeColor || '#dc2626')
      );
    }
    if (map.getLayer('route-revealed-glow')) {
      map.setPaintProperty(
        'route-revealed-glow',
        'line-color',
        config.routeColor || '#dc2626'
      );
    }
  }, [config.routeColor, config.vehicle]);

  // Realistic Curve Movement & Smooth Heading Alignment
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded() || cumulativeDistances.current.length === 0)
      return;

    // Evaluate position along smooth Catmull-Rom road curve and get continuous tangent bearing
    const state = getInterpolatedState(
      route.coordinates,
      cumulativeDistances.current,
      progress
    );

    if (config.vehicle === 'train') {
      // ARTICULATED TRAIN: Compute independent positions & tangent angles for locomotive + 3 coaches
      const bogieStates = getArticulatedTrainStates(
        route.coordinates,
        cumulativeDistances.current,
        progress,
        3
      );

      // 1. Position & rotate Locomotive (states[0])
      if (vehicleMarkerRef.current && bogieStates[0]) {
        vehicleMarkerRef.current.setLngLat(bogieStates[0].position);
      }

      if (vehicleElementRef.current && bogieStates[0]) {
        const targetRotation = bogieStates[0].bearing - 90;
        const diff = getShortestAngleDiff(smoothAngleRef.current, targetRotation);
        smoothAngleRef.current += diff * 0.45;

        const rotator = vehicleElementRef.current.querySelector(
          '.vehicle-rotator'
        ) as HTMLElement;
        if (rotator) {
          rotator.style.transform = `rotate(${smoothAngleRef.current}deg)`;
        }

        const pill = vehicleElementRef.current.querySelector('.route-distance-pill');
        if (pill) {
          pill.textContent = `${Math.round(progress * route.distanceKm)} km`;
        }
      }

      // 2. Position & rotate each trailing coach independently to snake through curves
      bogieStates.slice(1).forEach((bogie, idx) => {
        const marker = coachMarkersRef.current[idx];
        if (marker) {
          marker.setLngLat(bogie.position);
          const cEl = marker.getElement();
          if (cEl) {
            cEl.style.display = 'block';
            const rotator = cEl.querySelector('.coach-rotator') as HTMLElement;
            if (rotator) {
              rotator.style.transform = `rotate(${bogie.bearing - 90}deg)`;
            }
          }
        }
      });
    } else {
      // STANDARD VEHICLES (Car, Bus, Motorcycle, Airplane)
      // Hide coach markers
      coachMarkersRef.current.forEach(m => {
        const cel = m.getElement();
        if (cel) cel.style.display = 'none';
      });

      // 1. Move vehicle marker smoothly
      if (vehicleMarkerRef.current) {
        vehicleMarkerRef.current.setLngLat(state.position);
      }

      // 2. Continuous rotation damping:
      const targetRotation = state.bearing - 90;
      const diff = getShortestAngleDiff(smoothAngleRef.current, targetRotation);
      smoothAngleRef.current += diff * 0.4; // smooth damping into corners

      if (vehicleElementRef.current) {
        const rotator = vehicleElementRef.current.querySelector(
          '.vehicle-rotator'
        ) as HTMLElement;
        if (rotator) {
          rotator.style.transform = `rotate(${smoothAngleRef.current}deg)`;
        }

        // Update floating red distance pill
        const pill = vehicleElementRef.current.querySelector('.route-distance-pill');
        if (pill) {
          pill.textContent = `${Math.round(progress * route.distanceKm)} km`;
        }
      }
    }

    // 3. Update revealed path GeoJSON
    const revealedSource = map.getSource(
      'route-revealed'
    ) as maplibregl.GeoJSONSource;
    if (revealedSource) {
      revealedSource.setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: state.slicedCoords
        }
      });
    }

    // 4. Camera Follow Mode (Follows vehicle smoothly with 3D pitch)
    if (cameraMode === 'follow') {
      map.easeTo({
        center: state.position,
        duration: isPlaying ? 180 : 350,
        zoom: 9.8,
        pitch: 52,
        bearing: smoothAngleRef.current * 0.4 // gentle heading track
      });
    }

    // 5. Update Speed & Milestones
    if (progress > 0.02 && progress < 0.98) {
      const simulatedSpeed = Math.round(52 + Math.sin(progress * 25) * 16);
      setCurrentSpeed(simulatedSpeed);
    } else {
      setCurrentSpeed(0);
    }

    // Determine current milestone
    const activeMilestone = route.waypoints.find(
      (wp, idx) =>
        progress >= wp.progress &&
        (idx === route.waypoints.length - 1 ||
          progress < route.waypoints[idx + 1].progress)
    );
    if (activeMilestone) {
      setCurrentMilestone(activeMilestone.name);
    }

    // 6. Arrival celebration trigger
    if (progress >= 0.99 && !hasTriggeredArrivalRef.current) {
      hasTriggeredArrivalRef.current = true;
      if (soundEnabled) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 }
        });
      }
      if (onComplete) {
        onComplete();
      }
    } else if (progress < 0.95) {
      hasTriggeredArrivalRef.current = false;
    }
  }, [progress, cameraMode, isPlaying, route, soundEnabled, onComplete]);

  // Handle immediate camera mode switch
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    if (cameraMode === 'overview') {
      fitRouteBounds(map);
    } else if (cumulativeDistances.current.length > 0) {
      const state = getInterpolatedState(
        route.coordinates,
        cumulativeDistances.current,
        progress
      );
      map.easeTo({
        center: state.position,
        zoom: 9.8,
        pitch: 52,
        duration: 700
      });
    }
  }, [cameraMode, fitRouteBounds]);

  // Handle overview reset
  const handleResetOverview = () => {
    if (mapRef.current) {
      mapRef.current.easeTo({ pitch: 48, bearing: 0, duration: 600 });
      fitRouteBounds(mapRef.current);
    }
  };

  const distanceTravelled = Math.round(progress * route.distanceKm);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-xl">
      {/* Map Canvas Container */}
      <div ref={mapContainerRef} className={`w-full ${heightClass}`} />

      {/* Dropped Location Selection Card */}
      {droppedPoint && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 bg-slate-900/95 text-white rounded-2xl shadow-2xl border border-slate-700/80 p-4 flex flex-col gap-2.5 min-w-[270px] backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-xs flex items-center gap-1.5 text-amber-400">
              <MapPin className="w-4 h-4" />
              ম্যাপে লোকেশন ড্রপ
            </span>
            <button
              onClick={() => {
                setDroppedPoint(null);
                if (dropMarkerRef.current) {
                  dropMarkerRef.current.remove();
                  dropMarkerRef.current = null;
                }
              }}
              className="text-slate-400 hover:text-white text-xs px-1.5 py-0.5 rounded cursor-pointer"
            >
              ✕
            </button>
          </div>
          <div>
            <div className="text-sm font-bold text-slate-100">{droppedPoint.name}</div>
            <div className="text-[11px] text-slate-400">{droppedPoint.district}, বাংলাদেশ</div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              onClick={() => {
                onSelectLocation?.(
                  {
                    id: `drop-${Date.now()}`,
                    name: droppedPoint.name,
                    district: droppedPoint.district,
                    division: 'Bangladesh',
                    lat: droppedPoint.lat,
                    lng: droppedPoint.lng
                  },
                  'start'
                );
                setDroppedPoint(null);
                setIsDropPinActive(false);
              }}
              className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs text-center transition-colors shadow-sm cursor-pointer"
            >
              🟢 শুরু (Start)
            </button>
            <button
              onClick={() => {
                onSelectLocation?.(
                  {
                    id: `drop-${Date.now()}`,
                    name: droppedPoint.name,
                    district: droppedPoint.district,
                    division: 'Bangladesh',
                    lat: droppedPoint.lat,
                    lng: droppedPoint.lng
                  },
                  'destination'
                );
                setDroppedPoint(null);
                setIsDropPinActive(false);
              }}
              className="py-1.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs text-center transition-colors shadow-sm cursor-pointer"
            >
              🏁 গন্তব্য (End)
            </button>
          </div>
        </div>
      )}

      {/* Top Floating Cinematic HUD */}
      <div className="pointer-events-none absolute top-4 left-4 right-4 flex items-start justify-between gap-4">
        {/* Journey Identity Pill */}
        <div className="pointer-events-auto flex items-center gap-3 rounded-xl bg-slate-900/85 px-4 py-2.5 backdrop-blur-md border border-slate-700/60 shadow-lg text-white">
          <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-rose-400">
              {config.startLocation.name} ➔ {config.destination.name}
            </div>
            <div className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>{currentMilestone || 'En Route'}</span>
            </div>
          </div>
        </div>

        {/* HUD Quick Tools */}
        <div className="pointer-events-auto flex items-center gap-1.5 rounded-xl bg-slate-900/85 p-1.5 backdrop-blur-md border border-slate-700/60 shadow-lg text-white">
          {/* Drop Pin Mode Button */}
          <button
            onClick={() => {
              const nextState = !isDropPinActive;
              setIsDropPinActive(nextState);
              if (mapRef.current) {
                mapRef.current.getCanvas().style.cursor = nextState ? 'crosshair' : '';
              }
            }}
            title="Click anywhere on the map to drop pin and select location"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              isDropPinActive
                ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300 font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {isDropPinActive ? 'ম্যাপে ক্লিক করুন' : 'পিন ড্রপ (Drop)'}
            </span>
          </button>

          {onToggleCameraMode && (
            <button
              onClick={onToggleCameraMode}
              title={
                cameraMode === 'follow' ? 'Switch to Route Overview' : 'Follow Vehicle (3D)'
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                cameraMode === 'follow'
                  ? 'bg-rose-500 text-white font-bold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {cameraMode === 'follow' ? '3D Follow' : 'Overview'}
              </span>
            </button>
          )}

          <button
            onClick={handleResetOverview}
            title="Reset Map Bounds"
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Mute Celebration' : 'Enable Celebration Sound'}
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            {soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5" />
            ) : (
              <VolumeX className="w-3.5 h-3.5" />
            )}
          </button>

          {onOpenShare && (
            <button
              onClick={onOpenShare}
              title="Share Route (শেয়ার)"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer ml-0.5"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Share</span>
            </button>
          )}
        </div>
      </div>

      {/* Floating Bottom Dashboard & Playback Controls */}
      <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-col gap-2 rounded-xl bg-slate-900/90 p-3.5 backdrop-blur-md border border-slate-700/60 shadow-2xl text-white">
        {/* Scrubber & Progress Bar */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono tabular-nums text-slate-400 w-12 text-right">
            {(progress * config.duration).toFixed(1)}s
          </span>

          <div className="relative flex-1 group">
            <input
              type="range"
              min="0"
              max="1"
              step="0.005"
              value={progress}
              onChange={e => onSeek(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500 focus:outline-none"
            />
            {/* Visual gradient fill overlay */}
            <div
              className="absolute top-0 left-0 h-2 bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500 rounded-lg pointer-events-none"
              style={{ width: `${progress * 100}%` }}
            />
          </div>

          <span className="text-xs font-mono tabular-nums text-slate-400 w-12">
            {config.duration}.0s
          </span>
        </div>

        {/* Playback Controls & Real-Time Telemetry */}
        <div className="flex items-center justify-between pt-1">
          {/* Main Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onTogglePlay}
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold transition-all shadow-md active:scale-95 cursor-pointer"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </button>

            <button
              onClick={() => onSeek(0)}
              title="Restart Journey"
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {onOpenShare && (
              <button
                onClick={onOpenShare}
                title="Share Journey Link & Image"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">শেয়ার (Share)</span>
              </button>
            )}

            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 text-xs">
              <span className="text-slate-400">Duration:</span>
              <span className="font-bold text-rose-400">{config.duration}s Reel</span>
            </div>
          </div>

          {/* Real-time stats */}
          <div className="flex items-center gap-4 text-xs font-mono">
            {config.showDistance && (
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Distance:</span>
                <span className="font-bold text-slate-100 tabular-nums">
                  {distanceTravelled} / {route.distanceKm} km
                </span>
              </div>
            )}

            {config.showSpeed && (
              <div className="hidden sm:flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-sky-400" />
                <span className="font-bold text-sky-400 tabular-nums">
                  {currentSpeed} km/h
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
