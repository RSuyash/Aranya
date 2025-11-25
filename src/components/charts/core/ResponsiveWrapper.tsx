import React, { useEffect, useRef, useState } from 'react';

interface ResponsiveWrapperProps {
    children: (width: number, height: number) => React.ReactNode;
    className?: string;
    minHeight?: number;
}

export const ResponsiveWrapper: React.FC<ResponsiveWrapperProps> = ({
    children,
    className = "",
    minHeight = 100
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [dims, setDims] = useState({ width: 0, height: 0 });

    useEffect(() => {
        if (!containerRef.current) return;

        const observer = new ResizeObserver(entries => {
            const entry = entries[0];
            if (entry) {
                const { width, height } = entry.contentRect;
                // Debounce could be added here if performance issues arise
                if (width > 0 && height > 0) {
                    setDims({ width, height });
                }
            }
        });

        observer.observe(containerRef.current);

        // Initial size
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width > 0) {
            setDims({ width: rect.width, height: rect.height });
        }

        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={containerRef}
            className={`w-full h-full min-h-[${minHeight}px] relative ${className}`}
        >
            {dims.width > 0 && dims.height > 0 && children(dims.width, dims.height)}
        </div>
    );
};
