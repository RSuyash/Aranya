import { useState, useEffect } from 'react';

export const useResponsive = (ref: React.RefObject<HTMLElement | null>) => {
    const [dims, setDims] = useState({ width: 0, height: 0 });

    useEffect(() => {
        if (!ref.current) return;

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setDims({
                    width: entry.contentRect.width,
                    height: entry.contentRect.height
                });
            }
        });

        observer.observe(ref.current);

        // Initial measurement
        const rect = ref.current.getBoundingClientRect();
        setDims({ width: rect.width, height: rect.height });

        return () => observer.disconnect();
    }, [ref]);

    return dims;
};
