import type { 制品规格书 } from "../../../../shared/db/Db沐茵丝假发成品稿";
import { Field, Section, TextInput } from "../components/ui";

type Props = {
  value: 制品规格书["制帽"];
  onChange: (v: 制品规格书["制帽"]) => void;
};

export default function CapSpecSection({ value, onChange }: Props) {
  const nextValue = value as unknown as { 编号: string; 唛头: string };
  return (
    <Section title="制帽规格">
      <div className="grid grid-cols-1 gap-3">
        {(["编号", "唛头"] as const).map((k) => (
          <Field key={k} label={k} required>
            <TextInput
              value={nextValue[k]}
              onChange={(v) =>
                onChange({ ...(value as object), [k]: v } as unknown as 制品规格书["制帽"])
              }
            />
          </Field>
        ))}
      </div>
    </Section>
  );
}
