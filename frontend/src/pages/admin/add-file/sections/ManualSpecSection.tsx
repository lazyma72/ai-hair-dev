import * as React from "react";
import type { 制品规格书 } from "../../../../shared/db/Db沐茵丝假发成品稿";
import { AddBtn, DelBtn, NumInput, Section, TextInput } from "../components/ui";
import { empty人工档位 } from "../defaults";

type 人工档位 = 制品规格书["人工规格清单"][number];

type Props = {
  list: 制品规格书["人工规格清单"];
  onChange: (v: 制品规格书["人工规格清单"]) => void;
};

export default function ManualSpecSection({ list, onChange }: Props) {
  return (
    <Section
      title="人工规格清单"
      action={
        <AddBtn
          onClick={() =>
            onChange([
              ...list,
              { ...empty人工档位(), 档位: `H${list.length + 1}` },
            ])
          }
        />
      }
    >
      {list.length === 0 ? (
        <p className="text-xs text-slate-400">暂无档位</p>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-[60px_55px_65px_65px_1fr_55px_1fr_auto] gap-2 px-3">
            {[
              "档位",
              "整毛·拉尖",
              "双针·毛长",
              "双针·磅发g",
              "形态",
              "美容·铝管",
              "备注",
              "",
            ].map((h) => (
              <div key={h || "action"} className="text-[10px] font-medium text-slate-400">
                {h}
              </div>
            ))}
          </div>

          {list.map((档位, i) => {
            function p<K extends keyof 人工档位>(key: K, val: 人工档位[K]) {
              const next = [...list];
              next[i] = { ...next[i], [key]: val };
              onChange(next);
            }

            return (
              <div
                key={`${档位.档位}-${档位.整毛.拉尖}-${档位.双针.毛长}-${档位.美容.铝管}`}
                className="grid grid-cols-[60px_55px_65px_65px_1fr_55px_1fr_auto] items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2"
              >
                <TextInput value={档位.档位} onChange={(v) => p("档位", v)} placeholder="H1" />
                <NumInput value={档位.整毛.拉尖} onChange={(n) => p("整毛", { ...档位.整毛, 拉尖: n })} />
                <NumInput value={档位.双针.毛长} onChange={(n) => p("双针", { ...档位.双针, 毛长: n })} />
                <NumInput value={档位.双针.磅发} onChange={(n) => p("双针", { ...档位.双针, 磅发: n })} />
                <TextInput value={档位.形态 ?? ""} onChange={(v) => p("形态", v || undefined)} placeholder="可选" />
                <NumInput value={档位.美容.铝管} onChange={(n) => p("美容", { ...档位.美容, 铝管: n })} />
                <TextInput value={档位.备注 ?? ""} onChange={(v) => p("备注", v || undefined)} placeholder="可选" />
                <DelBtn onClick={() => onChange(list.filter((_, j) => j !== i))} />
              </div>
            );
          })}
        </div>
      )}
    </Section>
  );
}
