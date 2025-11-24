import React from 'react';
import clsx from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    leftIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
    label,
    error,
    leftIcon,
    className,
    id,
    ...props
}) => {
    const inputId = id || props.name;

    return (
        <div className="w-full">
            {label && (
                <label htmlFor={inputId} className="block text-sm font-medium text-text-muted mb-1.5">
                    {label}
                </label>
            )}
            <div className="relative">
                {leftIcon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
                        {leftIcon}
                    </div>
                )}
                <input
                    id={inputId}
                    className={clsx(
                        'w-full bg-panel border rounded-lg px-4 py-2.5 text-text-main placeholder-text-muted/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50',
                        leftIcon ? 'pl-10' : '',
                        error
                            ? 'border-danger focus:border-danger'
                            : 'border-border focus:border-primary',
                        className
                    )}
                    {...props}
                />
            </div>
            {error && <p className="mt-1 text-xs text-danger">{error}</p>}
        </div>
    );
};
