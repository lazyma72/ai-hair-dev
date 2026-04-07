import * as React from "react";
import type { 制品规格书 } from "../../../../shared/db/Db沐茵丝假发成品稿";
import { Field, NumInput, Section, TextInput } from "../components/ui";

type Props = {
  value: 制品规格书["制帽"];
  onChange: (v: 制品规格书["制帽"]) => void;
};

export default function CapSpecSection({ value, onChange }: Props) {
  return (
    <Section title="制帽规格">
      <div className="grid grid-cols-5 gap-3">
        {(["帽围", "帽深", "前后"] as const).map((k) => (
          <Field key={k} label={`${k} (cm)`}>
            <NumInput value={value[k]} onChange={(n) => onChange({ ...value, [k]: n })} />
          </Field>
        ))}
        {(["唛头", "号码"] as const).map((k) => (
          <Field key={k} label={k} required>
            <TextInput value={value[k]} onChange={(v) => onChange({ ...value, [k]: v })} />
          </Field>
        ))}
      </div>
    </Section>
  );
}
