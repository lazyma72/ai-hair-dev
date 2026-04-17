import * as React from "react";
import type { 制品规格书 } from "../../../../shared/db/Db沐茵丝假发成品稿";
import { Field, NumInput, Section } from "../components/ui";

type Props = {
  value: 制品规格书["工程重量"];
  onChange: (v: 制品规格书["工程重量"]) => void;
};

const WEIGHT_KEYS = [
  "整毛",
  "双针",
  "美容",
  "制帽",
  "高针",
  "手织",
  "剪驳",
  "发网",
] as const;

export default function EngineeringWeightSection({ value, onChange }: Props) {
  return (
    <Section title="工程重量（操作值 g）">
      <div className="grid grid-cols-1 gap-3">
        {WEIGHT_KEYS.map((k) => (
          <Field key={k} label={k}>
            <NumInput
              value={value[k]?.加减 ?? 0}
              onChange={(n) =>
                onChange({ ...value, [k]: n === 0 ? undefined : { 加减: n } })
              }
            />
          </Field>
        ))}
      </div>
    </Section>
  );
}
