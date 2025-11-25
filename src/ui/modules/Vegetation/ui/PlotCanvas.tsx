import React, { useMemo } from 'react';
import { usePlotData } from '../data/usePlotData';
import { usePlotObservations } from '../data/usePlotObservations';
import { generateLayout } from '../../../../core/plot-engine/generateLayout';
import { buildPlotVizModel } from '../viz/buildPlotVizModel';
import { UnitsLayer } from './layers/UnitsLayer';
import { TreesLayer } from './layers/TreesLayer';
import { LabelsLayer } from './layers/LabelsLayer';

interface PlotCanvasProps {
    plotId: string;
    viewportWidth: number;
    viewportHeight: number;
    selectedUnitId?: string;
    onSelectUnit?: (unitId: string) => void;
}

export const PlotCanvas: React.FC<PlotCanvasProps> = ({
    plotId,
    viewportWidth,
    viewportHeight,
    selectedUnitId,
    onSelectUnit,
}) => {
    const { blueprint, isLoading: dataLoading } = usePlotData(plotId);
    const { trees, veg, progress } = usePlotObservations(plotId);

    const rootInstance = useMemo(() => {
        console.log('PlotCanvas: blueprint', blueprint);
        if (!blueprint) return null;
        const layout = generateLayout(blueprint, undefined, plotId);
        console.log('PlotCanvas: generated layout', layout);
        return layout;
    }, [blueprint, plotId]);

    const vizModel = useMemo(() => {
        console.log('PlotCanvas: Building viz model', {
            rootInstance,
            viewportWidth,
            viewportHeight,
            treesCount: trees.length,
            vegCount: veg.length,
            progressCount: progress.length
        });

        if (!rootInstance || viewportWidth === 0 || viewportHeight === 0) {
            console.log('PlotCanvas: Skipping viz model - missing data');
            return null;
        }

        const model = buildPlotVizModel({
            rootInstance,
            trees,
            veg,
            progress,
            viewportWidth,
            viewportHeight,
        });

        console.log('PlotCanvas: Built viz model', model);
        return model;
    }, [rootInstance, trees, veg, progress, viewportWidth, viewportHeight]);

    console.log('PlotCanvas render:', { dataLoading, vizModel: !!vizModel, viewportWidth, viewportHeight });

    if (dataLoading || !vizModel) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <div className="text-[#9ba2c0]">Loading map...</div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-full bg-[#050814]" style={{ width: viewportWidth, height: viewportHeight }}>
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0b1020] to-[#050814]" />

            {/* Layers */}
            <UnitsLayer
                units={vizModel.units}
                selectedUnitId={selectedUnitId}
                onSelectUnit={onSelectUnit}
            />
            <TreesLayer trees={vizModel.trees} />
            <LabelsLayer units={vizModel.units} />
        </div>
    );
};
