/**
 * FileDetailPage — 假发成品稿详情页
 *
 * 展示三个子文档：制品规格书 / 高针指示单 / 手织指示单
 * 每个子文档单独是一个 Tab，点击 Tab 切换区块。
 *
 * 架构说明：
 *   - 数据请求：useApi 负责加载状态
 *   - Tab 组件：本地 state 控制，不依赖路由，轻量
 *   - 子区块：单独拆成 <规格书Detail> 等小组件，方便单独修改
 *
 * 如何改？
 *   - 增加 Tab：在 TABS 数组加一项，在 renderTab() 加对应条件
 *   - 修改某个区块布局：在对应小组件里改，不影响其他 Tab
 */
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { callApi } from "../../api/callApi";
import PageShell from "../../components/PageShell";
import StatusView from "../../components/StatusView";
import { useApi } from "../../hooks/useApi";
import DocumentTabs from "../../modules/fileDraft/DocumentTabs";
import FileDraftDataSections from "../../modules/fileDraft/FileDraftDataSections";
import { fromDbToFileDraftViewModel } from "../../shared/fileDraft/adapters/fromDbToFileDraftViewModel";
import type { FileDraftViewModel } from "../../shared/fileDraft/model";
import type { 沐茵丝假发成品稿Frontend } from "../../shared/frontend/model/model";
import type { 沐茵丝假发成品稿 } from "../../shared/db/Db沐茵丝假发成品稿";
import 高针指示单View from "./sections/高针指示单View";
import 手织指示单View from "./sections/手织指示单View";

const TABS = [
  { key: "制品规格书", label: "制品规格书" },
  { key: "高针指示单", label: "高针指示单" },
  { key: "手织指示单", label: "手织指示单" },
] as const;

type TabKey = (typeof TABS)[number]["key"];
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
  const [tab, setTab] = useState<TabKey>("制品规格书");
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
        {file && (
          <>
            <DocumentTabs items={TABS} activeKey={tab} onChange={setTab} />

            {tab === "制品规格书" && rawFile ? (
              <FileDraftDataSections
                mode="readonly"
                value={rawFile}
                制品规格书详情={file.制品规格书}
                hatMakingList={hatMakingList}
              />
            ) : null}
            {tab === "高针指示单" && <高针指示单View data={file.高针指示单} />}
            {tab === "手织指示单" && <手织指示单View data={file.手织指示单} />}
          </>
        )}
      </StatusView>
    </PageShell>
  );
}
