export const autoFormatter = (
    maxValue: number,
    type: 'linear' | 'log' | 'time' | 'category' = 'linear'
): (v: number | string) => string => {

    // 1. Pass-through for categories
    if (type === 'category') {
        return (v: number | string) => String(v);
    }

    // 2. Date Formatting
    if (type === 'time') {
        return (v: number | string) => {
            const date = new Date(Number(v));
            // Check if valid date
            if (isNaN(date.getTime())) return '';

            // Smart date formatting based on range could go here
            // For now, standard short date
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
        };
    }

    // 3. Numeric Formatting
    return (v: number | string) => {
        const num = Number(v);
        if (isNaN(num)) return String(v);
        if (num === 0) return '0';

        // Micro values
        if (Math.abs(num) < 0.01) return num.toExponential(1);

        // Small decimals
        if (Math.abs(num) < 1) return num.toFixed(2);

        // Standard range
        if (Math.abs(num) < 1000) {
            return Number.isInteger(num) ? num.toFixed(0) : num.toFixed(1);
        }

        // Large values (k, M)
        if (Math.abs(num) >= 1000 && Math.abs(num) < 1000000) {
            return `${(num / 1000).toFixed(1)}k`;
        }
        if (Math.abs(num) >= 1000000) {
            return `${(num / 1000000).toFixed(1)}M`;
        }

        return num.toFixed(0);
    };
};
