import { LocationPoint, RouteGeometry, VehicleType } from '../types/route';
import {
  BANGLADESH_LOCATIONS,
  NATORE_TO_BANDARBAN_TRACK
} from '../data/bangladeshLocations';
import {
  haversineDistance,
  computeCumulativeDistances,
  calculateBounds,
  densifyRoute
} from '../utils/geoUtils';

// In-memory cache for fast lookups
const routeCache = new Map<string, RouteGeometry>();

/**
 * Search locations within Bangladesh:
 * 1. Immediate local matching across all 64 districts and major travel spots
 * 2. Optional remote query to Nominatim OpenStreetMap (restricted to BD)
 */
export async function searchLocations(query: string): Promise<LocationPoint[]> {
  const cleanQ = query.trim().toLowerCase();
  if (!cleanQ) {
    return BANGLADESH_LOCATIONS.slice(0, 10);
  }

  // Local filter
  const localMatches = BANGLADESH_LOCATIONS.filter(
    loc =>
      loc.name.toLowerCase().includes(cleanQ) ||
      loc.district.toLowerCase().includes(cleanQ) ||
      loc.division.toLowerCase().includes(cleanQ) ||
      (loc.bnName && loc.bnName.includes(cleanQ))
  );

  // If local matches exist, return them prioritized
  if (localMatches.length > 0) {
    return localMatches;
  }

  // Fallback to remote Nominatim geocoding if query is specific
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=bd&limit=6&q=${encodeURIComponent(
      query + ', Bangladesh'
    )}`;

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept-Language': 'en,bn'
      }
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map((item: any, idx: number) => {
          const parts = item.display_name.split(',').map((s: string) => s.trim());
          const name = parts[0] || 'Location';
          const district = parts[1] || 'Bangladesh';
          return {
            id: `osm-${item.place_id || idx}`,
            name,
            district,
            division: 'Bangladesh',
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            description: parts.slice(1, 4).join(', ')
          };
        });
      }
    }
  } catch {
    // Ignore network error and return nearest fallback
  }

  return BANGLADESH_LOCATIONS.slice(0, 5);
}

/**
 * Generate synthetic realistic road waypoints if OSRM is unreachable
 */
function generateRealisticRoadPath(
  start: LocationPoint,
  dest: LocationPoint
): [number, number][] {
  // If Natore -> Bandarban or reversed, use the verified track
  if (
    (start.id === 'natore' && dest.id === 'bandarban') ||
    (start.name.toLowerCase().includes('natore') &&
      dest.name.toLowerCase().includes('bandarban'))
  ) {
    return NATORE_TO_BANDARBAN_TRACK;
  }

  if (
    (start.id === 'bandarban' && dest.id === 'natore') ||
    (start.name.toLowerCase().includes('bandarban') &&
      dest.name.toLowerCase().includes('natore'))
  ) {
    return [...NATORE_TO_BANDARBAN_TRACK].reverse();
  }

  // Check known major corridors
  const sName = start.name.toLowerCase();
  const dName = dest.name.toLowerCase();

  // Helper coordinate waypoints
  const DHAKA: [number, number] = [90.4125, 23.8103];
  const KANCHPUR: [number, number] = [90.5200, 23.7100];
  const MEGHNA_BRIDGE: [number, number] = [90.6200, 23.6000];
  const DAUDKANDI: [number, number] = [90.7200, 23.5400];
  const CUMILLA: [number, number] = [91.1788, 23.4682];
  const FENI: [number, number] = [91.3976, 23.0159];
  const SITAKUNDA: [number, number] = [91.6600, 22.6200];
  const CHITTAGONG: [number, number] = [91.7832, 22.3569];
  const KERANIHAT: [number, number] = [92.1400, 22.1550];
  const COX_BAZAR: [number, number] = [92.0058, 21.4272];
  const BANDARBAN: [number, number] = [92.2185, 22.1953];
  const SAJEK: [number, number] = [92.2938, 23.3820];
  const KHAGRACHHARI: [number, number] = [91.9847, 23.1193];

  const NARSINGDI: [number, number] = [90.7200, 23.9200];
  const BHAIRAB: [number, number] = [90.9800, 24.0500];
  const SREEMANGAL: [number, number] = [91.7296, 24.3065];
  const SYLHET: [number, number] = [91.8687, 24.8949];

  const JAMUNA_BRIDGE: [number, number] = [89.7850, 24.3980];
  const TANGAIL: [number, number] = [89.9167, 24.2513];
  const GAZIPUR: [number, number] = [90.4203, 23.9999];
  const SIRAJGANJ: [number, number] = [89.7008, 24.4534];
  const BOGURA: [number, number] = [89.3777, 24.8465];
  const RANGPUR: [number, number] = [89.2752, 25.7439];
  const NATORE: [number, number] = [88.9740, 24.4102];
  const RAJSHAHI: [number, number] = [88.6042, 24.3745];

  const PADMA_BRIDGE: [number, number] = [90.2600, 23.4700];
  const BHANGA: [number, number] = [89.9800, 23.3800];
  const BARISHAL: [number, number] = [90.3535, 22.7010];
  const KHULNA: [number, number] = [89.5403, 22.8456];
  const KUAKATA: [number, number] = [90.1167, 21.8167];

  const coords: [number, number][] = [[start.lng, start.lat]];

  // Detect Chittagong / Cox's Bazar / Bandarban / Sajek route from Dhaka/West
  const isSouthEast = (p: LocationPoint) => p.lng > 91.0 && p.lat < 23.8;
  const isSylhetRegion = (p: LocationPoint) => p.lng > 91.2 && p.lat >= 23.8;
  const isNorthWest = (p: LocationPoint) => p.lng < 89.8 && p.lat > 23.8;
  const isSouthWest = (p: LocationPoint) => p.lng < 90.3 && p.lat <= 23.6;

  // 1. Going from or to North-West (Rajshahi, Natore, Bogura, Rangpur)
  if (isNorthWest(start) && !isNorthWest(dest)) {
    if (start.lat < 24.6) coords.push(NATORE);
    coords.push(SIRAJGANJ);
    coords.push(JAMUNA_BRIDGE);
    coords.push(TANGAIL);
    coords.push(GAZIPUR);
    coords.push(DHAKA);
  }

  // 2. Going to North-West from other regions
  if (!isNorthWest(start) && isNorthWest(dest)) {
    coords.push(DHAKA);
    coords.push(GAZIPUR);
    coords.push(TANGAIL);
    coords.push(JAMUNA_BRIDGE);
    coords.push(SIRAJGANJ);
    if (dest.lat < 24.6) coords.push(NATORE);
  }

  // 3. Going from or to South-East (Chattogram, Cox's Bazar, Bandarban)
  if (isSouthEast(dest) && !isSouthEast(start)) {
    if (coords[coords.length - 1][0] !== DHAKA[0]) coords.push(DHAKA);
    coords.push(KANCHPUR);
    coords.push(MEGHNA_BRIDGE);
    coords.push(DAUDKANDI);
    coords.push(CUMILLA);
    coords.push(FENI);
    coords.push(SITAKUNDA);
    coords.push(CHITTAGONG);

    if (dest.id === 'bandarban' || dName.includes('bandarban')) {
      coords.push(KERANIHAT);
      coords.push(BANDARBAN);
    } else if (dest.id === 'coxs-bazar' || dName.includes('cox')) {
      coords.push(KERANIHAT);
      coords.push(COX_BAZAR);
    }
  }

  // 4. Going from South-East to other regions
  if (isSouthEast(start) && !isSouthEast(dest)) {
    if (start.id === 'bandarban' || sName.includes('bandarban')) {
      coords.push(BANDARBAN);
      coords.push(KERANIHAT);
    } else if (start.id === 'coxs-bazar' || sName.includes('cox')) {
      coords.push(COX_BAZAR);
      coords.push(KERANIHAT);
    }
    coords.push(CHITTAGONG);
    coords.push(SITAKUNDA);
    coords.push(FENI);
    coords.push(CUMILLA);
    coords.push(DAUDKANDI);
    coords.push(MEGHNA_BRIDGE);
    coords.push(KANCHPUR);
    coords.push(DHAKA);
  }

  // 5. Sylhet / Sreemangal corridor
  if (isSylhetRegion(dest) && !isSylhetRegion(start)) {
    if (coords[coords.length - 1][0] !== DHAKA[0]) coords.push(DHAKA);
    coords.push(NARSINGDI);
    coords.push(BHAIRAB);
    if (dest.id === 'sreemangal' || dName.includes('sreemangal')) {
      coords.push(SREEMANGAL);
    } else {
      coords.push(SREEMANGAL);
      coords.push(SYLHET);
    }
  }

  // 6. South-West via Padma Bridge (Barishal, Khulna, Kuakata)
  if (isSouthWest(dest) && !isSouthWest(start)) {
    if (coords[coords.length - 1][0] !== DHAKA[0]) coords.push(DHAKA);
    coords.push(PADMA_BRIDGE);
    coords.push(BHANGA);
    if (dName.includes('barishal') || dName.includes('kuakata')) {
      coords.push(BARISHAL);
      if (dName.includes('kuakata')) coords.push(KUAKATA);
    } else {
      coords.push(KHULNA);
    }
  }

  // Final destination
  coords.push([dest.lng, dest.lat]);

  // Remove potential duplicate consecutive points
  const cleanCoords: [number, number][] = [];
  for (const pt of coords) {
    if (
      cleanCoords.length === 0 ||
      Math.abs(cleanCoords[cleanCoords.length - 1][0] - pt[0]) > 0.005 ||
      Math.abs(cleanCoords[cleanCoords.length - 1][1] - pt[1]) > 0.005
    ) {
      cleanCoords.push(pt);
    }
  }

  // Densify with Catmull-Rom smooth curves
  return densifyRoute(cleanCoords, 2.0);
}

/**
 * Fetch road route between two locations using OSRM with fallback
 */
export async function getRoadRoute(
  start: LocationPoint,
  dest: LocationPoint
): Promise<RouteGeometry> {
  const cacheKey = `${start.lat.toFixed(4)},${start.lng.toFixed(4)}->${dest.lat.toFixed(4)},${dest.lng.toFixed(4)}`;

  if (routeCache.has(cacheKey)) {
    return routeCache.get(cacheKey)!;
  }

  // 1. Try public OSRM driving service
  let coordinates: [number, number][] = [];
  let distanceKm = 0;
  let durationMinutes = 0;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson&steps=false`;

    const res = await fetch(osrmUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        coordinates = route.geometry.coordinates as [number, number][];
        distanceKm = Math.round(route.distance / 1000);
        durationMinutes = Math.round(route.duration / 60);
      }
    }
  } catch {
    // OSRM failed or timed out, will fall through to synthetic realistic route
  }

  // 2. If OSRM failed or had too few points, use verified road path
  if (coordinates.length < 5) {
    const rawPath = generateRealisticRoadPath(start, dest);
    coordinates = densifyRoute(rawPath, 2.0);

    // Calculate distance
    let total = 0;
    for (let i = 0; i < coordinates.length - 1; i++) {
      total += haversineDistance(coordinates[i], coordinates[i + 1]);
    }
    // Road factor (highways in BD curve ~25% more than Euclidean)
    distanceKm = Math.max(15, Math.round(total * 1.15));
    // Average speed ~48 km/h in Bangladesh highways with traffic/ferries
    durationMinutes = Math.round((distanceKm / 48) * 60);
  }

  // Create milestone waypoints along route
  const waypoints = generateMilestones(start, dest, coordinates);

  const bounds = calculateBounds(coordinates, 0.12);

  const geometry: RouteGeometry = {
    coordinates,
    distanceKm,
    durationMinutes,
    bounds,
    waypoints
  };

  routeCache.set(cacheKey, geometry);
  return geometry;
}

