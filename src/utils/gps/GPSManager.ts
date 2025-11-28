import { db } from '../../core/data-model/dexie';
import type { SurveyTrack, TrackPoint } from '../../core/data-model/types';
import { v4 as uuidv4 } from 'uuid';
import { Geolocation } from '@capacitor/geolocation';
import { KeepAwake } from '@capacitor-community/keep-awake';
import { Capacitor } from '@capacitor/core';
import { getHaversineDistance } from '../geo';

type GPSMode = 'IDLE' | 'TRACKING' | 'MEASURING';

interface AveragingResult {
    lat: number;
    lng: number;
    accuracy: number; // Standard Error
    samples: number;
    duration: number; // seconds
}

class GPSManager {
    private watchId: number | string | null = null;
    private subscribers: Set<(state: any) => void> = new Set();

    // State Machine
    private mode: GPSMode = 'IDLE';
    private previousMode: GPSMode = 'IDLE'; // Memory for resume

    // Buffers
    private measurementSamples: Array<{ lat: number; lng: number; acc: number }> = [];
    private trackPoints: TrackPoint[] = [];
    private lastTrackPoint: { lat: number, lng: number } | null = null;

    // Tracking Session
    private currentTrackId: string | null = null;
    private trackStartTime: number = 0;
    private trackingConfig: { minDistance: number, minTime: number } = { minDistance: 1, minTime: 300 };

    // Math: Haversine Distance
    private getDist(p1: { lat: number, lng: number }, p2: { lat: number, lng: number }) {
        return getHaversineDistance(p1, p2);
    }

    public subscribe(callback: (state: any) => void) {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }

    private notify() {
        const state = {
            mode: this.mode,
            samplesCount: this.measurementSamples.length,
            trackPoints: this.trackPoints, // Exposed for UI
            trackPointsCount: this.trackPoints.length,
            currentResult: this.mode === 'MEASURING' ? this.getWeightedCentroid() : null
        };
        this.subscribers.forEach(cb => cb(state));
    }

    // --- State Management API ---

