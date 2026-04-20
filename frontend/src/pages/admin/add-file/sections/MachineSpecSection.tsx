import { EditableExcelStyleMachineTable } from "../../../../modules/fileDraft/ExcelStyleSpecTables";
import type { 制品规格书 } from "../../../../shared/db/Db沐茵丝假发成品稿";
import { 假发类型 } from "../../../../shared/db/Db沐茵丝假发成品稿";
import { Section } from "../components/ui";
import { empty机器档位 } from "../defaults";

type Props = {
  list: 制品规格书["机器规格清单"];
  onChange: (v: 制品规格书["机器规格清单"]) => void;
  假发类型: 假发类型;
  hasGlobalM?: boolean;
  hasGlobalL?: boolean;
  error?: string;
  clearError?: () => void;
};

export default function MachineSpecSection({
  list,
  onChange,
  假发类型,
  hasGlobalM = false,
  hasGlobalL = false,
  error,
  clearError,
}: Props) {
  return (
    <Section title="机器规格清单" error={error}>
      <EditableExcelStyleMachineTable
        rows={list}
        假发类型={假发类型}
        hasGlobalM={hasGlobalM}
        hasGlobalL={hasGlobalL}
        onChange={(next) => {
          clearError?.();
          onChange(next);
        }}
        onInsertRowAfter={(rowIndex) => {
          const next = [...list];
          next.splice(rowIndex + 1, 0, {
            ...empty机器档位(),
            档位: String(rowIndex + 2),
            双针: {
              ...empty机器档位().双针,
              尺数: {
                D: 0,
                ...(hasGlobalM ? { M: 0 } : {}),
                ...(hasGlobalL ? { L: 0 } : {}),
              },
            },
          });
          clearError?.();
          onChange(
            next.map((item, index) => ({
              ...item,
              档位: String(index + 1),
            })),
          );
        }}
      />
    </Section>
  );
}
