import type { 高针指示单 } from "../../../../shared/db/Db沐茵丝假发成品稿";
import type { 高针指示单Frontend } from "../../../../shared/frontend/model/model";
import HighNeedleBlock from "../../../../modules/fileDraft/HighNeedleBlock";

type Props = {
  value: 高针指示单;
  onChange: (v: 高针指示单) => void;
  showJsonImporter?: boolean;
  previewData?: 高针指示单Frontend | null;
  hideUploader?: boolean;
};

export default function HighNeedleSection({
  value,
  onChange,
  showJsonImporter = true,
  previewData,
  hideUploader,
}: Props) {
  return (
    <HighNeedleBlock
      mode="edit"
      value={value}
      onChange={onChange}
      showJsonImporter={showJsonImporter}
      previewData={previewData}
      hideUploader={hideUploader}
    />
  );
}