/**
 * Generate high-altitude smooth flight route for Airplane
 */
export function getFlightRoute(
  start: LocationPoint,
  dest: LocationPoint
): RouteGeometry {
  const directDist = haversineDistance([start.lng, start.lat], [dest.lng, dest.lat]);
  const distanceKm = Math.max(20, Math.round(directDist));
  // Airplane cruising at ~650 km/h with 15m takeoff/landing
  const durationMinutes = Math.max(30, Math.round((distanceKm / 650) * 60) + 15);

  const numPoints = 80;
  const coordinates: [number, number][] = [];

  // Elegant flight curve across Bangladesh skies
  const dx = dest.lng - start.lng;
  const dy = dest.lat - start.lat;
  const perpX = -dy * 0.09;
  const perpY = dx * 0.09;

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const arcHeight = Math.sin(t * Math.PI);
    const lng = (1 - t) * start.lng + t * dest.lng + perpX * arcHeight;
    const lat = (1 - t) * start.lat + t * dest.lat + perpY * arcHeight;
    coordinates.push([lng, lat]);
  }

  const waypoints = [
    { name: `Takeoff from ${start.name}`, lng: start.lng, lat: start.lat, progress: 0.0 },
    { name: `Ascending to 28,000 ft`, lng: coordinates[20][0], lat: coordinates[20][1], progress: 0.25 },
    { name: `Cruising above Bangladesh skies`, lng: coordinates[40][0], lat: coordinates[40][1], progress: 0.5 },
    { name: `Descent approach towards ${dest.district || dest.name}`, lng: coordinates[60][0], lat: coordinates[60][1], progress: 0.75 },
    { name: `Touchdown at ${dest.name}!`, lng: dest.lng, lat: dest.lat, progress: 1.0 }
  ];

  const bounds = calculateBounds(coordinates, 0.15);

  return {
    coordinates,
    distanceKm,
    durationMinutes,
    bounds,
    waypoints
  };
}

