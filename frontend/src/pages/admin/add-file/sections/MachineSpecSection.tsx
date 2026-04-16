import { ExcelStyleMachineTable } from "../../../../modules/fileDraft/ExcelStyleSpecTables";
import type { 制品规格书 } from "../../../../shared/db/Db沐茵丝假发成品稿";
import { 假发类型 } from "../../../../shared/db/Db沐茵丝假发成品稿";
import { AddBtn, DelBtn, Section } from "../components/ui";
import MachineLevelEditor from "../components/MachineLevelEditor";
import { empty机器档位 } from "../defaults";

type Props = {
  list: 制品规格书["机器规格清单"];
  onChange: (v: 制品规格书["机器规格清单"]) => void;
  假发类型: 假发类型;
  error?: string;
  clearError?: () => void;
};

export default function MachineSpecSection({
  list,
  onChange,
  假发类型,
  error,
  clearError,
}: Props) {
  return (
    <Section
      title="机器规格清单"
      error={error}
      action={
        <AddBtn
          onClick={() => {
            clearError?.();
            onChange([
              ...list,
              {
                ...empty机器档位(),
                档位: String(list.length + 1),
              },
            ]);
          }}
        />
      }
    >
      {list.length === 0 ? (
        <p className="text-xs text-slate-400">暂无档位</p>
      ) : (
        <div className="space-y-3">
          <div>
            <div className="mb-2 text-xs font-medium text-slate-500">
              当前预览
            </div>
            <ExcelStyleMachineTable rows={list} />
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="mb-3 text-xs font-medium text-slate-500">
              编辑明细
            </div>
          {list.map((档位, i) => (
            <div key={档位.档位}>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">
                  档位 {i + 1}
                </span>
                <DelBtn onClick={() => onChange(list.filter((_, j) => j !== i))} />
              </div>
              <MachineLevelEditor
                value={档位}
                假发类型={假发类型}
                onChange={(v) => {
                  clearError?.();
                  const next = [...list];
                  next[i] = v;
                  onChange(next);
                }}
              />
            </div>
          ))}
          </div>
        </div>
      )}
    </Section>
  );
}
