import { db } from '../../core/data-model/dexie';
import type { SurveyTrack, TrackPoint } from '../../core/data-model/types';
import { v4 as uuidv4 } from 'uuid';

type GPSMode = 'STATIONARY' | 'TRACKING' | 'IDLE';

interface AveragingResult {
    lat: number;
    lng: number;
    accuracy: number;
    samples: number;
}

class GPSManager {
    private watchId: number | null = null;
    private subscribers: Set<(state: any) => void> = new Set();

    // State
    private mode: GPSMode = 'IDLE';
    private samples: Array<{ lat: number, lng: number, acc: number }> = [];
    private trackPoints: TrackPoint[] = [];
    private lastTrackPoint: { lat: number, lng: number } | null = null;

    // Tracking Session
    private currentTrackId: string | null = null;
    private trackStartTime: number = 0;

    // Math: Haversine Distance
    private getDist(p1: { lat: number, lng: number }, p2: { lat: number, lng: number }) {
        const R = 6371e3; // meters
        const φ1 = p1.lat * Math.PI / 180;
        const φ2 = p2.lat * Math.PI / 180;
        const Δφ = (p2.lat - p1.lat) * Math.PI / 180;
        const Δλ = (p2.lng - p1.lng) * Math.PI / 180;
        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    public subscribe(callback: (state: any) => void) {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }

    private notify() {
        const state = {
            mode: this.mode,
            samplesCount: this.samples.length,
            trackPoints: this.trackPoints, // Exposed for UI
            trackPointsCount: this.trackPoints.length,
            currentResult: this.mode === 'STATIONARY' ? this.getWeightedCentroid() : null
        };
        this.subscribers.forEach(cb => cb(state));
    }

    public startAveraging() {
        this.mode = 'STATIONARY';
        this.samples = [];
        this.startGPS((pos) => {
            const { latitude, longitude, accuracy } = pos.coords;

            // Quality Gate: Reject poor signals immediately (HDOP Filter)
            if (accuracy > 25) return;

            this.samples.push({ lat: latitude, lng: longitude, acc: accuracy });
            this.notify();
        });
    }

    public getWeightedCentroid(): AveragingResult | null {
        if (this.samples.length === 0) return null;

        let sumLat = 0, sumLng = 0, sumWeight = 0;

        this.samples.forEach(p => {
            // Weight = 1 / accuracy² (Inverse Variance)
            const w = 1 / (p.acc * p.acc || 1); // Avoid div by zero
            sumLat += p.lat * w;
            sumLng += p.lng * w;
            sumWeight += w;
        });

        return {
            lat: sumLat / sumWeight,
            lng: sumLng / sumWeight,
            accuracy: 1 / Math.sqrt(sumWeight), // Theoretical SE
            samples: this.samples.length
        };
    }

    public async startTracking(projectId: string, surveyorId: string, moduleId: string, config: { minDistance: number, minTime: number } = { minDistance: 1, minTime: 300 }) {
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

        this.startGPS((pos) => {
            const { latitude, longitude, accuracy, speed, altitude } = pos.coords;

            // Smart Interval: Configurable
            const now = Date.now();
            const shouldRecord = !this.lastTrackPoint ||
                this.getDist(this.lastTrackPoint, { lat: latitude, lng: longitude }) > config.minDistance ||
                (now - (this.trackPoints[this.trackPoints.length - 1]?.t || 0)) > config.minTime;

            if (shouldRecord) {
                const newPoint: TrackPoint = {
                    t: now,
                    lat: latitude,
                    lng: longitude,
                    acc: accuracy,
                    sp: speed || 0,
                    alt: altitude || 0
                };

                this.trackPoints.push(newPoint);
                this.lastTrackPoint = { lat: latitude, lng: longitude };

                // Resilience: Save to DB every 10 points (Incremental Persistence)
                if (this.trackPoints.length % 10 === 0) {
                    this.persistTrackChunk();
                }

                this.notify();
            }
        });
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
        if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }

        if (this.mode === 'TRACKING') {
            await this.persistTrackChunk(); // Final save
        }

        this.mode = 'IDLE';
        this.notify();
    }

    private startGPS(callback: (pos: GeolocationPosition) => void) {
        // Clear existing watch if any
        if (this.watchId !== null) {
            navigator.geolocation.clearWatch(this.watchId);
        }

        this.watchId = navigator.geolocation.watchPosition(
            callback,
            (err) => console.warn("GPS Error", err),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }

    public getCurrentState() {
        return {
            mode: this.mode,
            samplesCount: this.samples.length,
            trackPoints: this.trackPoints, // Exposed for UI
            trackPointsCount: this.trackPoints.length,
            currentResult: this.mode === 'STATIONARY' ? this.getWeightedCentroid() : null
        };
    }
}

export const gpsManager = new GPSManager(); // Singleton
