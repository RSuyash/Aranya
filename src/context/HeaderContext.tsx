import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export interface BreadcrumbItem {
    label: string;
    path?: string;
}

interface HeaderState {
    title: string;
    breadcrumbs: BreadcrumbItem[];
    actions: ReactNode | null;
    status: ReactNode | null;
    moduleColor: 'default' | 'emerald' | 'cyan' | 'amber' | 'rose' | 'blue' | 'indigo' | 'violet';
    isLoading: boolean;
}

interface HeaderContextType extends HeaderState {
    setHeader: (state: Partial<HeaderState>) => void;
}

const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

export const HeaderProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [state, setState] = useState<HeaderState>({
        title: 'Terra',
        breadcrumbs: [],
        actions: null,
        status: null,
        moduleColor: 'default',
        isLoading: false,
    });

    const setHeader = React.useCallback((updates: Partial<HeaderState>) => {
        setState(prev => ({ ...prev, ...updates }));
    }, []);

    const value = React.useMemo(() => ({ ...state, setHeader }), [state, setHeader]);

    return (
        <HeaderContext.Provider value={value}>
            {children}
        </HeaderContext.Provider>
    );
};

export const useHeader = (config?: Partial<HeaderState>) => {
    const context = useContext(HeaderContext);
    if (!context) throw new Error('useHeader must be used within a HeaderProvider');

    // Auto-update on mount if config is provided
    useEffect(() => {
        if (config) {
            context.setHeader(config);
        }
        // Cleanup logic could go here to reset header on unmount
        // But usually, the next page just overwrites it.
    }, [config?.title, config?.breadcrumbs, config?.isLoading, config?.moduleColor, config?.status, config?.actions]);

    return context;
};
