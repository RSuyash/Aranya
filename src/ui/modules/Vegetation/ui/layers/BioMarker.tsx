import React, { useMemo } from 'react';
import { clsx } from 'clsx';

interface BioMarkerProps {
    x: number;
    y: number;
    radius: number; // Visual radius based on GBH
    species: string;
    onClick?: (e: React.MouseEvent) => void;
    delay: number; // For staggered animation
}

export const BioMarker: React.FC<BioMarkerProps> = ({ x, y, radius, species, onClick, delay }) => {
    // Generate deterministic "personality"
    const seed = (x + y) * radius;


    // Generate a unique canopy shape
    const canopyPath = useMemo(() => {
        const variants = [
            // Bushy / Round
            `M ${-radius},0 C ${-radius * 1.5},${-radius} ${-radius * 0.5},${-radius * 2.5} 0,${-radius * 2} C ${radius * 0.5},${-radius * 2.5} ${radius * 1.5},${-radius} ${radius},0 Z`,
            // Tall / Conical
            `M ${-radius * 0.8},0 C ${-radius * 1.2},${-radius} 0,${-radius * 3} ${radius * 0.8},0 Z`,
            // Broad
            `M ${-radius},${-radius * 0.2} Q 0,${-radius * 2.2} ${radius},${-radius * 0.2} L 0,0 Z`
        ];
        return variants[Math.floor(seed % variants.length)];
    }, [radius, seed]);

    // Color variation based on species name hash
    const color = useMemo(() => {
        const colors = [
            '#4ade80', // Green 400
            '#22c55e', // Green 500
            '#16a34a', // Green 600
            '#10b981', // Emerald 500
            '#059669', // Emerald 600
            '#84cc16', // Lime 500
        ];
        const hash = species.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
        return colors[hash % colors.length];
    }, [species]);

    return (
        <g
            transform={`translate(${x},${y})`}
            className={clsx("group pointer-events-auto", onClick && "cursor-pointer")}
            onClick={onClick}
        >
            {/* 1. Ground Shadow (Static - Anchors the tree visually) */}
            <ellipse
                cx={0} cy={radius * 0.3}
                rx={radius * 0.8} ry={radius * 0.3}
                fill="#000000"
                opacity={0.15}
                className="blur-[1px]"
            />

            {/* 2. Trunk Base (Static - Does NOT Move) */}
            <path
                d={`M ${-radius / 6},0 L ${-radius / 8},${-radius * 0.5} L ${radius / 8},${-radius * 0.5} L ${radius / 6},0 Z`}
                fill="#78350f" // Amber 900
                stroke="#451a03"
                strokeWidth={0.5}
            />

            {/* 3. Swaying Canopy (Animated) */}
            {/* transform-origin at 0, -radius*0.5 (top of the static trunk base) */}
            <g
                className="animate-[sway_3s_ease-in-out_infinite] origin-bottom"
                style={{
                    animationDelay: `${delay}ms`,
                    animationDuration: `${3000 + (seed % 2000)}ms`,
                    transformOrigin: `0px ${-radius * 0.5}px`
                }}
            >
                {/* Upper Trunk (moves with leaves) */}
                <path
                    d={`M ${-radius / 8},${-radius * 0.5} L ${-radius / 10},${-radius * 0.8} L ${radius / 10},${-radius * 0.8} L ${radius / 8},${-radius * 0.5} Z`}
                    fill="#78350f"
                    stroke="#451a03"
                    strokeWidth={0.5}
                />

                {/* Leafy Crown */}
                <path
                    d={canopyPath}
                    fill={color}
                    stroke="rgba(0,0,0,0.1)"
                    strokeWidth={1}
                    className="transition-all duration-300 group-hover:brightness-110 group-hover:stroke-white/50 drop-shadow-sm group-hover:drop-shadow-md"
                />

                {/* Specular Highlight */}
                <path
                    d={`M ${-radius * 0.4},${-radius * 1.2} Q 0,${-radius * 1.6} ${radius * 0.4},${-radius * 1.2}`}
                    fill="none"
                    stroke="white"
                    strokeOpacity={0.2}
                    strokeWidth={radius * 0.15}
                    strokeLinecap="round"
                />
            </g>

            {/* Interaction Hitbox (Invisible but larger) */}
            <circle cx={0} cy={-radius} r={radius * 1.8} fill="transparent" />
        </g>
    );
};