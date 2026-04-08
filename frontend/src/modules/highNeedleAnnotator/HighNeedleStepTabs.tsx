import * as React from "react";

type StepKey = "区域" | "档位" | "DML" | "单双" | "自定义文本" | "完成";

type Props = {
  step: StepKey;
  progress: number;
  enableDml?: boolean;
  enableDouble?: boolean;
  stepToIndex: (step: StepKey) => number;
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
  progress,
  enableDml,
  enableDouble,
  stepToIndex,
  onSelect,
}: Props) {
  return (
    <div className="mt-4 grid grid-cols-6 gap-2 text-xs">
      {STEP_TAB_LIST.map((s) => {
        const active = step === s.key;
        const futureLocked = stepToIndex(s.key) > progress;
        const disabled =
          futureLocked || (s.key === "DML" && !enableDml) || (s.key === "单双" && !enableDouble);

        return (
          <button
            key={s.key}
            type="button"
            disabled={disabled}
            className={
              active
                ? "rounded bg-slate-900 px-2 py-1 text-white"
                : disabled
                  ? "cursor-not-allowed rounded bg-slate-50 px-2 py-1 text-slate-300"
                  : "rounded bg-slate-100 px-2 py-1 text-slate-700 hover:bg-slate-200"
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
