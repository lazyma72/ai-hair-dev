/**
 * 高针指示单View — 高针指示单的展示区块
 */
import HighNeedleBlock from "../../../modules/fileDraft/HighNeedleBlock";
import type { 高针指示单 } from "../../../shared/db/Db沐茵丝假发成品稿";
import type { 高针指示单Frontend } from "../../../shared/frontend/model/model";

type Props = { data: 高针指示单Frontend };

export default function 高针指示单View({ data }: Props) {
  const value: 高针指示单 = {
    注意事项: data.注意事项,
    高针图: data.高针图数据,
  };
  return (
    <HighNeedleBlock mode="readonly" value={value} previewData={data} />
  );
}
