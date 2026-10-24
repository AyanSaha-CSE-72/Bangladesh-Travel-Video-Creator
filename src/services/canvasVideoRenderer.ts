import {
  JourneyConfig,
  RouteGeometry,
  VideoFormat,
  MapTheme
} from '../types/route';
import {
  computeCumulativeDistances,
  getInterpolatedState,
  getArticulatedTrainStates,
  getShortestAngleDiff
} from '../utils/geoUtils';
import { drawVehicleOnCanvas, drawArticulatedTrainOnCanvas } from '../utils/vehicleIcons';

export interface RenderProgressCallback {
  (progressPercent: number, statusText: string): void;
}

export interface RenderResult {
  blob: Blob;
  videoUrl: string;
  mimeType: string;
  filename: string;
  durationSeconds: number;
  width: number;
  height: number;
}

// Spherical Mercator tile formulas
function lng2tile(lng: number, zoom: number): number {
  return ((lng + 180) / 360) * Math.pow(2, zoom);
}

function lat2tile(lat: number, zoom: number): number {
  const rad = (lat * Math.PI) / 180;
  return (
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) *
    Math.pow(2, zoom)
  );
}

function tile2lng(x: number, z: number): number {
  return (x / Math.pow(2, z)) * 360 - 180;
}

function tile2lat(y: number, z: number): number {
  const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, z);
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

/**
 * Get dimensions for chosen video format
 */
export function getVideoDimensions(format: VideoFormat): {
  width: number;
  height: number;
} {
  switch (format) {
    case '9:16':
      return { width: 720, height: 1280 };
    case '16:9':
      return { width: 1280, height: 720 };
    case '1:1':
    default:
      return { width: 720, height: 720 };
  }
}

/**
 * Full-bleed Mercator projector to transform [lng, lat] to canvas [x, y],
 * ensuring map tiles seamlessly cover the canvas from edge to edge with zero blank borders.
 */
export class MercatorProjector {
  public minLng: number;
  public maxLng: number;
  public minLat: number;
  public maxLat: number;
  public canvasWidth: number;
  public canvasHeight: number;

  constructor(
    bounds: { minLng: number; minLat: number; maxLng: number; maxLat: number },
    canvasWidth: number,
    canvasHeight: number,
    paddingPercent: number = 0.20
  ) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;

    const dLng = Math.max(bounds.maxLng - bounds.minLng, 0.4);
    const dLat = Math.max(bounds.maxLat - bounds.minLat, 0.4);

    const centerLng = (bounds.minLng + bounds.maxLng) / 2;
    const centerLat = (bounds.minLat + bounds.maxLat) / 2;

    const canvasAspect = canvasWidth / canvasHeight;
    const latRad = (centerLat * Math.PI) / 180;

    // Expand route bounding box by padding so route takes up central 60% of canvas
    const spanLng = dLng / (1 - 2 * paddingPercent);
    const spanLat = dLat / (1 - 2 * paddingPercent);

    const aspectDiff = (spanLng * Math.cos(latRad)) / spanLat;

    let viewportDLng: number;
    let viewportDLat: number;

    if (aspectDiff > canvasAspect) {
      viewportDLng = spanLng;
      viewportDLat = (spanLng * Math.cos(latRad)) / canvasAspect;
    } else {
      viewportDLat = spanLat;
      viewportDLng = (spanLat * canvasAspect) / Math.cos(latRad);
    }

    // Canvas viewport extents in lat/lng that map EXACTLY to [0..canvasWidth] and [0..canvasHeight]
    this.minLng = centerLng - viewportDLng / 2;
    this.maxLng = centerLng + viewportDLng / 2;
    this.minLat = centerLat - viewportDLat / 2;
    this.maxLat = centerLat + viewportDLat / 2;
  }

  /**
   * Project geographic coordinate [lng, lat] to canvas pixel [x, y]
   */
  project(coord: [number, number]): [number, number] {
    const [lng, lat] = coord;
    const normX = (lng - this.minLng) / (this.maxLng - this.minLng);
    const normY =
      (lat2tile(lat, 0) - lat2tile(this.maxLat, 0)) /
      (lat2tile(this.minLat, 0) - lat2tile(this.maxLat, 0));
    const x = normX * this.canvasWidth;
    const y = normY * this.canvasHeight;
    return [x, y];
  }
}

/**
 * Load image with CORS support
 */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Tile load error: ' + url));
    img.src = url;
  });
}

/**
 * Pre-render full-bleed high-resolution topographic Bangladesh map tiles onto an offscreen canvas
 * Completely covers the entire canvas from edge to edge with zero empty margins.
 */
