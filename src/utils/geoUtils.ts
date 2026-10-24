/**
 * Geospatial utilities for realistic road curve interpolation,
 * Catmull-Rom spline smoothing, and continuous tangent/heading calculation.
 */

// Convert degrees to radians
export function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

// Convert radians to degrees
export function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

// Shortest signed angular difference in degrees (-180 to +180)
export function getShortestAngleDiff(fromAngle: number, toAngle: number): number {
  let diff = (toAngle - fromAngle) % 360;
  if (diff < -180) diff += 360;
  if (diff > 180) diff -= 360;
  return diff;
}

// Smooth angle update that avoids 360-degree flip spinning
export function getContinuousAngle(currentAngle: number, targetAngle: number): number {
  const diff = getShortestAngleDiff(currentAngle, targetAngle);
  return currentAngle + diff;
}

// Haversine distance in kilometers between two [lng, lat] points
export function haversineDistance(
  coord1: [number, number],
  coord2: [number, number]
): number {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;

  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Total length of a coordinate line string in km
export function calculateTotalDistance(coords: [number, number][]): number {
  let dist = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    dist += haversineDistance(coords[i], coords[i + 1]);
  }
  return dist;
}

// Calculate bearing in degrees from point 1 to point 2 (0 = North, 90 = East, 180 = South, 270 = West)
export function calculateBearing(
  coord1: [number, number],
  coord2: [number, number]
): number {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;

  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const deltaLambda = toRad(lon2 - lon1);

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  const theta = Math.atan2(y, x);
  return (toDeg(theta) + 360) % 360;
}

/**
 * Centripetal Catmull-Rom spline interpolation between p1 and p2,
 * with guide points p0 and p3.
 * Returns interpolated position [lng, lat] and continuous tangent vector [dLng, dLat].
 */
