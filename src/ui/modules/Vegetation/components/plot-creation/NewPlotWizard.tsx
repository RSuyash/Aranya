import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    X, FileText, LayoutGrid,
    ShieldCheck, ArrowRight,
    Satellite, CheckCircle2
} from 'lucide-react';
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

// --- SUB-COMPONENT: STEP INDICATOR ---
const StepItem = ({
    step,
    currentStep,
    label,
    icon: Icon,
    isComplete,
    onClick
}: {
    step: number;
    currentStep: number;
    label: string;
    icon: any;
    isComplete: boolean;
    onClick: () => void;
}) => {
    const isActive = step === currentStep;

    return (
        <button
            onClick={onClick}
            className={clsx(
                "flex items-center gap-4 p-4 rounded-xl transition-all duration-300 border w-full text-left relative overflow-hidden group",
                isActive
                    ? "bg-panel border-primary/40 shadow-lg shadow-primary/10 translate-x-2"
                    : "border-transparent hover:bg-panel-soft/50 hover:translate-x-1"
            )}
        >
            {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}

            <div className={clsx(
                "w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all font-bold",
                isComplete
                    ? "bg-success text-white shadow-md shadow-success/20"
                    : isActive
                        ? "bg-primary text-white shadow-md shadow-primary/20"
                        : "bg-panel border border-border text-text-muted group-hover:border-primary/30 group-hover:text-text-main"
            )}>
                {isComplete ? <CheckCircle2 size={20} /> : <Icon size={20} />}
            </div>
            <div>
                <div className={clsx("text-[10px] uppercase tracking-wider font-bold transition-colors", isActive ? "text-primary" : "text-text-muted")}>
                    Step 0{step}
                </div>
                <div className={clsx("font-bold text-sm transition-colors", isActive ? "text-text-main" : "text-text-muted group-hover:text-text-main")}>{label}</div>
            </div>
        </button>
    );
};