async function renderRealMapCanvas(
  projector: MercatorProjector,
  theme: MapTheme
): Promise<HTMLCanvasElement> {
  const { canvasWidth, canvasHeight, minLng, maxLng, minLat, maxLat } =
    projector;

  const mapCanvas = document.createElement('canvas');
  mapCanvas.width = canvasWidth;
  mapCanvas.height = canvasHeight;
  const ctx = mapCanvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 1. Natural base background matching theme
  if (theme === 'dark') {
    ctx.fillStyle = '#0f172a';
  } else if (theme === 'satellite') {
    ctx.fillStyle = '#042f2e';
  } else if (theme === 'minimal') {
    ctx.fillStyle = '#f1f5f9';
  } else {
    // classic natural terrain tint
    ctx.fillStyle = '#e8eee5';
  }
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // 2. High-resolution tile providers and fallbacks
  const subdomains = ['a', 'b', 'c', 'd'];
  let tileUrlFn = (z: number, x: number, y: number) =>
    `https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/${z}/${y}/${x}`;
  let fallbackUrlFn = (z: number, x: number, y: number) => {
    const s = subdomains[(x + y) % subdomains.length];
    return `https://${s}.basemaps.cartocdn.com/rastertiles/voyager/${z}/${x}/${y}.png`;
  };

  if (theme === 'dark') {
    tileUrlFn = (z: number, x: number, y: number) => {
      const s = subdomains[(x + y) % subdomains.length];
      return `https://${s}.basemaps.cartocdn.com/rastertiles/dark_all/${z}/${x}/${y}.png`;
    };
    fallbackUrlFn = (z: number, x: number, y: number) => {
      const s = subdomains[(x + y) % subdomains.length];
      return `https://${s}.basemaps.cartocdn.com/rastertiles/dark_nolabels/${z}/${x}/${y}.png`;
    };
  } else if (theme === 'minimal') {
    tileUrlFn = (z: number, x: number, y: number) => {
      const s = subdomains[(x + y) % subdomains.length];
      return `https://${s}.basemaps.cartocdn.com/rastertiles/voyager/${z}/${x}/${y}.png`;
    };
    fallbackUrlFn = (z: number, x: number, y: number) => {
      const s = subdomains[(x + y) % subdomains.length];
      return `https://${s}.tile.openstreetmap.org/${z}/${x}/${y}.png`;
    };
  } else if (theme === 'satellite') {
    tileUrlFn = (z: number, x: number, y: number) =>
      `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
    fallbackUrlFn = (z: number, x: number, y: number) =>
      `https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/${z}/${y}/${x}`;
  }

  // Determine optimal zoom level from full canvas viewport
  const viewportDLng = maxLng - minLng;
  const viewportDLat = maxLat - minLat;
  const maxSpan = Math.max(viewportDLng, viewportDLat);

  let zoom = 8;
  if (maxSpan < 1.0) zoom = 10;
  else if (maxSpan < 2.5) zoom = 9;
  else if (maxSpan < 5.0) zoom = 8;
  else zoom = 7;

  // Tile ranges with 1 extra buffer tile on each side to guarantee edge-to-edge coverage
  const minTileX = Math.floor(lng2tile(minLng, zoom));
  const maxTileX = Math.ceil(lng2tile(maxLng, zoom));
  const minTileY = Math.floor(lat2tile(maxLat, zoom));
  const maxTileY = Math.ceil(lat2tile(minLat, zoom));

  const tilePromises: Promise<void>[] = [];

  for (let x = minTileX; x <= maxTileX; x++) {
    for (let y = minTileY; y <= maxTileY; y++) {
      const p = (async () => {
        const nwLng = tile2lng(x, zoom);
        const nwLat = tile2lat(y, zoom);
        const seLng = tile2lng(x + 1, zoom);
        const seLat = tile2lat(y + 1, zoom);

        const [px1, py1] = projector.project([nwLng, nwLat]);
        const [px2, py2] = projector.project([seLng, seLat]);

        const w = px2 - px1;
        const h = py2 - py1;

        try {
          let baseImg: HTMLImageElement;
          try {
            baseImg = await loadImage(tileUrlFn(zoom, x, y));
          } catch (_) {
            baseImg = await loadImage(fallbackUrlFn(zoom, x, y));
          }
          ctx.drawImage(baseImg, px1, py1, w + 0.8, h + 0.8);

          if (theme === 'classic') {
            // 1. Shaded Relief for Bangladesh hills, rivers and terrain contours
            try {
              const reliefImg = await loadImage(
                `https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/${zoom}/${y}/${x}`
              );
              ctx.save();
              ctx.globalAlpha = 0.38;
              ctx.drawImage(reliefImg, px1, py1, w + 0.8, h + 0.8);
              ctx.restore();
            } catch (_) {}

            // 2. High-contrast Bangladesh place names and boundaries
            try {
              const lblImg = await loadImage(
                `https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/${zoom}/${y}/${x}`
              );
              ctx.drawImage(lblImg, px1, py1, w + 0.8, h + 0.8);
            } catch (_) {}
          } else if (theme === 'satellite') {
            // 1. World Transportation
            try {
              const roadImg = await loadImage(
                `https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/${zoom}/${y}/${x}`
              );
              ctx.save();
              ctx.globalAlpha = 0.85;
              ctx.drawImage(roadImg, px1, py1, w + 0.8, h + 0.8);
              ctx.restore();
            } catch (_) {}

            // 2. Place names & borders
            try {
              const lblImg = await loadImage(
                `https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/${zoom}/${y}/${x}`
              );
              ctx.drawImage(lblImg, px1, py1, w + 0.8, h + 0.8);
            } catch (_) {}
          }
        } catch (_) {
          // Gracefully continue
        }
      })();

      tilePromises.push(p);
    }
  }

  // Wait for all tiles to finish loading with a 5-second race
  await Promise.race([
    Promise.allSettled(tilePromises),
    new Promise(res => setTimeout(res, 5000))
  ]);

  return mapCanvas;
}

/**
 * Draw TravelBoast Floating Red Distance Capsule Badge: e.g. [ 324 km ]
 * (Exactly as shown in user's uploaded demo image!)
 */
function drawFloatingDistanceBadge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  currentKm: number
) {
  ctx.save();
  const text = `${Math.round(currentKm)} km`;
  ctx.font = '800 13px "Outfit", sans-serif';
  const textWidth = ctx.measureText(text).width;
  const badgeW = textWidth + 18;
  const badgeH = 24;

  const bx = x - badgeW / 2;
  const by = y + 26; // Floating right below the car

  // Shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 2;

  // Red capsule background
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.roundRect(bx, by, badgeW, badgeH, 6);
  ctx.fill();

  // White border
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // White text
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, bx + badgeW / 2, by + badgeH / 2 + 0.5);

  ctx.restore();
}

/**
 * Draw TravelBoast Top-Left Airplane Emblem
 */
function drawTravelBoastLogo(ctx: CanvasRenderingContext2D, topPadding: number) {
  ctx.save();
  // Sky blue circle
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(46, topPadding + 22, 18, 0, Math.PI * 2);
  ctx.fill();

  // White airplane icon inside
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(46, topPadding + 10);
  ctx.lineTo(54, topPadding + 29);
  ctx.lineTo(46, topPadding + 25);
  ctx.lineTo(38, topPadding + 29);
  ctx.closePath();
  ctx.fill();

  // Small wordmark below
  ctx.font = '800 9px "Outfit", sans-serif';
  ctx.fillStyle = '#0284c7';
  ctx.textAlign = 'center';
  ctx.fillText('ROUTEREEL', 46, topPadding + 47);
  ctx.restore();
}

/**
 * Draw story headers and overlays
 */
function drawCinematicOverlays(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  config: JourneyConfig,
  route: RouteGeometry,
  progress: number,
  currentKm: number
) {
  const topPadding = config.format === '9:16' ? 44 : 24;

  // 1. Top Left Emblem
  drawTravelBoastLogo(ctx, topPadding);

  // 2. Top Title Card
  ctx.save();
  ctx.font = '800 22px "Outfit", sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.shadowColor = 'rgba(255,255,255,0.9)';
  ctx.shadowBlur = 6;
  const titleText =
    config.title || `Traveling to ${config.destination.name}`;
  ctx.fillText(titleText, 76, topPadding + 22);

  ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText(
    `${config.startLocation.name} ➔ ${config.destination.name}`,
    76,
    topPadding + 40
  );
  ctx.restore();

  // 3. Bottom HUD Card
  ctx.save();
  const btmPadding = config.format === '9:16' ? 50 : 25;
  const cardY = height - btmPadding - 52;
  const cardW = width - 64;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(32, cardY, cardW, 52, 14);
  ctx.fill();
  ctx.stroke();

  // Distance
  ctx.font = '800 16px "Outfit", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`${Math.round(currentKm)} km`, 50, cardY + 26);

  ctx.font = '600 10px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(`TOTAL: ${route.distanceKm} KM`, 50, cardY + 41);

  // Status
  ctx.font = '700 12px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#f8fafc';
  ctx.textAlign = 'right';
  const statusMsg =
    progress >= 0.98
      ? `★ Arrived at ${config.destination.name}!`
      : progress < 0.08
      ? `Departing ${config.startLocation.name}...`
      : `En route to ${config.destination.name}`;
  ctx.fillText(statusMsg, width - 50, cardY + 26);

  // Progress Bar
  const barY = cardY + 47;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.beginPath();
  ctx.roundRect(50, barY, cardW - 36, 4, 2);
  ctx.fill();

  ctx.fillStyle = config.routeColor || '#dc2626';
  ctx.beginPath();
  ctx.roundRect(50, barY, (cardW - 36) * Math.min(1, progress), 4, 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Draw Start and Destination pins
 */
function drawPins(
  ctx: CanvasRenderingContext2D,
  startPix: [number, number],
  destPix: [number, number],
  startName: string,
  destName: string
) {
  // Start Pin (Emerald)
  ctx.save();
  const [sx, sy] = startPix;
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.45)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(sx, sy, 14, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.arc(sx, sy, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(sx, sy, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = '700 12px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.shadowColor = 'rgba(255,255,255,0.95)';
  ctx.shadowBlur = 4;
  ctx.fillText(startName, sx + 12, sy + 4);
  ctx.restore();

  // Destination Pin (Ruby Red Flag)
  ctx.save();
  const [dx, dy] = destPix;
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(dx, dy, 16, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.arc(dx, dy, 9, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(dx, dy, 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = '800 13px "Outfit", sans-serif';
  ctx.fillStyle = '#dc2626';
  ctx.shadowColor = 'rgba(255,255,255,0.95)';
  ctx.shadowBlur = 4;
  ctx.fillText(`🏁 ${destName}`, dx + 14, dy + 4);
  ctx.restore();
}

/**
 * Detect best supported video container/codec
 */
function getSupportedMimeType(): { mimeType: string; extension: string } {
  const types = [
    { mime: 'video/mp4;codecs="avc1.42E01E,mp4a.40.2"', ext: 'mp4' },
    { mime: 'video/mp4', ext: 'mp4' },
    { mime: 'video/webm;codecs=vp9,opus', ext: 'webm' },
    { mime: 'video/webm;codecs=vp8,opus', ext: 'webm' },
    { mime: 'video/webm', ext: 'webm' }
  ];

  for (const t of types) {
    if (
      typeof MediaRecorder !== 'undefined' &&
      MediaRecorder.isTypeSupported(t.mime)
    ) {
      return { mimeType: t.mime, extension: t.ext };
    }
  }

  return { mimeType: 'video/webm', extension: 'webm' };
}

/**
 * Main Video Renderer Function
 */
export async function renderJourneyVideo(
  config: JourneyConfig,
  route: RouteGeometry,
  onProgress?: RenderProgressCallback
): Promise<RenderResult> {
  const { width, height } = getVideoDimensions(config.format);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false })!;

  // 1. Initialize Mercator Projector
  const projector = new MercatorProjector(route.bounds, width, height, 0.22);

  // 2. Pre-render Real Bangladesh Map Tiles (Carto Voyager)
  if (onProgress) onProgress(5, 'Loading original Bangladesh map tiles...');
  const realMapCanvas = await renderRealMapCanvas(projector, config.mapTheme);

  // Cumulative distances for smooth motion
  const cumulativeDistances = computeCumulativeDistances(route.coordinates);
  const projectedCoords = route.coordinates.map(c => projector.project(c));
  const startPix = projectedCoords[0];
  const destPix = projectedCoords[projectedCoords.length - 1];

  const fps = 30;
  const totalFrames = config.duration * fps;
  const canvasStream = canvas.captureStream(fps);

  const { mimeType, extension } = getSupportedMimeType();
  const recordedChunks: Blob[] = [];

  const mediaRecorder = new MediaRecorder(canvasStream, {
    mimeType,
    videoBitsPerSecond: 5_000_000
  });

  mediaRecorder.ondataavailable = e => {
    if (e.data && e.data.size > 0) {
      recordedChunks.push(e.data);
    }
  };

  const recordingPromise = new Promise<Blob>((resolve, reject) => {
    mediaRecorder.onstop = () => {
      resolve(new Blob(recordedChunks, { type: mimeType }));
    };
    mediaRecorder.onerror = err => reject(err);
  });

  mediaRecorder.start(100);

  let smoothHeading = 0;

  // Render Frame by Frame
  for (let frame = 0; frame <= totalFrames; frame++) {
    const linearT = frame / totalFrames;
    const t =
      linearT < 0.5
        ? 4 * linearT * linearT * linearT
        : 1 - Math.pow(-2 * linearT + 2, 3) / 2;

    const pct = Math.round((frame / totalFrames) * 95) + 5;
    if (onProgress && frame % 10 === 0) {
      onProgress(pct, `Rendering video frames (${frame}/${totalFrames})...`);
    }

    // 1. Draw Real Bangladesh Map Image
    ctx.drawImage(realMapCanvas, 0, 0);

    // 2. Draw Faint Planned Route
    ctx.save();
    ctx.strokeStyle = 'rgba(220, 38, 38, 0.25)';
    ctx.lineWidth = 4;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(startPix[0], startPix[1]);
    for (let i = 1; i < projectedCoords.length; i++) {
      ctx.lineTo(projectedCoords[i][0], projectedCoords[i][1]);
    }
    ctx.stroke();
    ctx.restore();

    // 3. Interpolate current vehicle state along Catmull-Rom road curve
    const state = getInterpolatedState(
      route.coordinates,
      cumulativeDistances,
      t
    );
    const [currentX, currentY] = projector.project(state.position);
    const currentKm = t * route.distanceKm;

    // Smooth heading damping along curves
    if (frame === 0) {
      smoothHeading = state.bearing;
    } else {
      const angleDiff = getShortestAngleDiff(smoothHeading, state.bearing);
      smoothHeading += angleDiff * 0.45;
    }

    // 4. Reveal animated vibrant road trail or authentic railway track
    if (config.vehicle === 'train') {
      // Draw Railway Sleeper Ties (Cross ties)
      ctx.save();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 10;
      ctx.setLineDash([3, 7]);
      ctx.beginPath();
      ctx.moveTo(startPix[0], startPix[1]);
      for (const pt of state.slicedCoords) {
        const [px, py] = projector.project(pt);
        ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Draw Steel Rail Track Lines
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 4;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(startPix[0], startPix[1]);
      for (const pt of state.slicedCoords) {
        const [px, py] = projector.project(pt);
        ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.restore();
    } else {
      ctx.save();
      ctx.strokeStyle = config.routeColor || '#dc2626';
      ctx.lineWidth = config.vehicle === 'airplane' ? 4 : 6;
      if (config.vehicle === 'airplane') {
        ctx.setLineDash([8, 8]);
      }
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetY = 2;

      ctx.beginPath();
      ctx.moveTo(startPix[0], startPix[1]);
      for (const pt of state.slicedCoords) {
        const [px, py] = projector.project(pt);
        ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.restore();
    }

    // 5. Draw Pins
    drawPins(
      ctx,
      startPix,
      destPix,
      config.startLocation.name,
      config.destination.name
    );

    // 6. Draw 3D Vehicle (Articulated Bending Train / Airplane / Car / Bus / Bike)
    if (config.vehicle === 'train') {
      // Articulated Train: Each coach curves and bends independently along the track!
      const bogieStates = getArticulatedTrainStates(
        route.coordinates,
        cumulativeDistances,
        t,
        3
      );
      const bogiePix = bogieStates.map(b => {
        const [bx, by] = projector.project(b.position);
        return {
          x: bx,
          y: by,
          headingDeg: b.bearing,
          isLocomotive: b.isLocomotive,
          index: b.index
        };
      });
      drawArticulatedTrainOnCanvas(ctx, bogiePix, 1.25);
    } else {
      drawVehicleOnCanvas(
        ctx,
        config.vehicle,
        currentX,
        currentY,
        smoothHeading,
        config.vehicle === 'airplane' ? 1.3 : 1.2
      );
    }

    // 7. Draw Floating Red Distance Pill Badge: [ 324 km ]
    drawFloatingDistanceBadge(ctx, currentX, currentY, currentKm);

    // 8. Draw Story Overlays
    drawCinematicOverlays(
      ctx,
      width,
      height,
      config,
      route,
      t,
      currentKm
    );

    // Yield control
    await new Promise(r => setTimeout(r, 1000 / fps));
  }

  mediaRecorder.stop();
  const videoBlob = await recordingPromise;
  const videoUrl = URL.createObjectURL(videoBlob);

  const cleanStart = config.startLocation.name.replace(/[^a-zA-Z0-9]/g, '_');
  const cleanDest = config.destination.name.replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `RouteReel_${cleanStart}_to_${cleanDest}_${config.duration}s.${extension}`;

  return {
    blob: videoBlob,
    videoUrl,
    mimeType,
    filename,
    durationSeconds: config.duration,
    width,
    height
  };
}
