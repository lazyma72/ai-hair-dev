import * as React from "react";
import type { 制品规格书 } from "../../../../shared/db/Db沐茵丝假发成品稿";
import { AddBtn, DelBtn, Section, inputCls } from "../components/ui";
import { empty工艺说明, 工艺说明Keys } from "../defaults";

type Props = {
  list: 制品规格书["工艺说明"];
  onChange: (v: 制品规格书["工艺说明"]) => void;
};

export default function ProcessNotesSection({ list, onChange }: Props) {
  return (
    <Section
      title="工艺说明"
      action={<AddBtn onClick={() => onChange([...list, empty工艺说明()])} />}
    >
      {list.length === 0 ? (
        <p className="text-xs text-slate-400">暂无</p>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-[repeat(9,1fr)_auto] gap-3 px-4">
            {[...工艺说明Keys, ""].map((h) => (
              <div key={h || "action"} className="text-[10px] font-medium text-slate-400">
                {h}
              </div>
            ))}
          </div>

          {list.map((行, i) => (
            <div
              key={JSON.stringify(行)}
              className="grid grid-cols-[repeat(9,1fr)_auto] items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2"
            >
              {工艺说明Keys.map((k) => (
                <input
                  key={k}
                  type="text"
                  className={inputCls}
                  value={行[k] ?? ""}
                  onChange={(e) => {
                    const next = [...list];
                    next[i] = { ...next[i], [k]: e.target.value };
                    onChange(next);
                  }}
                />
              ))}

              <DelBtn onClick={() => onChange(list.filter((_, j) => j !== i))} />
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}
