import * as React from "react";
import { useEffect, useState } from "react";
import {
  type 分数字符,
  整数加分数组合值,
  数字转分数,
} from "../../../../shared/models/分数转换";

export const inputCls =
  "w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300";

export const numInputCls =
  "w-full rounded border border-slate-200 px-1.5 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300";

function fmt最多一位小数(n: number): string {
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
      {children}
    </p>
  );
}

export function Field({
  label,
  labelExtra,
  required,
  children,
}: {
  label: string;
  labelExtra?: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
}) {
  const labelText = required && !label.includes("*") ? `${label} *` : label;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2 text-xs font-medium text-slate-700">
        <span>{labelText}</span>
        {labelExtra}
      </div>
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
  const fmt = (n: number) =>
    step === "1" ? String(Math.round(n)) : n.toFixed(2);
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

export function OneDecimalInput({
  value,
  onChange,
  placeholder,
  disabled,
}: {
  value: number;
  onChange: (n: number) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [raw, setRaw] = useState(fmt最多一位小数(value));

  useEffect(() => {
    const n = parseFloat(raw);
    if (isNaN(n) || Math.round(n * 10) / 10 !== Math.round(value * 10) / 10) {
      setRaw(fmt最多一位小数(value));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <input
      type="number"
      step="0.1"
      placeholder={placeholder ?? "0"}
      disabled={disabled}
      className={`${numInputCls}${disabled ? " opacity-40 cursor-not-allowed" : ""}`}
      value={raw}
      onChange={(e) => {
        setRaw(e.target.value);
        const n = parseFloat(e.target.value);
        onChange(isNaN(n) ? 0 : Math.round(n * 10) / 10);
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

export function PresetTextInput({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (s: string) => void;
  options: readonly string[];
  placeholder?: string;
}) {
  const listId = React.useId();

  return (
    <>
      <input
        type="text"
        list={listId}
        placeholder={placeholder}
        className={inputCls}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <datalist id={listId}>
        {options.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </>
  );
}

export function QuarterFractionInput({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (n: number) => void;
  disabled?: boolean;
}) {
  const parsed = 数字转分数(value);

  return (
    <div className="flex items-center gap-1">
      <input
        type="number"
        step="1"
        disabled={disabled}
        className={`${numInputCls}${disabled ? " opacity-40 cursor-not-allowed" : ""}`}
        value={parsed.整数}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          onChange(整数加分数组合值(isNaN(n) ? 0 : n, parsed.分数));
        }}
      />

      <select
        disabled={disabled}
        className={`${inputCls} min-w-[68px] px-2${disabled ? " opacity-40 cursor-not-allowed" : ""}`}
        value={parsed.分数}
        onChange={(e) => {
          onChange(整数加分数组合值(parsed.整数, e.target.value as 分数字符));
        }}
      >
        <option value="">0</option>
        <option value="¼">¼</option>
        <option value="½">½</option>
        <option value="¾">¾</option>
      </select>
    </div>
  );
}

export function OptionalQuarterFractionInput({
  enabled,
  value,
  onChange,
}: {
  enabled: boolean;
  value: number;
  onChange: (n: number) => void;
}) {
  return enabled ? (
    <QuarterFractionInput value={value} onChange={onChange} />
  ) : null;
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

export function DelBtn({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`rounded px-2 py-1 text-xs ${
        disabled
          ? "cursor-not-allowed text-slate-200"
          : "text-slate-400 hover:bg-red-50 hover:text-red-500"
      }`}
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
