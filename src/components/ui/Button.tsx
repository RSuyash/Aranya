import React from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

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
        primary: 'bg-primary text-app hover:bg-primary/90 shadow-lg shadow-primary/20 hover:-translate-y-0.5',
        secondary: 'bg-panel border border-border text-text-main hover:bg-panel-soft hover:border-primary/50',
        danger: 'bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20',
        ghost: 'bg-transparent text-text-muted hover:text-text-main hover:bg-panel-soft',
        success: 'bg-success text-app hover:bg-success/90 shadow-lg shadow-success/20 hover:-translate-y-0.5',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
        md: 'px-5 py-2.5 text-sm rounded-xl gap-2',
        lg: 'px-8 py-4 text-base rounded-2xl gap-3',
    };

    return (
        <button
            className={clsx(
                'inline-flex items-center justify-center font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none active:scale-[0.98]',
                variants[variant],
                sizes[size],
                className
            )}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading && <Loader2 className="animate-spin" size={size === 'sm' ? 14 : 18} />}
            {!isLoading && leftIcon}
            <span>{children}</span>
            {!isLoading && rightIcon}
        </button>
    );
};