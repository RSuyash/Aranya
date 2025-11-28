export type GPSStatus =
    | 'IDLE'
    | 'REQUESTING_PERMISSION'
    | 'PERMISSION_DENIED'
    | 'INITIALIZING'
    | 'SEARCHING'
    | 'LOCKED'
    | 'ERROR';

export interface GPSLocation {
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude: number | null;
    altitudeAccuracy: number | null;
    heading: number | null;
    speed: number | null;
    timestamp: number;
}

export interface GPSState {
    status: GPSStatus;
    location: GPSLocation | null;
    error: string | null;
    satelliteCount: number; // Simulated or derived
    isMock: boolean;
}

export interface GPSConfig {
    enableHighAccuracy: boolean;
    timeout: number;
    maximumAge: number;
}
