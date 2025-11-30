import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { Haptics, NotificationType } from '@capacitor/haptics';
import type { GPSState, GPSLocation, GPSConfig } from './types';

class GPSService {
    private state: GPSState = {
        status: 'IDLE',
        location: null,
        error: null,
        satelliteCount: 0,
        isMock: false
    };

    private subscribers: Set<(state: GPSState) => void> = new Set();
    private watchId: string | number | null = null;
    private config: GPSConfig = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
    };

    // Simulation for Dev/Browser
    private simulationInterval: any = null;

    constructor() {
        // Auto-detect simulation need
        if (!Capacitor.isNativePlatform() && window.location.hostname === 'localhost') {
            console.log('🌍 GPS: Running in Dev Mode (Simulation Available)');
        }
    }

    public subscribe(callback: (state: GPSState) => void): () => void {
        this.subscribers.add(callback);
        callback(this.state); // Emit current state immediately
        return () => this.subscribers.delete(callback);
    }

    private setState(updates: Partial<GPSState>) {
        this.state = { ...this.state, ...updates };
        this.notify();
    }

    private notify() {
        this.subscribers.forEach(cb => cb(this.state));
    }

    public async start() {
        if (this.state.status === 'SEARCHING' || this.state.status === 'LOCKED') return;

        this.setState({ status: 'REQUESTING_PERMISSION', error: null });

        try {
            const hasPermission = await this.checkPermissions();
            if (!hasPermission) {
                this.setState({ status: 'PERMISSION_DENIED', error: 'Location permission required.' });
                return;
            }

            this.setState({ status: 'INITIALIZING' });
            this.startWatch();

        } catch (error: any) {
            this.setState({ status: 'ERROR', error: error.message || 'Failed to start GPS' });
        }
    }

    public stop() {
        this.clearWatch();
        this.stopSimulation();
        this.setState({ status: 'IDLE' });
    }

    private async checkPermissions(): Promise<boolean> {
        if (!Capacitor.isNativePlatform()) return true; // Browser usually handles this via watchPosition

        try {
            const status = await Geolocation.checkPermissions();
            if (status.location === 'granted') return true;

            const request = await Geolocation.requestPermissions();
            return request.location === 'granted';
        } catch (e) {
            console.error('GPS Permission Error:', e);
            return false;
        }
    }

    private async startWatch() {
        this.setState({ status: 'SEARCHING' });

        // Browser / Dev Simulation Fallback
        if (!Capacitor.isNativePlatform()) {
            // Use real browser geolocation first
            if ('geolocation' in navigator) {
                this.watchId = navigator.geolocation.watchPosition(
                    (pos) => this.handleSuccess(pos),
                    (err) => {
                        console.warn('Browser GPS failed, falling back to simulation', err);
                        this.startSimulation();
                    },
                    this.config
                );
            } else {
                this.startSimulation();
            }
            return;
        }

        // Native Capacitor Geolocation
        try {
            this.watchId = await Geolocation.watchPosition(
                this.config,
                (position, err) => {
                    if (err) {
                        this.handleError(err);
                    } else if (position) {
                        // Capacitor returns a slightly different object, normalize it
                        const stdPos = {
                            coords: {
                                latitude: position.coords.latitude,
                                longitude: position.coords.longitude,
                                accuracy: position.coords.accuracy,
                                altitude: position.coords.altitude,
                                altitudeAccuracy: position.coords.altitudeAccuracy,
                                heading: position.coords.heading,
                                speed: position.coords.speed,
                            },
                            timestamp: position.timestamp
                        } as GeolocationPosition;
                        this.handleSuccess(stdPos);
                    }
                }
            );
        } catch (e: any) {
            this.handleError(e);
        }
    }

    private handleSuccess(pos: GeolocationPosition) {
        const location: GPSLocation = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            altitude: pos.coords.altitude,
            altitudeAccuracy: pos.coords.altitudeAccuracy,
            heading: pos.coords.heading,
            speed: pos.coords.speed,
            timestamp: pos.timestamp
        };

        // Determine if "Locked" based on accuracy threshold (e.g., < 20m)
        const isLocked = location.accuracy <= 20;
        const newStatus = isLocked ? 'LOCKED' : 'SEARCHING';

        // Haptic Feedback on Lock Acquisition
        if (newStatus === 'LOCKED' && this.state.status !== 'LOCKED') {
            try {
                Haptics.notification({ type: NotificationType.Success });
            } catch (e) {
                // Ignore haptic errors
            }
        }

        this.setState({
            status: newStatus,
            location,
            error: null,
            // Simulate satellite count based on accuracy (inverse relationship)
            satelliteCount: Math.max(0, Math.min(12, Math.floor(200 / (location.accuracy || 1))))
        });
    }

    private handleError(err: any) {
        console.error('GPS Watch Error:', err);
        this.setState({
            status: 'ERROR',
            error: err.message || 'Lost GPS signal'
        });
    }

    private clearWatch() {
        if (this.watchId !== null) {
            if (Capacitor.isNativePlatform()) {
                Geolocation.clearWatch({ id: this.watchId as string });
            } else {
                navigator.geolocation.clearWatch(this.watchId as number);
            }
            this.watchId = null;
        }
    }

    // --- Simulation Mode for Testing ---
    private startSimulation() {
        console.log('🤖 GPS: Starting Simulation Mode');
        this.setState({ isMock: true });

        let lat = 12.9716;
        let lng = 77.5946;
        let acc = 50;

        this.simulationInterval = setInterval(() => {
            // Random walk
            lat += (Math.random() - 0.5) * 0.0001;
            lng += (Math.random() - 0.5) * 0.0001;

            // Improve accuracy over time
            acc = Math.max(3, acc * 0.95);

            this.handleSuccess({
                coords: {
                    latitude: lat,
                    longitude: lng,
                    accuracy: acc,
                    altitude: 900,
                    altitudeAccuracy: 10,
                    heading: 0,
                    speed: 0
                },
                timestamp: Date.now()
            } as GeolocationPosition);
        }, 1000);
    }

    private stopSimulation() {
        if (this.simulationInterval) {
            clearInterval(this.simulationInterval);
            this.simulationInterval = null;
        }
    }
}

export const gpsService = new GPSService();
