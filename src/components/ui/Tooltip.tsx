import React, { useState } from 'react';

interface TooltipProps {
    content: React.ReactNode;
    children: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div
            className="relative flex items-center"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
            onClick={() => setIsVisible(!isVisible)}
        >
            {children}
            {isVisible && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-panel-soft border border-border rounded-xl shadow-2xl z-50 text-xs text-text-muted animate-in fade-in zoom-in-95 duration-200">
                    {content}
                    {/* Arrow */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-border" />
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-[7px] border-transparent border-t-panel-soft" />
                </div>
            )}
        </div>
    );
};
