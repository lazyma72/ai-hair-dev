import type { 手织指示单 } from "../../../../shared/db/Db沐茵丝假发成品稿";
import type { 手织指示单Frontend } from "../../../../shared/frontend/model/model";
import HandWovenBlock from "../../../../modules/fileDraft/HandWovenBlock";

type Props = {
  value: 手织指示单;
  onChange: (v: 手织指示单) => void;
  showSvg?: boolean;
  previewData?: 手织指示单Frontend | null;
};

export default function HandWovenSection({
  value,
  onChange,
  showSvg = true,
  previewData,
}: Props) {
  return (
    <HandWovenBlock
      mode="edit"
      value={value}
      onChange={onChange}
      showSvg={showSvg}
      previewData={previewData}
    />
  );
}
