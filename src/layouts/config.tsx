import {
    SquaresFour,
    TreeStructure,
    MapTrifold,
    Gear,
    Leaf,
    Bird,
    Drop,
    ChartBar
} from 'phosphor-react';

export interface NavItem {
    label: string;
    path: string;
    icon: any;
    section?: 'main' | 'modules' | 'analytics' | 'system';
    beta?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
    // Main Context
    { label: 'Mission Control', path: '/', icon: SquaresFour, section: 'main' },
    { label: 'Projects', path: '/projects', icon: TreeStructure, section: 'main' },
    { label: 'Global Map', path: '/map', icon: MapTrifold, section: 'main' },

    // Scientific Modules
    { label: 'Vegetation', path: '/projects/vegetation', icon: Leaf, section: 'modules' },
    { label: 'Bird Surveys', path: '/projects/birds', icon: Bird, section: 'modules', beta: true },
    { label: 'Water Quality', path: '/projects/water', icon: Drop, section: 'modules', beta: true },

    // Analysis
    { label: 'Analysis', path: '/analysis', icon: ChartBar, section: 'analytics' },

    // System
    { label: 'Settings', path: '/settings', icon: Gear, section: 'system' },
];