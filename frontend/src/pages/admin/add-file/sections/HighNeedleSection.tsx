import * as React from "react";
import type { 高针指示单 } from "../../../../shared/db/Db沐茵丝假发成品稿";
import HighNeedleJsonImporter from "../../../../components/HighNeedleJsonImporter";
import { Field, Section, inputCls } from "../components/ui";

type Props = {
  value: 高针指示单;
  onChange: (v: 高针指示单) => void;
  showJsonImporter?: boolean;
};

export default function HighNeedleSection({
  value,
  onChange,
  showJsonImporter = true,
}: Props) {
  return (
    <Section title="高针指示单">
      <div className="space-y-3">
        <Field label="注意事项">
          <textarea
            rows={3}
            className={inputCls}
            placeholder="高针 :1.高针后帽子不能变形。"
            value={value.注意事项}
            onChange={(e) => onChange({ ...value, 注意事项: e.target.value })}
          />
        </Field>

        {showJsonImporter ? (
          <Field label="高针图 JSON" required>
            <HighNeedleJsonImporter
              value={value.高针图}
              onChange={(v) => onChange({ ...value, 高针图: v })}
            />
          </Field>
        ) : null}
      </div>
    </Section>
  );
}
