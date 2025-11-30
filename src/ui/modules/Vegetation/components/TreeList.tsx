import React, { useRef, useMemo } from 'react';
import type { TreeObservation } from '../../../../core/data-model/types';
import { useVanceVirtualizer } from '../../../../hooks/useVanceVirtualizer';
import { useResponsive } from '../../../../hooks/useResponsive';
import { Sprout, AlertTriangle, CheckCircle2, MoreVertical } from 'lucide-react';

interface TreeListProps {
    trees: TreeObservation[];
    onEditTree: (id: string) => void;
    searchQuery?: string;
}

const ROW_HEIGHT = 72; // px

export const TreeList: React.FC<TreeListProps> = ({ trees, onEditTree, searchQuery = '' }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { height: containerHeight } = useResponsive(containerRef);

    // Filter trees based on search query
    const filteredTrees = useMemo(() => {
        if (!searchQuery.trim()) {
            return trees;
        }

        const query = searchQuery.toLowerCase().trim();
        return trees.filter(tree =>
            tree.speciesName.toLowerCase().includes(query) ||
            tree.tagNumber.toLowerCase().includes(query) ||
            (tree.commonName && tree.commonName.toLowerCase().includes(query)) ||
            (tree.samplingUnitId && tree.samplingUnitId.toLowerCase().includes(query))
        );
    }, [trees, searchQuery]);

    const { totalHeight, virtualItems, offsetY, onScroll } = useVanceVirtualizer({
        count: filteredTrees.length,
        itemHeight: ROW_HEIGHT,
        containerHeight: containerHeight || 500, // Fallback
    });

    // Slice the data to only what is visible
    const visibleTrees = filteredTrees.slice(virtualItems.startIndex, virtualItems.endIndex + 1);

    if (filteredTrees.length === 0) {
        if (searchQuery.trim()) {
            // Show search results empty state
            return (
                <div className="h-full flex flex-col items-center justify-center text-text-muted p-8 text-center">
                    <Sprout size={48} className="opacity-20 mb-4" />
                    <p>No matches for "{searchQuery}".</p>
                    <p className="text-xs">Try another species or tag number.</p>
                </div>
            );
        } else {
            // Show default empty state
            return (
                <div className="h-full flex flex-col items-center justify-center text-text-muted p-8 text-center">
                    <Sprout size={48} className="opacity-20 mb-4" />
                    <p>No organic signatures detected.</p>
                    <p className="text-xs">Switch to Map View to add trees.</p>
                </div>
            );
        }
    }

    return (
        <div
            ref={containerRef}
            className="h-full overflow-y-auto relative scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent"
            onScroll={onScroll}
        >
            {/* Phantom Container to force scrollbar height */}
            <div style={{ height: totalHeight, position: 'relative' }}>
                {/* Virtual Window - Moved via GPU Transform */}
                <div
                    style={{
                        transform: `translateY(${offsetY}px)`,
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%'
                    }}
                >
                    {visibleTrees.map((tree) => (
                        <div
                            key={tree.id}
                            onClick={() => onEditTree(tree.id)}
                            className="h-[64px] mb-2 mx-4 bg-panel border border-border rounded-xl flex items-center px-4 gap-4 active:scale-[0.99] transition-transform cursor-pointer hover:border-primary/50"
                        >
                            {/* Tag Badge */}
                            <div className="w-10 h-10 rounded-lg bg-panel-soft flex items-center justify-center font-mono font-bold text-xs text-primary border border-white/5">
                                {tree.tagNumber}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-text-main truncate text-sm">
                                    {tree.speciesName}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-text-muted">
                                    <span className="font-mono">{tree.gbh?.toFixed(1)}cm GBH</span>
                                    <span>•</span>
                                    <span>{tree.samplingUnitId}</span>
                                </div>
                            </div>

                            {/* Status Indicators */}
                            <div className="flex items-center gap-3">
                                {tree.validationStatus === 'FLAGGED' && (
                                    <AlertTriangle size={16} className="text-warning" />
                                )}
                                {tree.validationStatus === 'VERIFIED' && (
                                    <CheckCircle2 size={16} className="text-success" />
                                )}
                                <button className="p-2 text-text-muted hover:text-text-main">
                                    <MoreVertical size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};