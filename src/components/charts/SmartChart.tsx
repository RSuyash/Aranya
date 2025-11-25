import React, { useMemo } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { ResponsiveWrapper } from './core/ResponsiveWrapper';
import { EmptyState } from './core/EmptyState';
import { sanitizeDataSeries } from './core/sanitizer';
import { calculateMultiAxisScales } from './core/scaler';
import { ChartCanvas } from './ChartCanvas';
import type { ChartDataSeries, ChartConfig } from './core/types';

interface SmartChartProps {
    series: ChartDataSeries[];
    config?: ChartConfig;
    className?: string;
}

const ErrorFallback = ({ error }: { error: Error }) => (
    <div className="flex flex-col items-center justify-center h-full text-[#ff7e67] bg-[#ff7e67]/5 rounded-xl border border-[#ff7e67]/20 p-4">
        <p className="font-bold mb-1">Chart Error</p>
        <p className="text-xs font-mono">{error.message}</p>
    </div>
);

export const SmartChart: React.FC<SmartChartProps> = ({
    series,
    config = {},
    className
}) => {
    // 1. Pipeline: Sanitize
    const safeSeries = useMemo(() => sanitizeDataSeries(series), [series]);

    // 2. Check for Data
    const hasData = safeSeries.some(s => s.data.length > 0);

    // 3. Pipeline: Scaling
    const scales = useMemo(() => {
        if (!hasData) return null;
        return calculateMultiAxisScales(safeSeries, config);
    }, [safeSeries, config, hasData]);

    return (
        <div className={`w-full ${className}`} style={{ height: config.height || 300 }}>
            <ErrorBoundary FallbackComponent={ErrorFallback}>
                {!hasData || !scales ? (
                    <EmptyState message="No data to display" />
                ) : (
                    <ResponsiveWrapper>
                        {(width, height) => (
                            <ChartCanvas
                                series={safeSeries}
                                scales={scales}
                                width={width}
                                height={height}
                                config={config}
                            />
                        )}
                    </ResponsiveWrapper>
                )}
            </ErrorBoundary>
        </div>
    );
};