function catmullRomPoint(
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
  t: number
): { point: [number, number]; tangent: [number, number] } {
  const t2 = t * t;
  const t3 = t2 * t;

  // Catmull-Rom Basis matrix (s = 0.5)
  // Position:
  const x =
    0.5 *
    (2 * p1[0] +
      (-p0[0] + p2[0]) * t +
      (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
      (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3);

  const y =
    0.5 *
    (2 * p1[1] +
      (-p0[1] + p2[1]) * t +
      (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
      (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3);

  // Exact First Derivative (Tangent vector):
  const dx =
    0.5 *
    ((-p0[0] + p2[0]) +
      2 * (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t +
      3 * (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t2);

  const dy =
    0.5 *
    ((-p0[1] + p2[1]) +
      2 * (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t +
      3 * (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t2);

  return { point: [x, y], tangent: [dx, dy] };
}

// Precompute cumulative distances along coordinates
export function computeCumulativeDistances(
  coords: [number, number][]
): number[] {
  const cum: number[] = [0];
  let total = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    total += haversineDistance(coords[i], coords[i + 1]);
    cum.push(total);
  }
  return cum;
}

/**
 * Realistic road curve interpolation:
 * Evaluates the vehicle's position along a smooth Catmull-Rom road curve,
 * calculating the true continuous tangent heading angle.
 */
export function getInterpolatedState(
  coords: [number, number][],
  cumulativeDistances: number[],
  progress: number
): {
  position: [number, number];
  bearing: number;
  slicedCoords: [number, number][];
  currentSegmentIndex: number;
} {
  if (coords.length === 0) {
    return {
      position: [0, 0],
      bearing: 0,
      slicedCoords: [],
      currentSegmentIndex: 0
    };
  }

  if (coords.length === 1 || progress <= 0) {
    const bearing = coords.length > 1 ? calculateBearing(coords[0], coords[1]) : 0;
    return {
      position: coords[0],
      bearing,
      slicedCoords: [coords[0]],
      currentSegmentIndex: 0
    };
  }

  if (progress >= 1) {
    const lastIdx = coords.length - 1;
    const bearing =
      coords.length > 1
        ? calculateBearing(coords[lastIdx - 1], coords[lastIdx])
        : 0;
    return {
      position: coords[lastIdx],
      bearing,
      slicedCoords: [...coords],
      currentSegmentIndex: lastIdx - 1
    };
  }

  const totalDist = cumulativeDistances[cumulativeDistances.length - 1];
  const targetDist = progress * totalDist;

  // Binary search for active segment
  let low = 0;
  let high = cumulativeDistances.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (cumulativeDistances[mid] <= targetDist) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  const segIdx = Math.max(0, Math.min(coords.length - 2, high));
  const segStartDist = cumulativeDistances[segIdx];
  const segEndDist = cumulativeDistances[segIdx + 1];
  const segLength = segEndDist - segStartDist;

  const t = segLength > 0 ? (targetDist - segStartDist) / segLength : 0;

  // Get 4 surrounding control points for Catmull-Rom spline
  const p1 = coords[segIdx];
  const p2 = coords[segIdx + 1];
  const p0 = segIdx > 0 ? coords[segIdx - 1] : [2 * p1[0] - p2[0], 2 * p1[1] - p2[1]] as [number, number];
  const p3 =
    segIdx + 2 < coords.length
      ? coords[segIdx + 2]
      : [2 * p2[0] - p1[0], 2 * p2[1] - p1[1]] as [number, number];

  // Evaluate smooth curve position and tangent vector
  const { point: curvePos, tangent } = catmullRomPoint(p0, p1, p2, p3, t);

  // Calculate true continuous tangent bearing
  // Account for latitude cos factor in spherical projection
  const latRad = toRad(curvePos[1]);
  const dx = tangent[0] * Math.cos(latRad);
  const dy = tangent[1];

  let continuousBearing = (toDeg(Math.atan2(dx, dy)) + 360) % 360;

  // If tangent is extremely small, fallback to direct segment bearing
  if (Math.abs(dx) < 1e-6 && Math.abs(dy) < 1e-6) {
    continuousBearing = calculateBearing(p1, p2);
  }

  // Slice road coordinates up to current segment, then append smooth curve position
  const sliced = coords.slice(0, segIdx + 1);
  sliced.push(curvePos);

  return {
    position: curvePos,
    bearing: continuousBearing,
    slicedCoords: sliced,
    currentSegmentIndex: segIdx
  };
}

export interface BogieState {
  index: number;
  isLocomotive: boolean;
  position: [number, number];
  bearing: number;
  progress: number;
}

/**
 * Computes destination coordinate given starting point, bearing, and distance in km
 */
export function getExtrapolatedPoint(
  origin: [number, number],
  bearingDeg: number,
  distKm: number
): [number, number] {
  const R = 6371; // Earth radius in km
  const dByR = distKm / R;
  const lat1 = toRad(origin[1]);
  const lon1 = toRad(origin[0]);
  const brng = toRad(bearingDeg);

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(dByR) +
    Math.cos(lat1) * Math.sin(dByR) * Math.cos(brng)
  );
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(brng) * Math.sin(dByR) * Math.cos(lat1),
      Math.cos(dByR) - Math.sin(lat1) * Math.sin(lat2)
    );

  return [toDeg(lon2), toDeg(lat2)];
}

/**
 * Computes individual positions and tangent bearings for each carriage of an articulated train
 * (Locomotive + trailing coaches) so they snake smoothly through curves.
 */
export function getArticulatedTrainStates(
  coords: [number, number][],
  cumulativeDistances: number[],
  progress: number,
  numCoaches: number = 3,
  spacingKm?: number
): BogieState[] {
  if (coords.length === 0 || cumulativeDistances.length === 0) return [];
  const totalDist = cumulativeDistances[cumulativeDistances.length - 1];

  // Visual spacing between coaches: between 5 km and 20 km proportional to route length
  // This matches visual coach width on screen and prevents coaches from overlapping inside engine
  const stepKm =
    spacingKm ?? Math.max(5.0, Math.min(20.0, totalDist * 0.042));
  const states: BogieState[] = [];

  const currentDist = progress * totalDist;
  const initBearing =
    coords.length > 1 ? calculateBearing(coords[0], coords[1]) : 0;
  const lastIdx = coords.length - 1;
  const finalBearing =
    coords.length > 1
      ? calculateBearing(coords[lastIdx - 1], coords[lastIdx])
      : 0;

  // 0: Locomotive, 1..numCoaches: Passenger bogies trailing behind
  for (let i = 0; i <= numCoaches; i++) {
    const targetDist = currentDist - i * stepKm;

    if (targetDist < 0) {
      // Extrapolate smoothly behind starting point along reverse bearing
      const backDist = Math.abs(targetDist);
      const pos = getExtrapolatedPoint(
        coords[0],
        (initBearing + 180) % 360,
        backDist
      );
      states.push({
        index: i,
        isLocomotive: i === 0,
        position: pos,
        bearing: initBearing,
        progress: totalDist > 0 ? targetDist / totalDist : 0
      });
    } else if (targetDist > totalDist) {
      // Extrapolate smoothly past destination along final bearing
      const forwardDist = targetDist - totalDist;
      const pos = getExtrapolatedPoint(
        coords[lastIdx],
        finalBearing,
        forwardDist
      );
      states.push({
        index: i,
        isLocomotive: i === 0,
        position: pos,
        bearing: finalBearing,
        progress: totalDist > 0 ? targetDist / totalDist : 1
      });
    } else {
      const carriageProgress = totalDist > 0 ? targetDist / totalDist : 0;
      const interpolated = getInterpolatedState(
        coords,
        cumulativeDistances,
        carriageProgress
      );
      states.push({
        index: i,
        isLocomotive: i === 0,
        position: interpolated.position,
        bearing: interpolated.bearing,
        progress: carriageProgress
      });
    }
  }

  return states;
}

/**
 * Densify and smooth coordinates by generating Catmull-Rom interpolated highway arcs
 */
export function densifyRoute(
  coords: [number, number][],
  maxSegmentKm: number = 1.2
): [number, number][] {
  if (coords.length < 2) return coords;

  const result: [number, number][] = [coords[0]];

  for (let i = 0; i < coords.length - 1; i++) {
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const dist = haversineDistance(p1, p2);

    const p0 = i > 0 ? coords[i - 1] : [2 * p1[0] - p2[0], 2 * p1[1] - p2[1]] as [number, number];
    const p3 =
      i + 2 < coords.length
        ? coords[i + 2]
        : [2 * p2[0] - p1[0], 2 * p2[1] - p1[1]] as [number, number];

    const steps = Math.max(1, Math.ceil(dist / maxSegmentKm));
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const { point } = catmullRomPoint(p0, p1, p2, p3, t);
      result.push(point);
    }
  }

  return result;
}

// Bounding box with optional padding
export function calculateBounds(
  coords: [number, number][],
  paddingFactor: number = 0.15
): { minLng: number; minLat: number; maxLng: number; maxLat: number } {
  if (coords.length === 0) {
    return { minLng: 88, minLat: 20.5, maxLng: 92.8, maxLat: 26.6 };
  }

  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  for (const [lng, lat] of coords) {
    if (lng < minLng) minLng = lng;
    if (lat < minLat) minLat = lat;
    if (lng > maxLng) maxLng = lng;
    if (lat > maxLat) maxLat = lat;
  }

  const dLng = (maxLng - minLng) * paddingFactor;
  const dLat = (maxLat - minLat) * paddingFactor;

  return {
    minLng: minLng - dLng,
    minLat: minLat - dLat,
    maxLng: maxLng + dLng,
    maxLat: maxLat + dLat
  };
}
