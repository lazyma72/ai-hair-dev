type TabItem<T extends string> = {
  key: T;
  label: string;
};

type Props<T extends string> = {
  items: readonly TabItem<T>[];
  activeKey: T;
  onChange: (key: T) => void;
};

export default function DocumentTabs<T extends string>({
  items,
  activeKey,
  onChange,
}: Props<T>) {
  return (
    <div className="flex gap-2">
      {items.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          className={
            key === activeKey
              ? "rounded bg-slate-900 px-3 py-1.5 text-sm text-white"
              : "rounded bg-white px-3 py-1.5 text-sm text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
          }
          onClick={() => onChange(key)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
