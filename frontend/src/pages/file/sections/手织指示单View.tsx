/**
 * 手织指示单View — 手织指示单的展示区块
 */
import HandWovenBlock from "../../../modules/fileDraft/HandWovenBlock";
import type { 手织指示单 } from "../../../shared/db/Db沐茵丝假发成品稿";

type Props = { value: 手织指示单 };

export default function 手织指示单View({ value }: Props) {
  return <HandWovenBlock mode="readonly" value={value} />;
}
