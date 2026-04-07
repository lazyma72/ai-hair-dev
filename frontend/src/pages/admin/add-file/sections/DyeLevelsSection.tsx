import * as React from "react";
import { useMemo } from "react";
import type { 染色档位 } from "../../../../shared/db/Db沐茵丝假发成品稿";
import { AddBtn, DelBtn, Section } from "../components/ui";
import {
  clone染色档位示例,
  DyeLevelEditor,
} from "../components/DyeLevelEditor";

type Props = {
  list: 染色档位[];
  onChange: (v: 染色档位[]) => void;
  全部档位名: string[];
};

function normalizeName(s: string): string {
  return s.trim();
}

export default function DyeLevelsSection({ list, onChange, 全部档位名 }: Props) {
  const normalizedNames = useMemo(() => {
    const trimmed = 全部档位名.map(normalizeName).filter(Boolean);
    return Array.from(new Set(trimmed));
  }, [全部档位名]);

  return (
    <Section
      id="dye-levels"
      title="染色档位列表"
      action={<AddBtn onClick={() => onChange([...list, clone染色档位示例("普通")])} />}
    >
      {list.length === 0 ? (
        <p className="text-xs text-slate-400">暂无染色档位，点击右上角添加</p>
      ) : (
        <div className="space-y-3">
          {list.map((项, i) => (
            <div key={`${项.type}-${项.染色图.染色尺寸标注.尺寸}-${项.染色图.svg.length}-${项.染色图.档位标注.textNodeId}`}>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">
                  染色档位 {i + 1}（{项.type}）
                </span>
                <DelBtn onClick={() => onChange(list.filter((_, j) => j !== i))} />
              </div>

              <DyeLevelEditor
                value={项}
                全部档位名={normalizedNames}
                已占用档位={list
                  .filter((_, j) => j !== i)
                  .flatMap((d) => d.染色图.档位标注.档位列表)}
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
