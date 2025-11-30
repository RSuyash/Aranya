import { useState, useMemo } from 'react';

interface VirtualizerProps {
    count: number;
    itemHeight: number;
    containerHeight: number;
    overscan?: number; // How many extra items to render top/bottom for smooth scrolling
}

export const useVanceVirtualizer = ({
    count,
    itemHeight,
    containerHeight,
    overscan = 3
}: VirtualizerProps) => {
    const [scrollTop, setScrollTop] = useState(0);

    // Calculate the total height of the phantom container
    const totalHeight = count * itemHeight;

    // Calculate which indices are visible
    const { startIndex, endIndex, offsetY } = useMemo(() => {
        const start = Math.floor(scrollTop / itemHeight);
        const end = Math.min(
            count - 1,
            Math.floor((scrollTop + containerHeight) / itemHeight)
        );

        // Apply overscan buffer
        const virtualStart = Math.max(0, start - overscan);
        const virtualEnd = Math.min(count - 1, end + overscan);

        // Calculate the transform offset to push the items down
        const offset = virtualStart * itemHeight;

        return {
            startIndex: virtualStart,
            endIndex: virtualEnd,
            offsetY: offset
        };
    }, [scrollTop, count, itemHeight, containerHeight, overscan]);

    // Scroll Handler
    const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
        // Use requestAnimationFrame throttling for 60FPS performance
        // But for React state, simple setting is often "fast enough" 
        // if the render tree is light. Let's keep it raw for now.
        setScrollTop(e.currentTarget.scrollTop);
    };

    return {
        totalHeight,
        virtualItems: { startIndex, endIndex },
        offsetY,
        onScroll
    };
};