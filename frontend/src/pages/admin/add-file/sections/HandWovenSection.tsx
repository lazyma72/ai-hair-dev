import * as React from "react";
import type { 手织指示单 } from "../../../../shared/db/Db沐茵丝假发成品稿";
import { Field, Section, inputCls } from "../components/ui";

type Props = {
  value: 手织指示单;
  onChange: (v: 手织指示单) => void;
};

export default function HandWovenSection({ value, onChange }: Props) {
  return (
    <Section title="手织指示单">
      <Field label="注意事项">
        <textarea
          rows={3}
          className={inputCls}
          placeholder="手织 :1.手织后帽子不能变形。"
          value={value.注意事项}
          onChange={(e) => onChange({ ...value, 注意事项: e.target.value })}
        />
      </Field>

      <div className="mt-3">
        <Field label="手织图 SVG">
          <textarea
            rows={5}
            className={inputCls}
            value={value.手织图.svg}
            onChange={(e) =>
              onChange({ ...value, 手织图: { svg: e.target.value } })
            }
          />
        </Field>
      </div>
    </Section>
  );
}