/**
 * Main route resolver for any vehicle (Car, Bus, Train, Motorcycle, Airplane)
 */
export async function getRoute(
  start: LocationPoint,
  dest: LocationPoint,
  vehicle: VehicleType = 'car'
): Promise<RouteGeometry> {
  if (vehicle === 'airplane') {
    return getFlightRoute(start, dest);
  }
  return getRoadRoute(start, dest);
}

/**
 * Generate human-friendly travel milestones
 */
function generateMilestones(
  start: LocationPoint,
  dest: LocationPoint,
  coords: [number, number][]
) {
  const milestones: {
    name: string;
    lng: number;
    lat: number;
    progress: number;
  }[] = [];

  // Start
  milestones.push({
    name: `Departing ${start.name}`,
    lng: coords[0][0],
    lat: coords[0][1],
    progress: 0.0
  });

  // Intermediate milestones
  const midIndex = Math.floor(coords.length / 2);
  const quarterIndex = Math.floor(coords.length / 4);
  const threeQuarterIndex = Math.floor((coords.length * 3) / 4);

  if (coords.length > 10) {
    milestones.push({
      name: `Cruising National Highway`,
      lng: coords[quarterIndex][0],
      lat: coords[quarterIndex][1],
      progress: 0.25
    });

    milestones.push({
      name: `Midway Crossing`,
      lng: coords[midIndex][0],
      lat: coords[midIndex][1],
      progress: 0.5
    });

    milestones.push({
      name: `Approaching ${dest.district || dest.name}`,
      lng: coords[threeQuarterIndex][0],
      lat: coords[threeQuarterIndex][1],
      progress: 0.75
    });
  }

  // Destination
  const lastIdx = coords.length - 1;
  milestones.push({
    name: `Arrived at ${dest.name}!`,
    lng: coords[lastIdx][0],
    lat: coords[lastIdx][1],
    progress: 1.0
  });

  return milestones;
}
