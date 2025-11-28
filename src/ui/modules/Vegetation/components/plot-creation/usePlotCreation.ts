import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../../../../../core/data-model/dexie';
import { useGPS } from '../../../../../core/gps/useGPS';
import { generateDynamicLayout } from '../../../../../core/plot-engine/dynamicGenerator';
import type { Plot, VegetationModule } from '../../../../../core/data-model/types';
import type { PlotConfiguration, PlotNodeInstance } from '../../../../../core/plot-engine/types';

interface UsePlotCreationProps {
    projectId: string;
    moduleId: string;
    moduleData?: VegetationModule;
    onClose: () => void;
}

export const usePlotCreation = ({ projectId, moduleId, moduleData, onClose }: UsePlotCreationProps) => {
    const navigate = useNavigate();

    // Form State
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [config, setConfig] = useState<PlotConfiguration | null>(null);

    // GPS State (Auto-start when hook is mounted)
    const gps = useGPS(true);

    // Action: Create Plot
    const createPlot = useCallback(async () => {
        if (!projectId || !moduleId || !name || !code || !moduleData || !config) return;

        const id = uuidv4();
        const now = Date.now();

        // Use best available location or default to 0,0
        // We allow creation even if GPS is not perfect, but we flag it.
        const location = gps.location || {
            latitude: 0,
            longitude: 0,
            accuracy: 0,
            altitude: 0,
            altitudeAccuracy: 0,
            heading: 0,
            speed: 0,
            timestamp: now
        };

        const newPlot: Plot = {
            id,
            projectId,
            moduleId,
            blueprintId: 'dynamic',
            blueprintVersion: 1,
            configuration: config,
            name,
            code,
            coordinates: {
                lat: location.latitude,
                lng: location.longitude,
                accuracyM: location.accuracy,
                fixType: gps.status === 'LOCKED' ? 'AVERAGED' : 'SINGLE',
                sampleCount: 1, // We are taking a snapshot
                durationSec: 0,
                timestamp: location.timestamp
            },
            orientation: 0,
            slope: 0,
            aspect: 'N',
            habitatType: 'Forest',
            images: [],
            status: 'PLANNED',
            surveyors: [],
            surveyDate: new Date().toISOString().split('T')[0],
            customAttributes: {},
            createdAt: now,
            updatedAt: now
        };

        await db.plots.add(newPlot);

        // Generate Sampling Units
        const layout = generateDynamicLayout(config, newPlot.id);
        const collectSamplingUnits = (node: PlotNodeInstance): string[] => {
            const units: string[] = [];
            if (node.type === 'SAMPLING_UNIT') units.push(node.id);
            node.children.forEach(child => units.push(...collectSamplingUnits(child)));
            return units;
        };

        const samplingUnitIds = collectSamplingUnits(layout);

        for (const samplingUnitId of samplingUnitIds) {
            await db.samplingUnits.add({
                id: uuidv4(),
                projectId,
                moduleId,
                plotId: newPlot.id,
                samplingUnitId,
                status: 'NOT_STARTED',
                createdAt: now,
                lastUpdatedAt: now
            });
        }

        onClose();
        navigate(`/project/${projectId}/module/${moduleId}/plot/${id}`);
    }, [projectId, moduleId, name, code, moduleData, config, gps, navigate, onClose]);

    // Validation
    const isValid = !!(name && code && config && gps.location);

    return {
        form: { name, setName, code, setCode, config, setConfig },
        gps,
        actions: { createPlot },
        isValid
    };
};
