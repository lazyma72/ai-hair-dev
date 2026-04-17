import type { 制品规格书 } from "../../../../shared/db/Db沐茵丝假发成品稿";
import { Field, Section, TextInput } from "../components/ui";

type Props = {
  value: 制品规格书["制帽"];
  onChange: (v: 制品规格书["制帽"]) => void;
};

export default function CapSpecSection({ value, onChange }: Props) {
  const nextValue = value as 制品规格书["制帽"];
  return (
    <Section title="制帽规格">
      <div className="grid grid-cols-1 gap-3">
        <Field label="唛头" required>
          <TextInput
            value={nextValue.唛头}
            onChange={(v) => onChange({ ...value, 唛头: v })}
          />
        </Field>
      </div>
    </Section>
  );
}
