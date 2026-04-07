import * as React from "react";
import { useEffect, useState } from "react";

export const inputCls =
  "w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300";

export const numInputCls =
  "w-full rounded border border-slate-200 px-1.5 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300";

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </p>
  );
}

export function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  const labelText = required && !label.includes("*") ? `${label} *` : label;
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-700">
        {labelText}
      </label>
      {children}
    </div>
  );
}

export function NumInput({
  value,
  onChange,
  step = "0.01",
  placeholder,
  disabled,
}: {
  value: number;
  onChange: (n: number) => void;
  step?: string;
  placeholder?: string;
  disabled?: boolean;
}) {
  const fmt = (n: number) => (step === "1" ? String(Math.round(n)) : n.toFixed(2));
  const [raw, setRaw] = useState(fmt(value));

  useEffect(() => {
    if (parseFloat(raw) !== value) setRaw(fmt(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <input
      type="number"
      step={step}
      placeholder={placeholder ?? "0"}
      disabled={disabled}
      className={`${numInputCls}${disabled ? " opacity-40 cursor-not-allowed" : ""}`}
      value={raw}
      onChange={(e) => {
        setRaw(e.target.value);
        const n = parseFloat(e.target.value);
        onChange(isNaN(n) ? 0 : n);
      }}
    />
  );
}

export function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (s: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      className={inputCls}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function AddBtn({
  label = "+ 添加",
  onClick,
}: {
  label?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="rounded bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200"
      onClick={onClick}
    >
      {label}
    </button>
  );
}

export function DelBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="rounded px-2 py-1 text-xs text-slate-400 hover:bg-red-50 hover:text-red-500"
      onClick={onClick}
    >
      删除
    </button>
  );
}

export function Section({
  id,
  title,
  action,
  children,
}: {
  id?: string;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-xl border border-slate-100 bg-slate-50 p-5"
    >
      <div className="mb-3 flex items-center justify-between">
        <SectionTitle>{title}</SectionTitle>
        {action}
      </div>
      {children}
    </section>
  );
}
