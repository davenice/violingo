"use client";

interface StepperProps {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function Stepper({ label, hint, value, min, max, onChange, disabled }: StepperProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="font-medium">{label}</p>
        {hint && <p className="text-xs text-zinc-500">{hint}</p>}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={disabled || value <= min}
          onClick={() => onChange(value - 1)}
          aria-label={`Decrease ${label}`}
          className="h-9 w-9 rounded-full border border-zinc-300 text-lg font-bold disabled:opacity-30"
        >
          −
        </button>
        <span className="w-8 text-center text-lg font-bold">{value}</span>
        <button
          type="button"
          disabled={disabled || value >= max}
          onClick={() => onChange(value + 1)}
          aria-label={`Increase ${label}`}
          className="h-9 w-9 rounded-full border border-zinc-300 text-lg font-bold disabled:opacity-30"
        >
          +
        </button>
      </div>
    </div>
  );
}
