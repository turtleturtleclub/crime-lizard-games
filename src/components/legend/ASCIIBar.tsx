import React from 'react';

interface ASCIIBarProps {
    current: number;
    max: number;
    width?: number;
    label?: string;
    color?: 'red' | 'blue' | 'green' | 'gold' | 'purple';
    showNumbers?: boolean;
}

const ASCIIBar: React.FC<ASCIIBarProps> = ({
    current,
    max,
    width = 20,
    label,
    color = 'green',
    showNumbers = true
}) => {
    const percentage = Math.min(100, Math.max(0, (current / max) * 100));
    const filled = Math.round((percentage / 100) * width);
    const empty = width - filled;

    const colorClasses = {
        red: 'text-red-500 text-glow-red',
        blue: 'text-blue-400 text-glow-blue',
        green: 'text-[#00FF88] text-glow-green',
        gold: 'text-yellow-500 text-glow-gold',
        purple: 'text-purple-500'
    };

    const barChars = {
        filled: '█',
        empty: '░'
    };

    return (
        <div className="font-bbs text-lg">
            {label && (
                <div className="text-gray-400 mb-1">
                    {label}
                    {showNumbers && (
                        <span className="float-right text-white">
                            {current}/{max}
                        </span>
                    )}
                </div>
            )}
            <div className={colorClasses[color]}>
                [{barChars.filled.repeat(filled)}{barChars.empty.repeat(empty)}]
                {!label && showNumbers && ` ${current}/${max}`}
            </div>
        </div>
    );
};

export default ASCIIBar;
