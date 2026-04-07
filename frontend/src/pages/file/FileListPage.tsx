/**
 * FileListPage — 假发成品稿列表页
 *
 * 架构说明：
 *   - 数据请求：useApi hook（只管加载状态）
 *   - 接口调用：callApi（统一封装，换接口只改这里）
 *   - UI 状态：loading / error / 列表展示 由 StatusView 统一处理
 *
 * 如何改？
 *   - 增加搜索/筛选：在 list 上做 filter，不需要改接口
 *   - 增加列：在 columns 数组里加一项
 *   - 改卡片样式：修改 card 区块内的 className
 */
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { callApi } from "../../api/callApi";
import Badge from "../../components/Badge";
import PageShell from "../../components/PageShell";
import StatusView from "../../components/StatusView";
import { useApi } from "../../hooks/useApi";
import type { 沐茵丝假发成品稿ListItem } from "../../shared/frontend/model/model";

export default function FileListPage() {
  const navigate = useNavigate();

  const { data, loading, error } = useApi(() => callApi("file/GetList", {}));

  const list: 沐茵丝假发成品稿ListItem[] = data?.list ?? [];

  return (
    <PageShell title="假发成品稿">
      <StatusView
        loading={loading}
        error={error}
        empty={list.length === 0}
        emptyText="暂无成品稿"
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {list.map((item) => (
            <button
              key={item._id}
              type="button"
              className="block rounded-xl bg-white p-4 text-left ring-1 ring-slate-200 transition hover:ring-slate-400"
              onClick={() => navigate(`/file/${item._id}`)}
            >
              {/* 标题行 */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    {item.品名}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    {item.客户编号}
                  </div>
                </div>
                <Badge>{item.假发类型}</Badge>
              </div>
              {/* 补充信息 */}
              <div className="mt-2 text-xs text-slate-400">CAP: {item.CAP}</div>
              <div className="mt-1 font-mono text-[10px] text-slate-300">
                {item._id}
              </div>
            </button>
          ))}
        </div>
      </StatusView>
    </PageShell>
  );
}
