import { EditableExcelStyleManualTable } from "../../../../modules/fileDraft/ExcelStyleSpecTables";
import type { 制品规格书 } from "../../../../shared/db/Db沐茵丝假发成品稿";
import { Section } from "../components/ui";
import { empty人工档位 } from "../defaults";

type 人工档位 = 制品规格书["人工规格清单"][number];
type 人工双针 = 人工档位["双针"] & { 密度: number };

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

function applyManualWeights(list: 人工档位[]): 人工档位[] {
  return list.map((档位) => {
    const 双针 = 档位.双针 as 人工双针;
    const totalRows = 档位.裁断与重量.length;
    const has对裁 = 档位.整毛.对裁 !== undefined && 档位.整毛.对裁 !== null;
    return {
      ...档位,
      裁断与重量: 档位.裁断与重量.map((item, rowIndex) => {
        const weight = calcManualWeight(
          item.裁断,
          双针.密度,
          rowIndex,
          totalRows,
          has对裁,
        );
        return {
          ...item,
          重量g: {
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
  error?: string;
  clearError?: () => void;
};

export default function ManualSpecSection({
  list,
  onChange,
  error,
  clearError,
}: Props) {
  function emit(next: 人工档位[]) {
    clearError?.();
    onChange(applyManualWeights(next));
  }

  return (
    <Section title="人工规格清单" error={error}>
      <EditableExcelStyleManualTable
        rows={list}
        onChange={emit}
        onInsertRowAfter={(rowIndex) => {
          const next = [...list]
          next.splice(rowIndex + 1, 0, {
            ...empty人工档位(),
            档位: `H${rowIndex + 2}`,
          })
          emit(
            next.map((item, index) => ({
              ...item,
              档位: `H${index + 1}`,
            })),
          )
        }}
      />
    </Section>
  );
}
