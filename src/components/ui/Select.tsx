import React from 'react';
import clsx from 'clsx';
import { CaretDown } from 'phosphor-react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: { value: string; label: string }[];
}

export const Select: React.FC<SelectProps> = ({
    label,
    error,
    options,
    className,
    id,
    ...props
}) => {
    const selectId = id || props.name;

    return (
        <div className="w-full">
            {label && (
                <label htmlFor={selectId} className="block text-sm font-medium text-text-muted mb-1.5">
                    {label}
                </label>
            )}
            <div className="relative">
                <select
                    id={selectId}
                    className={clsx(
                        'w-full bg-panel border rounded-lg px-4 py-2.5 text-text-main appearance-none transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50',
                        error
                            ? 'border-danger focus:border-danger'
                            : 'border-border focus:border-primary',
                        className
                    )}
                    {...props}
                >
                    <option value="" disabled>Select an option</option>
                    {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
                    <CaretDown size={16} />
                </div>
            </div>
            {error && <p className="mt-1 text-xs text-danger">{error}</p>}
        </div>
    );
};
