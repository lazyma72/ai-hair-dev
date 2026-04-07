import * as React from "react";
import { Field, Section, inputCls } from "../components/ui";

type Props = {
  value: string;
  onChange: (v: string) => void;
};

export default function HighNeedleSection({ value, onChange }: Props) {
  return (
    <Section title="高针指示单">
      <Field label="注意事项">
        <textarea
          rows={3}
          className={inputCls}
          placeholder="高针 :1.高针后帽子不能变形。"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </Field>
    </Section>
  );
}
