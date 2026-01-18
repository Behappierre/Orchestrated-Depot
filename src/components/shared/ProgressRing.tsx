interface ProgressRingProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  status?: 'success' | 'warning' | 'danger';
  showValue?: boolean;
}

export function ProgressRing({
  value,
  size = 48,
  strokeWidth = 4,
  status = 'success',
  showValue = true,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  const statusColors = {
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
  };

  const color = statusColors[status];

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        className="progress-ring -rotate-90"
        width={size}
        height={size}
      >
        {/* Background circle */}
        <circle
          className="progress-ring-bg"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{ color: '#334155' }}
        />
        {/* Progress circle */}
        <circle
          className="progress-ring-fill transition-all duration-500 ease-out"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
            filter: `drop-shadow(0 0 6px ${color})`,
          }}
        />
      </svg>

      {showValue && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ color }}
        >
          <span className="text-xs font-bold">{Math.round(value)}</span>
        </div>
      )}
    </div>
  );
}
