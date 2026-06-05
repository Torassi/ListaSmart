/** QuantityStepper — controle de quantidade (- valor +) acessível. */
import { Minus, Plus } from 'lucide-react';

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
  min?: number;
  max?: number;
}

export function QuantityStepper({ value, onChange, label, min = 0, max = 999 }: QuantityStepperProps) {
  return (
    <div className="inline-flex items-center rounded-md border border-border" role="group" aria-label={label}>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        aria-label={`Diminuir quantidade de ${label}`}
        className="grid h-8 w-8 place-items-center rounded-l-md text-text-muted hover:bg-bg disabled:opacity-40"
        disabled={value <= min}
      >
        <Minus className="h-4 w-4" aria-hidden="true" />
      </button>
      <span className="money w-8 text-center text-sm font-semibold text-text" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        aria-label={`Aumentar quantidade de ${label}`}
        className="grid h-8 w-8 place-items-center rounded-r-md text-text-muted hover:bg-bg disabled:opacity-40"
        disabled={value >= max}
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
