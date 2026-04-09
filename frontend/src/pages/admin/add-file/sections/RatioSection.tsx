import * as React from "react";
import { Select } from "antd";
import type { Db胶丝比例 } from "../../../../shared/db/Db胶丝比例";
import { Field, Section } from "../components/ui";

type RatioId = Db胶丝比例["_id"];

type Props = {
  value: RatioId;
  onChange: (v: RatioId) => void;
  发丝种类选项: string[];
  颜色编号选项: string[];
};

export default function RatioSection({
  value,
  onChange,
  发丝种类选项,
  颜色编号选项,
}: Props) {
  return (
    <Section title="胶丝比例">
      <div className="grid grid-cols-1 gap-3">
        <Field label="发丝种类">
          <Select
            className="w-full"
            value={value.发丝种类 || undefined}
            options={发丝种类选项.map((t) => ({ label: t, value: t }))}
            placeholder="选择发丝种类"
            allowClear
            showSearch
            optionFilterProp="label"
            onChange={(v) => onChange({ 颜色编号: "", 发丝种类: v ?? "" })}
          />
        </Field>

        <Field label="颜色编号">
          <Select
            className="w-full"
            value={value.颜色编号 || undefined}
            options={颜色编号选项.map((c) => ({ label: c, value: c }))}
            placeholder={value.发丝种类 ? "选择颜色编号" : "请先选择发丝种类"}
            disabled={!value.发丝种类}
            allowClear
            showSearch
            optionFilterProp="label"
            onChange={(v) => onChange({ ...value, 颜色编号: v ?? "" })}
          />
        </Field>
      </div>

      {!!value.发丝种类 && !!value.颜色编号 ? (
        <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-600">
          <div className="space-y-1.5">
            <div>
              已选择发丝种类：
              <span className="ml-1 font-medium">{value.发丝种类}</span>
            </div>
            <div>
              已选择颜色编号：
              <span className="ml-1 font-mono font-medium">
                {value.颜色编号}
              </span>
            </div>
            <div className="text-slate-400">详情可在“胶丝比例”页面查看</div>
          </div>
        </div>
      ) : null}
    </Section>
  );
}
