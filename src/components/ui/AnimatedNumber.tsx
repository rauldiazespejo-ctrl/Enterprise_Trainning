import React, { useEffect, useState, useRef } from 'react';

interface AnimatedNumberProps {
  value: number | string;
  duration?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

const isNumeric = (val: number | string): boolean => {
  if (typeof val === 'number') return Number.isFinite(val);
  return val !== '' && !Number.isNaN(Number(val.replace(',', '.')));
};

const toNumber = (val: number | string): number => {
  if (typeof val === 'number') return val;
  const parsed = Number(val.replace(',', '.'));
  return Number.isNaN(parsed) ? 0 : parsed;
};

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  duration = 800,
  prefix = '',
  suffix = '',
  className = '',
}) => {
  const [display, setDisplay] = useState<string>(() =>
    isNumeric(value) ? `${prefix}0${suffix}` : `${prefix}${value}${suffix}`
  );
  const startRef = useRef<number | null>(null);
  const targetRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isNumeric(value)) {
      setDisplay(`${prefix}${value}${suffix}`);
      return;
    }

    const target = toNumber(value);
    targetRef.current = target;
    startRef.current = null;

    const step = (timestamp: number) => {
      if (startRef.current === null) startRef.current = timestamp;
      const progress = Math.min(1, (timestamp - startRef.current) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = target * eased;

      const isInteger = Number.isInteger(target);
      setDisplay(`${prefix}${isInteger ? Math.round(current) : current.toFixed(1)}${suffix}`);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };

    rafRef.current = requestAnimationFrame(step);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [value, duration, prefix, suffix]);

  return <span className={`tabular-nums ${className}`}>{display}</span>;
};