    /**
     * Called when opening a data entry form (Tree/Veg)
     * 1. Pauses track logging (prevents "starfish")
     * 2. Starts high-frequency buffering for averaging
     */
    public async startMeasuring() {
        if (this.mode === 'MEASURING') return;

        console.log('🛰️ GPS: Switching to MEASURING mode');
        this.previousMode = this.mode === 'TRACKING' ? 'TRACKING' : 'IDLE';
        this.mode = 'MEASURING';
        this.measurementSamples = []; // Reset buffer

        // Clear any existing watchers first
        await this.clearWatch();

        // Start High Accuracy Watch
        if (Capacitor.isNativePlatform()) {
            try {
                const perm = await Geolocation.checkPermissions();
                if (perm.location !== 'granted') {
                    await Geolocation.requestPermissions();
                }

                this.watchId = await Geolocation.watchPosition(
                    { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 },
                    (position, err) => {
                        if (position) {
                            // Normalize Capacitor position to standard GeolocationPosition
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
                            this.handleGPSUpdate(stdPos);
                        }
                        if (err) console.warn("Native GPS Error", err);
                    }
                );
            } catch (e) {
                console.error("Native GPS Setup Failed", e);
            }
        } else {
            this.watchId = navigator.geolocation.watchPosition(
                (pos) => this.handleGPSUpdate(pos),
                (err) => console.warn("GPS Error", err),
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        }

        this.notify();
    }

    /**
     * Called when saving/closing the form.
     * 1. Returns the high-precision result.
     * 2. Injects that result into the track log (continuity).
     * 3. Resumes previous mode.
     */
    public async stopMeasuring(): Promise<AveragingResult | null> {
        console.log('🛰️ GPS: Exiting MEASURING mode');

        // 1. Calculate Final Result
        const result = this.getWeightedCentroid();

        // 2. Snap Track to Tree (The "Systems Engineer" Fix)
        if (this.previousMode === 'TRACKING' && result && this.currentTrackId) {
            this.addPointToTrack({
                t: Date.now(),
                lat: result.lat,
                lng: result.lng,
                acc: result.accuracy,
                // Mark this point as a "Waypoint" measurement in the track stream?
                // For now, just adding it ensures the path connects to the tree.
            });
        }

        // 3. Resume State
        this.mode = this.previousMode;

        // 4. Battery Optimization: If we were IDLE before, shut down radio
        if (this.mode === 'IDLE') {
            await this.stopGPS();
        } else {
            // If resuming tracking, ensure we are watching again (if we switched watchers)
            // Ideally we keep the watcher running but just change how we handle data.
            // But for now, let's just ensure we are in a good state.
            if (this.watchId === null) {
                // Restart tracking watcher if it was cleared
                this.startGPSInternal();
            }
            this.notify();
        }

        return result;
    }

    public getMeasurementResult(): AveragingResult | null {
        return this.getWeightedCentroid();
    }

    public getWeightedCentroid(): AveragingResult | null {
        if (this.measurementSamples.length === 0) return null;

        let sumLat = 0, sumLng = 0, sumWeight = 0;
        this.measurementSamples.forEach(p => {
            // Weight = 1 / accuracy² (Inverse Variance)
            const w = 1 / (p.acc * p.acc || 1); // Avoid div by zero
            sumLat += p.lat * w;
            sumLng += p.lng * w;
            sumWeight += w;
        });

        // Theoretical Standard Error ≈ 1 / sqrt(sum(weights))
        // This represents the confidence in the *average*, usually much tighter than raw accuracy.
        const se = 1 / Math.sqrt(sumWeight);

        return {
            lat: sumLat / sumWeight,
            lng: sumLng / sumWeight,
            accuracy: se,
            samples: this.measurementSamples.length,
            duration: this.measurementSamples.length // Approx 1s per sample (assuming 1Hz)
        };
    }

    // --- Core Event Loop ---

    // 2. HANDLE UPDATES EFFICIENTLY
    private handleGPSUpdate(pos: GeolocationPosition) {
        const { latitude, longitude, accuracy, speed, altitude } = pos.coords;
        const now = Date.now();

        // MODE 1: MEASURING (High Precision Averaging)
        if (this.mode === 'MEASURING') {
            // Filter useless data (e.g. >50m error is too noisy for a plot center)
            // We accept up to 50m initially to show the user "Searching...", 
            // but for the average, we might want to be stricter later.

            // We just push EVERYTHING. The math (Inverse Variance Weighting) 
            // will naturally ignore the bad points (high accuracy number = low weight).
            this.measurementSamples.push({ lat: latitude, lng: longitude, acc: accuracy });

            this.notify(); // Update UI immediately
            return;
        }

        // MODE 2: TRACKING (Survey Path)
        if (this.mode === 'TRACKING') {
            // Pocket Sleep / Process Death Check
            const lastTime = this.trackPoints[this.trackPoints.length - 1]?.t || 0;
            if (lastTime > 0 && (now - lastTime) > 10000) {
                console.warn("⚠️ GPS: Gap detected (Pocket Sleep?)", (now - lastTime) / 1000, "s");
                // We could insert a "Gap" marker here if needed
            }

            // Smart Filter: moved > minDistance OR time > minTime
            const shouldRecord = !this.lastTrackPoint ||
                this.getDist(this.lastTrackPoint, { lat: latitude, lng: longitude }) > this.trackingConfig.minDistance ||
                (now - lastTime) > this.trackingConfig.minTime;

            if (shouldRecord) {
                this.addPointToTrack({
                    t: now,
                    lat: latitude,
                    lng: longitude,
                    acc: accuracy,
                    sp: speed || 0,
                    alt: altitude || 0
                });
                this.lastTrackPoint = { lat: latitude, lng: longitude };
            }
        }
    }

    private addPointToTrack(pt: TrackPoint) {
        this.trackPoints.push(pt);
        // Resilience: Incremental persistence logic here
        if (this.trackPoints.length % 10 === 0) {
            this.persistTrackChunk();
        }
        this.notify();
    }

    public async startTracking(projectId: string, surveyorId: string, moduleId: string, config: { minDistance: number, minTime: number } = { minDistance: 1, minTime: 300 }) {
        this.trackingConfig = config;
        this.mode = 'TRACKING';
        this.currentTrackId = uuidv4();
        this.trackStartTime = Date.now();
        this.trackPoints = [];
        this.lastTrackPoint = null;

        // Create initial track entry
        const newTrack: SurveyTrack = {
            id: this.currentTrackId,
            projectId,
            moduleId,
            surveyorId,
            startTime: this.trackStartTime,
            points: [],
            distanceM: 0,
            durationS: 0,
            avgSpeedMs: 0,
            syncStatus: 'LOCAL_ONLY'
        };
        await db.surveyTracks.add(newTrack);

        // --- HYBRID FIX: PREVENT SLEEP ---
        if (Capacitor.isNativePlatform()) {
            try { await KeepAwake.keepAwake(); } catch (e) { console.warn("KeepAwake failed", e); }
        }

        this.startGPSInternal();
    }

    private async persistTrackChunk() {
        if (!this.currentTrackId) return;

        try {
            const track = await db.surveyTracks.get(this.currentTrackId);
            if (track) {
                track.points = [...this.trackPoints];
                track.endTime = Date.now();
                track.durationS = (track.endTime - track.startTime) / 1000;

                // Recalculate distance
                let dist = 0;
                for (let i = 1; i < track.points.length; i++) {
                    dist += this.getDist(track.points[i - 1], track.points[i]);
                }
                track.distanceM = dist;

                await db.surveyTracks.put(track);
            }
        } catch (e) {
            console.error("Failed to persist track chunk", e);
        }
    }

    public async stopGPS() {
        await this.clearWatch();

        if (this.mode === 'TRACKING') {
            await this.persistTrackChunk(); // Final save

            // --- HYBRID FIX: ALLOW SLEEP ---
            if (Capacitor.isNativePlatform()) {
                try { await KeepAwake.allowSleep(); } catch (e) { }
            }
        }

        this.mode = 'IDLE';
        this.notify();
    }

    private async clearWatch() {
        if (this.watchId !== null) {
            if (Capacitor.isNativePlatform()) {
                await Geolocation.clearWatch({ id: this.watchId as string });
            } else {
                navigator.geolocation.clearWatch(this.watchId as number);
            }
            this.watchId = null;
        }
    }

    private async startGPSInternal() {
        await this.clearWatch();

        if (Capacitor.isNativePlatform()) {
            try {
                const perm = await Geolocation.checkPermissions();
                if (perm.location !== 'granted') {
                    await Geolocation.requestPermissions();
                }

                this.watchId = await Geolocation.watchPosition(
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
                    (position, err) => {
                        if (position) {
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
                            this.handleGPSUpdate(stdPos);
                        }
                        if (err) console.warn("Native GPS Error", err);
                    }
                );
            } catch (e) {
                console.error("Native GPS Error", e);
            }
        } else {
            this.watchId = navigator.geolocation.watchPosition(
                (pos) => this.handleGPSUpdate(pos),
                (err) => console.warn("GPS Error", err),
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
            );
        }
    }

    public getCurrentState() {
        return {
            mode: this.mode,
            samplesCount: this.measurementSamples.length,
            trackPoints: this.trackPoints, // Exposed for UI
            trackPointsCount: this.trackPoints.length,
            currentResult: this.mode === 'MEASURING' ? this.getWeightedCentroid() : null
        };
    }
}

export const gpsManager = new GPSManager(); // Singleton