export const NewPlotWizard: React.FC<NewPlotWizardProps> = ({ isOpen, onClose, projectId, moduleId, moduleData }) => {
    const { form, gps, actions, isValid } = usePlotCreation({ projectId, moduleId, moduleData, onClose });
    const { setHeader } = useHeader();
    const [currentStep, setCurrentStep] = useState(1);

    useEffect(() => {
        if (isOpen) {
            setHeader({ isFullScreen: true });
            document.body.style.overflow = 'hidden';
        } else {
            setHeader({ isFullScreen: false });
            document.body.style.overflow = '';
        }
        return () => {
            setHeader({ isFullScreen: false });
            document.body.style.overflow = '';
        };
    }, [isOpen, setHeader]);

    if (!isOpen) return null;

    const isStep1Complete = gps.status === 'LOCKED';
    const isStep2Complete = !!(form.name && form.code);
    const isStep3Complete = !!form.config;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 lg:p-8 animate-in fade-in duration-200">

            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Main Card */}
            <div className="relative w-full max-w-6xl h-[85vh] bg-app border border-border rounded-[32px] shadow-2xl flex flex-col lg:flex-row overflow-hidden animate-in zoom-in-95 duration-200">

                {/* --- LEFT SIDEBAR (Desktop Only) --- */}
                <div className="hidden lg:flex w-1/3 flex-col relative bg-panel-soft border-r border-border p-8 overflow-hidden">
                    <div className="relative z-10 flex flex-col h-full">
                        <div className="mb-8">
                            <div className="flex items-center gap-2 text-primary mb-2">
                                <ShieldCheck size={18} />
                                <span className="text-xs font-bold uppercase tracking-[0.2em]">Protocol</span>
                            </div>
                            <h2 className="text-3xl font-black tracking-tight text-text-main">{moduleData?.name || 'Vegetation Survey'}</h2>
                            <p className="text-text-muted text-sm mt-3 leading-relaxed">
                                Complete the plot definition. GPS acquisition runs in the background.
                            </p>
                        </div>

                        <div className="space-y-3 flex-1">
                            <StepItem step={1} currentStep={currentStep} label="Spatial Anchor" icon={Satellite} isComplete={isStep1Complete} onClick={() => setCurrentStep(1)} />
                            <StepItem step={2} currentStep={currentStep} label="Identity" icon={FileText} isComplete={isStep2Complete} onClick={() => setCurrentStep(2)} />
                            <StepItem step={3} currentStep={currentStep} label="Configuration" icon={LayoutGrid} isComplete={isStep3Complete} onClick={() => setCurrentStep(3)} />
                        </div>

                        <div className="mt-auto pt-6 border-t border-border">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] uppercase tracking-wider font-bold text-text-muted">Satellite Uplink</span>
                                <div className="flex items-center gap-1.5">
                                    <div className={clsx("w-1.5 h-1.5 rounded-full", gps.status === 'LOCKED' ? "bg-success" : "bg-warning animate-pulse")} />
                                    <span className={clsx("text-[10px] font-bold", gps.status === 'LOCKED' ? "text-success" : "text-warning")}>
                                        {gps.status === 'LOCKED' ? "LOCKED" : "ACQUIRING"}
                                    </span>
                                </div>
                            </div>
                            <div className="font-mono text-lg text-text-main tracking-tight font-bold tabular-nums">
                                {gps.location ? `${gps.location.latitude.toFixed(5)}, ${gps.location.longitude.toFixed(5)}` : "Searching..."}
                            </div>
                            {gps.location && (
                                <div className="text-xs text-text-muted mt-1 font-medium flex justify-between">
                                    <span>Accuracy: {gps.location.accuracy.toFixed(1)}m</span>
                                    <span>Sats: {gps.satelliteCount}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* --- RIGHT SIDE: INPUT FORM --- */}
                {/* FIX: Added min-h-0 to prevent flex blowout on mobile */}
                <div className="flex-1 flex flex-col bg-panel relative min-h-0">

                    {/* Header (Mobile Only) */}
                    <div className="lg:hidden p-4 border-b border-border bg-panel flex justify-between items-center shrink-0">
                        <span className="font-bold text-text-main">New Plot</span>
                        <button onClick={onClose}><X className="text-text-muted" /></button>
                    </div>

                    {/* Scrollable Content */}
                    {/* FIX: min-h-0 ensures overflow-y-auto actually works */}
                    <div className="flex-1 min-h-0 overflow-y-auto p-6 lg:p-10 space-y-8 custom-scrollbar bg-panel scroll-smooth">

                        {/* Desktop Close */}
                        <button
                            onClick={onClose}
                            className="hidden lg:flex absolute top-6 right-6 w-8 h-8 rounded-full bg-panel-soft border border-border items-center justify-center text-text-muted hover:text-text-main hover:border-danger hover:text-danger transition-all z-20"
                        >
                            <X size={18} />
                        </button>

                        <section
                            id="step-1"
                            className={clsx("transition-all duration-300 p-1 rounded-2xl", currentStep === 1 ? "ring-2 ring-primary/20 bg-primary/5" : "")}
                            onClick={() => setCurrentStep(1)}
                        >
                            <div className="flex items-center gap-3 mb-4 px-2 pt-2">
                                <span className={clsx(
                                    "flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold transition-colors",
                                    currentStep === 1 ? "bg-primary text-white" : "bg-panel-soft border border-border text-text-muted"
                                )}>1</span>
                                <h3 className="text-lg font-bold text-text-main">Geospatial Lock</h3>
                            </div>
                            <div className="bg-panel border border-border rounded-xl p-1 shadow-sm">
                                <GPSStatusCard gps={gps} className="border-0 shadow-none bg-transparent" />
                            </div>
                        </section>

                        <section
                            id="step-2"
                            className={clsx("transition-all duration-300 p-4 -mx-4 rounded-2xl", currentStep === 2 ? "bg-panel-soft/50 ring-1 ring-border" : "")}
                            onClick={() => setCurrentStep(2)}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <span className={clsx(
                                    "flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold transition-colors",
                                    currentStep === 2 ? "bg-primary text-white" : "bg-panel-soft border border-border text-text-muted"
                                )}>2</span>
                                <h3 className="text-lg font-bold text-text-main">Plot Identity</h3>
                            </div>
                            <div
                                className="bg-panel border border-border rounded-2xl p-6 shadow-sm"
                                onKeyDown={(e) => { if (e.key === 'Enter') setCurrentStep(3); }}
                            >
                                <PlotBasicInfoForm
                                    name={form.name} setName={form.setName}
                                    code={form.code} setCode={form.setCode}
                                />
                            </div>
                        </section>

                        <section
                            id="step-3"
                            className={clsx("transition-all duration-300 p-4 -mx-4 rounded-2xl", currentStep === 3 ? "bg-panel-soft/50 ring-1 ring-border" : "")}
                            onClick={() => setCurrentStep(3)}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <span className={clsx(
                                    "flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold transition-colors",
                                    currentStep === 3 ? "bg-primary text-white" : "bg-panel-soft border border-border text-text-muted"
                                )}>3</span>
                                <h3 className="text-lg font-bold text-text-main">Sampling Design</h3>
                            </div>
                            <div className="rounded-2xl overflow-hidden shadow-sm border border-border">
                                <PlotConfigurator onChange={form.setConfig} />
                            </div>
                        </section>
                    </div>

                    {/* Footer */}
                    <div className="p-6 lg:px-10 border-t border-border bg-panel flex justify-between items-center relative z-10 shrink-0">
                        <div className="text-xs font-medium text-text-muted hidden sm:block">
                            {isValid
                                ? <span className="text-success flex items-center gap-2"><CheckCircle2 size={14} /> Ready for Launch</span>
                                : "Complete all fields to proceed."
                            }
                        </div>
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                            <button
                                onClick={actions.createPlot}
                                disabled={!isValid}
                                className={clsx(
                                    "flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold transition-all shadow-lg",
                                    isValid
                                        ? "bg-primary text-white hover:bg-primary/90 hover:scale-105 shadow-primary/25"
                                        : "bg-panel-soft border border-border text-text-muted cursor-not-allowed opacity-50"
                                )}
                            >
                                {isValid ? <><span className="whitespace-nowrap">Create Plot</span> <ArrowRight size={18} /></> : <>Awaiting Input...</>}
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>,
        document.body
    );
};