import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, Loader2, MapPin, FileText, LayoutGrid } from 'lucide-react';
import { clsx } from 'clsx';
import { usePlotCreation } from './usePlotCreation';
import { GPSStatusCard } from './GPSStatusCard';
import { PlotBasicInfoForm } from './PlotBasicInfoForm';
import { PlotConfigurator } from '../../ui/PlotConfigurator';
import { useHeader } from '../../../../../context/HeaderContext';
import type { VegetationModule } from '../../../../../core/data-model/types';

interface NewPlotWizardProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    moduleId: string;
    moduleData?: VegetationModule;
}

export const NewPlotWizard: React.FC<NewPlotWizardProps> = ({ isOpen, onClose, projectId, moduleId, moduleData }) => {
    const { form, gps, actions, isValid } = usePlotCreation({ projectId, moduleId, moduleData, onClose });
    const { setHeader } = useHeader();

    // THIS IS THE FIX: Control isFullScreen based on wizard open/close state
    useEffect(() => {
        if (isOpen) {
            setHeader({ isFullScreen: true });
        } else {
            setHeader({ isFullScreen: false });
        }

        // Cleanup on unmount
        return () => {
            setHeader({ isFullScreen: false });
        };
    }, [isOpen, setHeader]);

    if (!isOpen) return null;

    const StepCard = ({
        icon: Icon,
        title,
        subtitle,
        isActive,
        isCompleted,
        children
    }: { icon: any, title: string, subtitle: string, isActive?: boolean, isCompleted?: boolean, children: React.ReactNode }) => (
        <div className={clsx(
            "relative pl-8 pb-8 border-l-2 transition-all duration-500 last:pb-0 last:border-l-0",
            isActive ? "border-primary" : isCompleted ? "border-success" : "border-border"
        )}>
            {/* Timeline Dot */}
            <div className={clsx(
                "absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 transition-all duration-500 flex items-center justify-center bg-app",
                isActive ? "border-primary shadow-[0_0_10px_rgba(86,204,242,0.5)] scale-110" :
                    isCompleted ? "border-success bg-success" : "border-border"
            )}>
                {isCompleted && <div className="w-1.5 h-1.5 bg-app rounded-full" />}
            </div>

            {/* Header */}
            <div className="mb-4 -mt-1.5">
                <div className="mb-1">{Icon && <Icon className="w-5 h-5" />}</div>
                <h4 className={clsx(
                    "text-sm font-bold uppercase tracking-wider transition-colors",
                    isActive ? "text-primary" : isCompleted ? "text-success" : "text-text-muted"
                )}>{title}</h4>
                <p className="text-[10px] text-text-muted font-medium">{subtitle}</p>
            </div>

            {/* Card Body */}
            <div className={clsx(
                "rounded-2xl border transition-all duration-300 overflow-hidden",
                isActive
                    ? "bg-panel border-primary/30 shadow-lg shadow-primary/5"
                    : "bg-panel/50 border-border opacity-80 grayscale-[0.3]"
            )}>
                <div className="p-4 md:p-5">
                    {children}
                </div>
            </div>
        </div>
    );

    return createPortal(
        <div className="fixed inset-0 z-[9999] bg-app flex flex-col h-[100dvh] w-full overflow-hidden animate-in slide-in-from-bottom duration-300">

            {/* Background Ambient Glow */}
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-success/5 rounded-full blur-3xl pointer-events-none" />

            {/* 1. Header - Glassmorphism */}
            <div className="relative px-6 py-4 border-b border-border flex items-center justify-between bg-app/80 backdrop-blur-md shrink-0 z-20">
                <div>
                    <h3 className="text-xl font-bold text-text-main tracking-tight">New Plot</h3>
                    <div className="flex items-center gap-2 text-[10px] text-success font-mono uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                        System Active
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="w-10 h-10 rounded-full bg-panel-soft border border-border flex items-center justify-center text-text-muted hover:text-text-main hover:border-danger transition-all active:scale-90"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* 2. Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 scrollbar-none z-10 relative">
                <div className="max-w-2xl mx-auto pt-2 pb-4">

                    {/* Step 1: Location */}
                    <StepCard
                        icon={MapPin}
                        title="Location Fix"
                        subtitle="Acquiring satellite positioning"
                        isActive={gps.status !== 'LOCKED'}
                        isCompleted={gps.status === 'LOCKED'}
                    >
                        <GPSStatusCard gps={gps} />
                    </StepCard>

                    {/* Step 2: Details */}
                    <StepCard
                        icon={FileText}
                        title="Plot Identity"
                        subtitle="Naming and classification"
                        isActive={gps.status === 'LOCKED' && (!form.name || !form.code)}
                        isCompleted={!!(form.name && form.code)}
                    >
                        <PlotBasicInfoForm
                            name={form.name} setName={form.setName}
                            code={form.code} setCode={form.setCode}
                        />
                    </StepCard>

                    {/* Step 3: Configuration */}
                    <StepCard
                        icon={LayoutGrid}
                        title="Sampling Design"
                        subtitle="Dimensions and subplots"
                        isActive={!!(form.name && form.code)}
                        isCompleted={false} // Always editable until submit
                    >
                        {/* Removed inner padding/bg to blend seamlessly with the magnificent card style */}
                        <div className="-m-2">
                            <PlotConfigurator onChange={form.setConfig} />
                        </div>
                    </StepCard>

                    {/* Bottom spacer to ensure content isn't hidden behind the floating footer */}
                    <div className="h-32" />
                </div>
            </div>

            {/* 3. Footer - Floating Action Bar */}
            {/* Uses absolute positioning relative to the viewport bottom with safe area padding */}
            <div className="absolute bottom-0 left-0 right-0 p-4 pt-8 bg-gradient-to-t from-app via-app to-transparent z-30">
                <div className="max-w-2xl mx-auto pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
                    <button
                        onClick={actions.createPlot}
                        disabled={!isValid}
                        className={clsx(
                            "w-full h-14 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all duration-300 shadow-2xl",
                            isValid
                                ? "bg-gradient-to-r from-primary to-success text-app hover:shadow-[0_0_20px_rgba(82,210,115,0.4)] scale-100"
                                : "bg-panel-soft border border-border text-text-muted cursor-not-allowed"
                        )}
                    >
                        {isValid ? (
                            <>
                                <CheckCircle className="w-6 h-6 fill-app text-success" />
                                <span>Initialize Plot</span>
                            </>
                        ) : (
                            <>
                                {gps.location ? (
                                    <span className="flex items-center gap-2">Complete Required Fields</span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="w-5 h-5 animate-spin" /> Waiting for GPS...
                                    </span>
                                )}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};