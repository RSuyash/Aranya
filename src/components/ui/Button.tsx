import React from 'react';
import clsx from 'clsx';
import { CircleNotch } from 'phosphor-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    size = 'md',
    isLoading,
    leftIcon,
    rightIcon,
    className,
    disabled,
    ...props
}) => {
    const variants = {
        primary: 'bg-primary text-bg-app hover:bg-primary/90 focus:ring-primary/50',
        secondary: 'bg-panel border border-border text-text-main hover:bg-panel-soft focus:ring-primary/50',
        danger: 'bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20 focus:ring-danger/50',
        ghost: 'bg-transparent text-text-muted hover:text-text-main hover:bg-white/5',
        success: 'bg-success text-bg-app hover:bg-success/90 focus:ring-success/50',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
    };

    return (
        <button
            className={clsx(
                'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg-app disabled:opacity-50 disabled:cursor-not-allowed',
                variants[variant],
                sizes[size],
                className
            )}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && <CircleNotch className="animate-spin" size={16} />}
            {!isLoading && leftIcon}
            {children}
            {!isLoading && rightIcon}
        </button>
    );
};
