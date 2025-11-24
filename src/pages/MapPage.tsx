import React from 'react';
import { GridContainer } from '../components/plot/GridContainer';
import { Quadrant } from '../components/plot/Quadrant';

export const MapPage: React.FC = () => {
    // Mock Plot Data: 20x20m Plot with 4 Quadrants (10x10m each)
    const quadrants = [
        { id: 'q1', label: 'Q1 (NW)', x: 0, y: 0, status: 'completed' as const },
        { id: 'q2', label: 'Q2 (NE)', x: 10, y: 0, status: 'in-progress' as const },
        { id: 'q3', label: 'Q3 (SW)', x: 0, y: 10, status: 'empty' as const },
        { id: 'q4', label: 'Q4 (SE)', x: 10, y: 10, status: 'empty' as const },
    ];

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col">
            <div className="mb-4 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-text-main">Plot Visualizer</h2>
                    <p className="text-text-muted">Plot P-101 (20x20m)</p>
                </div>
                <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-success/20 border border-success rounded-sm"></div>
                        <span>Completed</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-primary/20 border border-primary rounded-sm"></div>
                        <span>In Progress</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-0">
                <GridContainer width={20} height={20}>
                    {quadrants.map((q) => (
                        <Quadrant
                            key={q.id}
                            id={q.id}
                            x={q.x}
                            y={q.y}
                            size={10}
                            label={q.label}
                            status={q.status}
                            onClick={() => console.log(`Clicked ${q.label}`)}
                        />
                    ))}
                </GridContainer>
            </div>
        </div>
    );
};
