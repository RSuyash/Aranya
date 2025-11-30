import { v4 as uuidv4 } from 'uuid';
import { db, type MediaItem } from '../data-model/dexie';

export type CaptureSource = 'CAMERA' | 'PHOTOS' | 'PROMPT';

/**
 * Dr. Thorne's Imaging Pipeline
 * Handles platform-specific capture, compression, and atomic storage.
 */
class CameraService {

    /**
     * Captures an image and persists it immediately to IndexedDB.
     * Returns the MediaItem metadata.
     * [Lumina Upgrade]: Now accepts explicit source to bypass ugly native prompts.
     */
    public async captureAndSave(parentId: string, type: string, sourceMode: CaptureSource = 'PROMPT'): Promise<MediaItem> {
        try {
            // Load Capacitor modules dynamically at runtime
            const { Camera, CameraResultType, CameraSource } = await this.loadCapacitorModules();

            // Map string command to Enum
            let source = CameraSource.Prompt;
            if (sourceMode === 'CAMERA') source = CameraSource.Camera;
            if (sourceMode === 'PHOTOS') source = CameraSource.Photos;

            const image = await Camera.getPhoto({
                quality: 80, // High enough for science, low enough for storage
                allowEditing: false,
                resultType: CameraResultType.Uri,
                source: source,
                width: 1920, // Max dimension (Full HD)
                height: 1920,
                correctOrientation: true
            });

            if (!image.webPath) throw new Error("Camera failed to return a path.");

            // 2. Hydrate to Blob (The "Physical" Asset)
            // This works on both Web and Native (Capacitor handles the fetch)
            const response = await fetch(image.webPath);
            const blob = await response.blob();

            // 3. Construct Record
            const mediaItem: MediaItem = {
                id: uuidv4(),
                parentId,
                type,
                blob,
                mimeType: image.format === 'png' ? 'image/png' : 'image/jpeg',
                timestamp: Date.now(),
                synced: false
            };

            // 4. Atomic Commit
            await db.media.add(mediaItem);

            return mediaItem;

        } catch (error) {
            // User cancellation is not an error in the UI flow, but we log it.
            if (error instanceof Error && error.message.includes('cancelled')) {
                throw new Error("Capture cancelled");
            }

            console.error("Imaging Protocol Failed:", error);
            if (error instanceof Error && (error.message.includes("permission") || error.message.includes("denied"))) {
                throw new Error("Camera permission denied. Please enable camera access in your device settings.");
            }
            throw new Error("Failed to capture image.");
        }
    }

    /**
     * Retrieves a Blob URL for rendering.
     * MUST revoke URL after component unmount to prevent memory leaks.
     */
    public async getImageUrl(mediaId: string): Promise<string | null> {
        const item = await db.media.get(mediaId);
        if (!item) return null;
        return URL.createObjectURL(item.blob);
    }

    /**
     * Load Capacitor modules dynamically
     */
    private async loadCapacitorModules() {
        try {
            const camera = await import('@capacitor/camera');

            return {
                Camera: camera.Camera,
                CameraResultType: camera.CameraResultType,
                CameraSource: camera.CameraSource
            };
        } catch (error) {
            throw new Error("Camera plugin not available.");
        }
    }

    public async deleteMedia(mediaId: string) {
        return db.media.delete(mediaId);
    }
}

export const cameraService = new CameraService();