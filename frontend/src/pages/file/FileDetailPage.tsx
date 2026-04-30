/**
 * FileDetailPage — 假发成品稿详情页
 *
 * 展示三个子文档：制品规格书 / 高针指示单 / 手织指示单
 * 三个区块按页面顺序直接展示，不再通过 Tab 切换。
 *
 * 架构说明：
 *   - 数据请求：useApi 负责加载状态
 *   - 子区块：单独拆成展示组件，方便单独修改
 */
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { callApi } from "../../api/callApi";
import PageShell from "../../components/PageShell";
import StatusView from "../../components/StatusView";
import { useApi } from "../../hooks/useApi";
import FileDraftDocumentSections from "../../modules/fileDraft/FileDraftDocumentSections";
import { fromDbToFileDraftViewModel } from "../../shared/fileDraft/adapters/fromDbToFileDraftViewModel";
import type { FileDraftViewModel } from "../../shared/fileDraft/model";
import type { 沐茵丝假发成品稿Frontend } from "../../shared/frontend/model/model";
import type { 沐茵丝假发成品稿 } from "../../shared/db/Db沐茵丝假发成品稿";
type HatMakingOption = {
  _id: string;
  名称?: string;
  帽围: number;
  帽深: number;
  前后: number;
};

export default function FileDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [hatMakingList, setHatMakingList] = useState<HatMakingOption[]>([]);

  const { data, loading, error } = useApi(() =>
    callApi("admin/file/GetDetail", { id: id! }),
  );

  const file: 沐茵丝假发成品稿Frontend | null = data?.file ?? null;
  const rawDbFile =
    ((data as { rawFile?: 沐茵丝假发成品稿 } | undefined)?.rawFile as
      | 沐茵丝假发成品稿
      | undefined) ?? null;
  const rawFile: FileDraftViewModel | null = rawDbFile
    ? fromDbToFileDraftViewModel(rawDbFile)
    : null;
  const pageTitle = file
    ? file.制品规格书.title.样品编号 ||
      file.制品规格书.title.品名 ||
      "成品稿详情"
    : "成品稿详情";

  useEffect(() => {
    callApi(
      "admin/hatMaking/GetList" as never,
      {
        pageNum: 1,
        pageSize: 1000,
        orderSort: "asc",
      } as never,
    ).then((r) => {
      const res = r as
        | { isSucc: true; res: { list: HatMakingOption[] } }
        | { isSucc: false };
      if (res.isSucc) setHatMakingList(res.res.list);
    });
  }, []);

  return (
    <PageShell
      title={pageTitle}
      onBack={() => navigate(-1)}
      actions={
        id ? (
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={() => navigate(`/file/${id}/print`)}
            >
              🖨 打印规格书
            </button>
            <button
              type="button"
              className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
              onClick={() => navigate(`/designs/${id}/edit`)}
            >
              编辑稿件
            </button>
          </div>
        ) : undefined
      }
    >
      <StatusView loading={loading} error={error}>
        {file && rawFile ? (
          <FileDraftDocumentSections
            mode="readonly"
            value={rawFile}
            制品规格书详情={file.制品规格书}
            hatMakingList={hatMakingList}
            高针数据={file.高针指示单}
            手织数据={file.手织指示单}
          />
        ) : null}
      </StatusView>
    </PageShell>
  );
}
