import { useState, useEffect } from 'react';
import { gpsService } from './GPSService';
import type { GPSState } from './types';

export const useGPS = (autoStart: boolean = false) => {
    const [state, setState] = useState<GPSState>({
        status: 'IDLE',
        location: null,
        error: null,
        satelliteCount: 0,
        isMock: false
    });

    useEffect(() => {
        const unsubscribe = gpsService.subscribe(setState);

        if (autoStart) {
            gpsService.start();
        }

        return () => {
            unsubscribe();
            if (autoStart) {
                gpsService.stop();
            }
        };
    }, [autoStart]);

    return {
        ...state,
        start: () => gpsService.start(),
        stop: () => gpsService.stop()
    };
};
