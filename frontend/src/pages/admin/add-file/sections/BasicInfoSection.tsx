import * as React from "react";
import { Select } from "antd";
import type { 沐茵丝假发成品稿 } from "../../../../shared/db/Db沐茵丝假发成品稿";
import { 假发类型 } from "../../../../shared/db/Db沐茵丝假发成品稿";
import type { DbCustomer } from "../../../../shared/db/DbCustomer";
import { Field, Section, inputCls } from "../components/ui";

type FieldErrors = Partial<Record<string, string>>;

type Props = {
  form: 沐茵丝假发成品稿;
  setForm: React.Dispatch<React.SetStateAction<沐茵丝假发成品稿>>;
  customerList: DbCustomer[];
  errors?: FieldErrors;
  clearError?: (key: string) => void;
};

export default function BasicInfoSection({
  form,
  setForm,
  customerList,
  errors,
  clearError,
}: Props) {
  const err = (key: string) => errors?.[key];

  return (
    <Section title="基本信息">
      <div className="grid grid-cols-1 gap-3">
        <Field label="样品编号" required error={err("样品编号")}>
          <input
            type="text"
            required
            placeholder="XM-6190(L)"
            className={`${inputCls}${err("样品编号") ? " border-rose-400 focus:ring-rose-200" : ""}`}
            value={form.样品编号}
            onChange={(e) => {
              clearError?.("样品编号");
              setForm((f) => ({ ...f, 样品编号: e.target.value }));
            }}
          />
        </Field>

        <Field label="假发类型">
          <select
            className={inputCls}
            value={form.假发类型}
            onChange={(e) => {
              const next = e.target.value as 假发类型;
              setForm((f) => ({
                ...f,
                假发类型: next,
                制品规格书:
                  next !== 假发类型.间色
                    ? {
                        ...f.制品规格书,
                        机器规格清单: f.制品规格书.机器规格清单.map(
                          ({ DML比值: _omit, ...rest }) => rest,
                        ),
                        人工规格清单: f.制品规格书.人工规格清单.map((row) => {
                          const { DML比值: _omit, ...rest } = row as typeof row & {
                            DML比值?: { D: number; L?: number };
                          };
                          return rest;
                        }),
                      }
                    : f.制品规格书,
              }));
            }}
          >
            {Object.values(假发类型).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>

        <Field label="客户编号" required error={err("客户编号")}>
          <Select
            className="w-full"
            status={err("客户编号") ? "error" : undefined}
            value={form.客户编号 || undefined}
            options={customerList.map((c) => ({
              label: `${c.客户编号}${c.客户名称 ? ` - ${c.客户名称}` : ""}`,
              value: c.客户编号,
            }))}
            placeholder="选择客户编号 / 客户名称"
            allowClear
            showSearch
            optionFilterProp="label"
            onChange={(v) => {
              clearError?.("客户编号");
              setForm((f) => ({ ...f, 客户编号: v ?? "" }));
            }}
          />
        </Field>

        {(
          [
            { key: "品名" as const, placeholder: "Michelle BB TBOB080" },
            { key: "原材料" as const, placeholder: "FU:50%+HL:50%" },
            { key: "CAP" as const, placeholder: "P-025(侧分雪花网L)" },
          ] as const
        ).map(({ key, placeholder }) => (
          <Field key={key} label={key} required error={err(key)}>
            <input
              type="text"
              required
              placeholder={placeholder}
              className={`${inputCls}${err(key) ? " border-rose-400 focus:ring-rose-200" : ""}`}
              value={form[key]}
              onChange={(e) => {
                clearError?.(key);
                setForm((f) => ({ ...f, [key]: e.target.value }));
              }}
            />
          </Field>
        ))}
      </div>
    </Section>
  );
}
