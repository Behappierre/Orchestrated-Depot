import { useEffect, useState, useRef } from 'react';
import { clsx } from 'clsx';

interface AnimatedCounterProps {
  value: number;
  className?: string;
  duration?: number;
  decimals?: number;
}

export function AnimatedCounter({
  value,
  className,
  duration = 500,
  decimals = 0,
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValue = useRef(value);

  useEffect(() => {
    const startValue = previousValue.current;
    const endValue = value;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);

      const currentValue = startValue + (endValue - startValue) * easeOut;
      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        previousValue.current = endValue;
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return (
    <span className={clsx('tabular-nums', className)}>
      {displayValue.toFixed(decimals)}
    </span>
  );
}
