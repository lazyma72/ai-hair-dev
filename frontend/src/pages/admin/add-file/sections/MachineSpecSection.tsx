import * as React from "react";
import type { 制品规格书 } from "../../../../shared/db/Db沐茵丝假发成品稿";
import { AddBtn, DelBtn, Section } from "../components/ui";
import MachineLevelEditor from "../components/MachineLevelEditor";
import { empty机器档位 } from "../defaults";

type Props = {
  list: 制品规格书["机器规格清单"];
  onChange: (v: 制品规格书["机器规格清单"]) => void;
  是间色: boolean;
};

export default function MachineSpecSection({ list, onChange, 是间色 }: Props) {
  return (
    <Section
      title="机器规格清单"
      action={
        <AddBtn
          onClick={() =>
            onChange([
              ...list,
              {
                ...empty机器档位(),
                档位: String(list.length + 1),
              },
            ])
          }
        />
      }
    >
      {list.length === 0 ? (
        <p className="text-xs text-slate-400">暂无档位</p>
      ) : (
        <div className="space-y-3">
          {list.map((档位, i) => (
            <div key={`${档位.档位}-${档位.裁断与重量.length}-${档位.双针.毛长}-${档位.美容.铝管}`}>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">档位 {i + 1}</span>
                <DelBtn onClick={() => onChange(list.filter((_, j) => j !== i))} />
              </div>
              <MachineLevelEditor
                value={档位}
                是间色={是间色}
                onChange={(v) => {
                  const next = [...list];
                  next[i] = v;
                  onChange(next);
                }}
              />
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}
