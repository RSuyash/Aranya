import React, { useRef, useMemo } from 'react';
import type { TreeObservation } from '../../../../core/data-model/types';
import { useVanceVirtualizer } from '../../../../hooks/useVanceVirtualizer';
import { useResponsive } from '../../../../hooks/useResponsive';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../../core/data-model/dexie';
import {
    Sprout, AlertTriangle, CheckCircle2, MoreVertical,
    MapPin, Image as ImageIcon, Database, Scan
} from 'lucide-react';
import { clsx } from 'clsx';

interface TreeListProps {
    trees: TreeObservation[];
    onEditTree: (id: string) => void;
    searchQuery?: string;
    unitLabelMap: Map<string, string>;
}

const ROW_HEIGHT = 88; // Slightly taller for better touch targets

// Helper: Natural Sort
const naturalSort = (a: string, b: string) => {
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
};

type ListItem =
    | { type: 'HEADER'; label: string; id: string }
    | { type: 'TREE'; data: TreeObservation };

export const TreeList: React.FC<TreeListProps> = ({ trees, onEditTree, searchQuery = '', unitLabelMap }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { height: containerHeight } = useResponsive(containerRef);

    // 1. Efficient Media Query
    const mediaMap = useLiveQuery(async () => {
        const allMedia = await db.media.toArray();
        const map = new Map<string, number>();
        allMedia.forEach(m => {
            map.set(m.parentId, (map.get(m.parentId) || 0) + 1);
        });
        return map;
    }, [trees.length]) || new Map();

    // 2. Prepare Data
    const listItems = useMemo<ListItem[]>(() => {
        let filtered = trees;
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            filtered = trees.filter(tree =>
                tree.speciesName.toLowerCase().includes(query) ||
                tree.tagNumber.toLowerCase().includes(query) ||
                (tree.commonName && tree.commonName.toLowerCase().includes(query)) ||
                (tree.samplingUnitId && tree.samplingUnitId.toLowerCase().includes(query))
            );
        }

        const sorted = [...filtered].sort((a, b) => {
            const unitDiff = naturalSort(a.samplingUnitId, b.samplingUnitId);
            if (unitDiff !== 0) return unitDiff;
            return naturalSort(a.tagNumber, b.tagNumber);
        });

        const items: ListItem[] = [];
        let currentUnit = '';

        sorted.forEach(tree => {
            if (tree.samplingUnitId !== currentUnit) {
                currentUnit = tree.samplingUnitId;
                const rawLabel = unitLabelMap.get(currentUnit) || 'Unknown Unit';
                const displayLabel = rawLabel.replace(/^Q(\d+)$/i, 'Quadrant $1');
                items.push({ type: 'HEADER', label: displayLabel, id: currentUnit });
            }
            items.push({ type: 'TREE', data: tree });
        });

        return items;
    }, [trees, searchQuery, unitLabelMap]);

    // 3. Virtualize
    const { totalHeight, virtualItems, offsetY, onScroll } = useVanceVirtualizer({
        count: listItems.length,
        itemHeight: ROW_HEIGHT,
        containerHeight: containerHeight || 500,
        overscan: 5
    });

    const visibleItems = listItems.slice(virtualItems.startIndex, virtualItems.endIndex + 1);

    if (listItems.length === 0) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-text-muted p-8 text-center bg-panel/30">
                <div className="w-16 h-16 rounded-full bg-panel border border-border flex items-center justify-center mb-4">
                    <Database size={24} className="opacity-20" />
                </div>
                <p className="font-bold text-sm text-text-main">No Records Found</p>
                <p className="text-xs text-text-muted mt-1 max-w-[200px]">
                    {searchQuery ? "Adjust your search parameters." : "Begin data collection to populate the manifest."}
                </p>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="h-full overflow-y-auto relative scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
            onScroll={onScroll}
        >
            <div style={{ height: totalHeight, position: 'relative' }}>
                <div
                    style={{
                        transform: `translateY(${offsetY}px)`,
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%'
                    }}
                >
                    {visibleItems.map((item) => {
                        const key = item.type === 'HEADER' ? `header-${item.id}` : item.data.id;

                        if (item.type === 'HEADER') {
                            return (
                                <div
                                    key={key}
                                    style={{ height: ROW_HEIGHT }}
                                    className="px-6 flex items-end pb-3 text-[10px] font-bold text-text-muted/60 uppercase tracking-[0.2em] bg-app/95 backdrop-blur-sm sticky top-0 z-10"
                                >
                                    <Scan size={12} className="mr-2 mb-0.5 opacity-50" />
                                    {item.label}
                                </div>
                            );
                        }

                        const tree = item.data;
                        const photoCount = mediaMap.get(tree.id) || 0;
                        const hasPhotos = photoCount > 0;

                        return (
                            <div
                                key={key}
                                onClick={() => onEditTree(tree.id)}
                                style={{ height: ROW_HEIGHT }}
                                className="px-4 py-2"
                            >
                                <div className="h-full bg-panel border border-border rounded-2xl flex items-center px-5 gap-5 hover:border-primary/40 hover:bg-panel-soft transition-all cursor-pointer group relative overflow-hidden active:scale-[0.99] shadow-sm">

                                    {/* Active Highlight */}
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />

                                    {/* 1. Tag Block */}
                                    <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-panel-soft border border-border text-text-main font-mono shrink-0 group-hover:border-primary/20 transition-colors">
                                        <span className="text-[10px] text-text-muted uppercase font-bold">TAG</span>
                                        <span className="text-lg font-black leading-none">{tree.tagNumber}</span>
                                    </div>

                                    {/* 2. Bio Data */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <div className="font-bold text-text-main truncate text-base flex items-center gap-2">
                                            {tree.speciesName}
                                            {tree.isUnknown && (
                                                <span className="px-1.5 py-0.5 rounded bg-warning/10 text-warning text-[9px] uppercase tracking-wider font-bold border border-warning/20">
                                                    Unknown
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-text-muted font-medium mt-0.5">
                                            <span className="flex items-center gap-1">
                                                <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                                                GBH: <span className="font-mono text-text-main">{tree.gbh?.toFixed(1)}</span>cm
                                            </span>
                                            {tree.height && (
                                                <span className="flex items-center gap-1 opacity-70">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-border" />
                                                    H: {tree.height}m
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* 3. Status & Media Chip */}
                                    <div className="flex items-center gap-3">

                                        {/* Media Chip */}
                                        <div className={clsx(
                                            "h-8 px-2.5 rounded-lg flex items-center gap-1.5 border transition-all",
                                            hasPhotos
                                                ? "bg-panel-soft border-primary/30 text-primary shadow-[0_0_10px_rgba(var(--primary),0.1)]"
                                                : "bg-transparent border-transparent text-text-muted/30"
                                        )}>
                                            <ImageIcon size={14} strokeWidth={hasPhotos ? 2 : 1.5} />
                                            {hasPhotos && <span className="text-xs font-bold font-mono">{photoCount}</span>}
                                        </div>

                                        {/* Validity Dot */}
                                        <div className="w-2 h-2 rounded-full relative">
                                            {tree.validationStatus === 'FLAGGED' && (
                                                <div className="absolute inset-0 bg-warning animate-ping rounded-full opacity-75" />
                                            )}
                                            <div className={clsx(
                                                "w-full h-full rounded-full border",
                                                tree.validationStatus === 'VERIFIED' ? "bg-success border-success" :
                                                    tree.validationStatus === 'FLAGGED' ? "bg-warning border-warning" :
                                                        "bg-border border-transparent"
                                            )} />
                                        </div>
                                    </div>

                                    {/* Hover Chevron */}
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-primary/50">
                                        <MoreVertical size={16} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};