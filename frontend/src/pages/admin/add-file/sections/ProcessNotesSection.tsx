import * as React from "react";
import type { 制品规格书 } from "../../../../shared/db/Db沐茵丝假发成品稿";
import { AddBtn, DelBtn, Field, Section, inputCls } from "../components/ui";
import { 工艺说明Keys } from "../defaults";

type FieldErrors = Partial<Record<string, string>>;

type Props = {
  list: 制品规格书["工艺说明"];
  onChange: (v: 制品规格书["工艺说明"]) => void;
  errors?: FieldErrors;
  clearError?: (key: string) => void;
};

export default function ProcessNotesSection({
  list,
  onChange,
  errors,
  clearError,
}: Props) {
  const [customKey, setCustomKey] = React.useState("");
  const [customValue, setCustomValue] = React.useState("");
  const [customError, setCustomError] = React.useState("");

  const fixedKeySet = React.useMemo(() => new Set<string>(工艺说明Keys), []);
  const customEntries = React.useMemo(
    () =>
      (Object.entries(list) as [string, string][]).filter(
        ([k]) => !fixedKeySet.has(k),
      ),
    [fixedKeySet, list],
  );

  const addCustom = React.useCallback(() => {
    const key = customKey.trim();
    if (!key) {
      setCustomError("自定义工艺名称不能为空");
      return;
    }
    if (Object.prototype.hasOwnProperty.call(list, key)) {
      setCustomError("工艺名称不能重复");
      return;
    }
    onChange({ ...list, [key]: customValue });
    setCustomKey("");
    setCustomValue("");
    setCustomError("");
  }, [customKey, customValue, list, onChange]);

  return (
    <Section title="工艺说明">
      <div className="space-y-3">
        {工艺说明Keys.map((k) => {
          const errorKey = `工艺说明.${k}`;
          const fieldError = errors?.[errorKey];
          return (
            <Field key={k} label={k} required error={fieldError}>
              <input
                type="text"
                className={`${inputCls}${fieldError ? " border-rose-400 focus:ring-rose-200" : ""}`}
                value={list[k] ?? ""}
                onChange={(e) => {
                  clearError?.(errorKey);
                  onChange({ ...list, [k]: e.target.value });
                }}
              />
            </Field>
          );
        })}

        <div className="border-t border-slate-200 pt-2">
          <p className="mb-3 text-xs font-semibold text-slate-500">
            自定义工艺说明
          </p>

          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="工艺名称">
                <input
                  type="text"
                  className={inputCls}
                  placeholder="例如：包装补充"
                  value={customKey}
                  onChange={(e) => {
                    setCustomKey(e.target.value);
                    if (customError) setCustomError("");
                  }}
                />
              </Field>
              <Field label="说明内容">
                <input
                  type="text"
                  className={inputCls}
                  placeholder="请输入说明"
                  value={customValue}
                  onChange={(e) => {
                    setCustomValue(e.target.value);
                    if (customError) setCustomError("");
                  }}
                />
              </Field>
            </div>

            <div className="flex items-center gap-3">
              <AddBtn label="+ 添加自定义项" onClick={addCustom} />
              {customError ? (
                <p className="text-xs text-rose-500">{customError}</p>
              ) : null}
            </div>

            {customEntries.length > 0 ? (
              <div className="space-y-3">
                {customEntries.map(([k, v]) => (
                  <div key={k} className="flex items-end gap-2">
                    <div className="flex-1">
                      <Field label={k}>
                        <input
                          type="text"
                          className={inputCls}
                          value={v}
                          onChange={(e) =>
                            onChange({ ...list, [k]: e.target.value })
                          }
                        />
                      </Field>
                    </div>
                    <DelBtn
                      onClick={() => {
                        const next: 制品规格书["工艺说明"] = { ...list };
                        delete next[k];
                        onChange(next);
                      }}
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </Section>
  );
}
