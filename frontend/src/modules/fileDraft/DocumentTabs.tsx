type TabItem<T extends string> = {
  key: T;
  label: string;
};

type Props<T extends string> = {
  items: readonly TabItem<T>[];
  activeKey: T;
  onChange: (key: T) => void;
  compact?: boolean;
};

export default function DocumentTabs<T extends string>({
  items,
  activeKey,
  onChange,
  compact = false,
}: Props<T>) {
  return (
    <div className={`flex flex-wrap ${compact ? "gap-1.5" : "gap-2"}`}>
      {items.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          className={
            key === activeKey
              ? `rounded bg-slate-900 text-white ${compact ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm"}`
              : `rounded bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 ${compact ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm"}`
          }
          onClick={() => onChange(key)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
