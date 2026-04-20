import { EditableExcelStyleManualTable } from "../../../../modules/fileDraft/ExcelStyleSpecTables";
import type { 制品规格书 } from "../../../../shared/db/Db沐茵丝假发成品稿";
import { 假发类型 } from "../../../../shared/db/Db沐茵丝假发成品稿";
import { Section } from "../components/ui";
import { empty人工档位 } from "../defaults";

type 人工档位 = 制品规格书["人工规格清单"][number];

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
