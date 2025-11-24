import React, { useRef, useEffect, useState } from 'react';

interface GridContainerProps {
    width?: number; // Logical width in meters (e.g., 20m)
    height?: number; // Logical height in meters (e.g., 20m)
    children: React.ReactNode;
}

export const GridContainer: React.FC<GridContainerProps> = ({
    width = 20,
    height = 20,
    children,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    useEffect(() => {
        const updateScale = () => {
            if (containerRef.current) {
                const { clientWidth, clientHeight } = containerRef.current;
                const scaleX = clientWidth / width;
                const scaleY = clientHeight / height;
                setScale(Math.min(scaleX, scaleY) * 0.9); // 0.9 for padding
            }
        };

        window.addEventListener('resize', updateScale);
        updateScale();

        return () => window.removeEventListener('resize', updateScale);
    }, [width, height]);

    return (
        <div ref={containerRef} className="w-full h-full flex items-center justify-center bg-panel rounded-xl overflow-hidden relative">
            <div
                style={{
                    width: width * scale,
                    height: height * scale,
                    position: 'relative',
                }}
                className="bg-bg-app border border-border shadow-2xl"
            >
                {/* Grid Lines (Optional) */}
                <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 pointer-events-none opacity-10">
                    <div className="border-r border-b border-white" />
                    <div className="border-b border-white" />
                    <div className="border-r border-white" />
                    <div />
                </div>

                {/* Render Children with Scale Context */}
                {React.Children.map(children, (child) => {
                    if (React.isValidElement(child)) {
                        return React.cloneElement(child as React.ReactElement<any>, { scale });
                    }
                    return child;
                })}
            </div>
        </div>
    );
};
