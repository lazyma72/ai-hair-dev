import { EditableExcelStyleManualTable } from "../../../../modules/fileDraft/ExcelStyleSpecTables";
import type { 制品规格书 } from "../../../../shared/db/Db沐茵丝假发成品稿";
import { 假发类型 } from "../../../../shared/db/Db沐茵丝假发成品稿";
import { Section } from "../components/ui";
import { empty人工档位 } from "../defaults";

type 人工档位 = 制品规格书["人工规格清单"][number];
type 人工双针 = 人工档位["双针"];
type 可编辑人工档位 = 人工档位 & {
  DML比值?: {
    D: number;
    M?: number;
    L?: number;
  };
};
type DMLMode = "D:L" | "D:M" | "D:M:L";

function toOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

function getRowFactor(rowIndex: number, totalRows: number): number {
  if (totalRows <= 1) return 1;
  if (totalRows === 2) return rowIndex === 0 ? 0.4 : 0.6;
  return rowIndex < 2 ? 0.3 : 0.4;
}

function calcManualWeight(
  裁断: number,
  密度: number,
  rowIndex: number,
  totalRows: number,
  has对裁: boolean,
): number {
  let w = 裁断 * 密度 * 0.5 * getRowFactor(rowIndex, totalRows);
  if (has对裁) w /= 2;
  return w;
}

function getDMLMode(row: 可编辑人工档位): DMLMode {
  if (row.DML比值?.M != null && row.DML比值?.L != null) return "D:M:L";
  if (row.DML比值?.M != null) return "D:M";
  return "D:L";
}

function getDML比值(row: 可编辑人工档位): { D: number; M: number; L: number } {
  const mode = getDMLMode(row);
  return {
    D: toOneDecimal(row.DML比值?.D ?? 1),
    M: mode === "D:L" ? 0 : toOneDecimal(row.DML比值?.M ?? 1),
    L: mode === "D:M" ? 0 : toOneDecimal(row.DML比值?.L ?? 1),
  };
}

function applyManualWeights(
  list: 人工档位[],
  type: 假发类型,
  splitFlags?: { hasM: boolean; hasL: boolean },
): 人工档位[] {
  return list.map((档位) => {
    const current = 档位 as 可编辑人工档位;
    const 双针 = current.双针 as 人工双针;
    const totalRows = 档位.裁断与重量.length;
    const has对裁 = 档位.整毛.对裁 !== undefined && 档位.整毛.对裁 !== null;
    const 密度 = 双针.密度 ?? 0;
    const 间色比例 = getDML比值(current);
    const 比例和 = 间色比例.D + 间色比例.M + 间色比例.L;
    return {
      ...current,
      裁断与重量: 档位.裁断与重量.map((item, rowIndex) => {
        const weight = calcManualWeight(
          item.裁断,
          密度,
          rowIndex,
          totalRows,
          has对裁,
        );
        return {
          ...item,
          重量g:
            type === 假发类型.间色
              ? {
                  D: 比例和 > 0 ? (weight * 间色比例.D) / 比例和 : 0,
                  M:
                    间色比例.M > 0 && 比例和 > 0
                      ? (weight * 间色比例.M) / 比例和
                      : undefined,
                  L:
                    间色比例.L > 0 && 比例和 > 0
                      ? (weight * 间色比例.L) / 比例和
                      : undefined,
                }
              : type === 假发类型.纯色
                ? {
                    D: weight,
                  }
                : type === 假发类型.上下分
                  ? {
                      D: weight,
                      M: splitFlags?.hasM ? weight : undefined,
                      L: splitFlags?.hasL ? weight : undefined,
                    }
                  : {
                      D: weight,
                      M: weight,
                      L: weight,
                    },
        };
      }),
    };
  });
}

type Props = {
  list: 制品规格书["人工规格清单"];
  onChange: (v: 制品规格书["人工规格清单"]) => void;
  假发类型: 假发类型;
  hasGlobalM?: boolean;
  hasGlobalL?: boolean;
  error?: string;
  clearError?: () => void;
};

export default function ManualSpecSection({
  list,
  onChange,
  假发类型,
  hasGlobalM = false,
  hasGlobalL = false,
  error,
  clearError,
}: Props) {
  function emit(next: 人工档位[]) {
    clearError?.();
    onChange(next);
  }

  return (
    <Section title="人工规格清单" error={error}>
      <EditableExcelStyleManualTable
        rows={list}
        假发类型={假发类型}
        hasGlobalM={hasGlobalM}
        hasGlobalL={hasGlobalL}
        onChange={emit}
        onInsertRowAfter={(rowIndex) => {
          const next = [...list];
          next.splice(rowIndex + 1, 0, {
            ...empty人工档位(),
            档位: `H${rowIndex + 2}`,
          });
          emit(
            next.map((item, index) => ({
              ...item,
              档位: `H${index + 1}`,
            })),
          );
        }}
      />
    </Section>
  );
}
