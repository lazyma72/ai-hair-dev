type StepKey = "区域" | "档位" | "DML" | "单双" | "自定义文本" | "完成";

type Props = {
  step: StepKey;
  enableDml?: boolean;
  enableDouble?: boolean;
  /** 是否可进入完成态（用于禁用“完成”tab） */
  canEnterDone?: boolean;
  onSelect: (step: StepKey) => void;
};

const STEP_TAB_LIST: Array<{ key: StepKey; label: string }> = [
  { key: "区域", label: "1 区域" },
  { key: "档位", label: "2 档位" },
  { key: "DML", label: "3 DML" },
  { key: "单双", label: "4 单双" },
  { key: "自定义文本", label: "5 文本" },
  { key: "完成", label: "完成" },
];

export default function HighNeedleStepTabs({
  step,
  enableDml,
  enableDouble,
  canEnterDone,
  onSelect,
}: Props) {
  return (
    <div className="mt-4 flex flex-wrap gap-1.5">
      {STEP_TAB_LIST.map((s) => {
        const active = step === s.key;
        const disabled =
          (s.key === "DML" && !enableDml) ||
          (s.key === "单双" && !enableDouble) ||
          (s.key === "完成" && canEnterDone === false);

        return (
          <button
            key={s.key}
            type="button"
            disabled={disabled}
            className={
              active
                ? "rounded-full bg-slate-900 px-3.5 py-1 text-xs font-semibold text-white shadow-sm"
                : disabled
                  ? "cursor-not-allowed rounded-full border border-slate-100 bg-slate-50 px-3.5 py-1 text-xs text-slate-300"
                  : "rounded-full border border-slate-200 bg-white px-3.5 py-1 text-xs text-slate-600 shadow-sm hover:bg-slate-50"
            }
            onClick={() => {
              if (disabled) return;
              onSelect(s.key);
            }}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
