export interface LocationPoint {
  id: string;
  name: string;
  bnName?: string;
  district: string;
  division: string;
  lat: number;
  lng: number;
  type?: 'city' | 'town' | 'tourist' | 'landmark';
  description?: string;
}

export type VehicleType = 'car' | 'train' | 'motorcycle' | 'bus' | 'airplane';

export type VideoDuration = 10 | 15;

export type VideoFormat = '9:16' | '16:9' | '1:1';

export type MapTheme = 'classic' | 'dark' | 'minimal' | 'satellite';

export interface RouteGeometry {
  coordinates: [number, number][]; // [lng, lat]
  distanceKm: number;
  durationMinutes: number;
  bounds: {
    minLng: number;
    minLat: number;
    maxLng: number;
    maxLat: number;
  };
  waypoints: {
    name: string;
    lng: number;
    lat: number;
    progress: number; // 0 to 1
  }[];
}

export interface JourneyConfig {
  id: string;
  title: string;
  subtitle?: string;
  startLocation: LocationPoint;
  destination: LocationPoint;
  vehicle: VehicleType;
  duration: VideoDuration;
  format: VideoFormat;
  mapTheme: MapTheme;
  routeColor: string;
  showDistance: boolean;
  showSpeed: boolean;
  showMilestones: boolean;
  cameraMode: 'follow' | 'overview';
  createdAt: number;
}

export interface SavedProject {
  id: string;
  title: string;
  startName: string;
  destName: string;
  distanceKm: number;
  duration: VideoDuration;
  format: VideoFormat;
  vehicle: VehicleType;
  date: string;
  videoUrl?: string;
}
