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
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { callApi } from "../../api/callApi";
import PageShell from "../../components/PageShell";
import StatusView from "../../components/StatusView";
import { useApi } from "../../hooks/useApi";
import type { 沐茵丝假发成品稿Frontend } from "../../shared/frontend/model/model";
import 规格书View from "./sections/规格书View";
import 高针指示单View from "./sections/高针指示单View";
import 手织指示单View from "./sections/手织指示单View";

const TABS = [
  { key: "规格书", label: "制品规格书" },
  { key: "高针指示单", label: "高针指示单" },
  { key: "手织指示单", label: "手织指示单" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function FileDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>("规格书");

  const { data, loading, error } = useApi(() =>
    callApi("file/GetDetail", { id: id! }),
  );

  const file: 沐茵丝假发成品稿Frontend | null = data?.file ?? null;

  return (
    <PageShell
      title={file ? `${file.制品规格书.title.品名}` : "成品稿详情"}
      onBack={() => navigate(-1)}
    >
      <StatusView loading={loading} error={error}>
        {file && (
          <>
            {/* ID 行 */}
            <div className="font-mono text-[11px] text-slate-400">
              ID: {file._id}
            </div>

            {/* Tab 切换栏 */}
            <div className="flex gap-2">
              {TABS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  className={
                    key === tab
                      ? "rounded bg-slate-900 px-3 py-1.5 text-sm text-white"
                      : "rounded bg-white px-3 py-1.5 text-sm text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                  }
                  onClick={() => setTab(key)}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Tab 内容 */}
            {tab === "规格书" && <规格书View data={file.制品规格书} />}
            {tab === "高针指示单" && <高针指示单View data={file.高针指示单} />}
            {tab === "手织指示单" && <手织指示单View data={file.手织指示单} />}
          </>
        )}
      </StatusView>
    </PageShell>
  );
}
