/**
 * 手织指示单View — 手织指示单的展示区块
 */
import HandWovenBlock from "../../../modules/fileDraft/HandWovenBlock";
import type { 手织指示单 } from "../../../shared/db/Db沐茵丝假发成品稿";
import type { 手织指示单Frontend } from "../../../shared/frontend/model/model";

type Props = { data: 手织指示单Frontend };

export default function 手织指示单View({ data }: Props) {
  const value: 手织指示单 = {
    注意事项: "",
    手织图: { svg: data.手织图片 },
  };
  return (
    <HandWovenBlock mode="readonly" value={value} previewData={data} />
  );
}
