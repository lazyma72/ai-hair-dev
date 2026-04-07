/**
 * RatioListPage — 胶丝比例列表页
 *
 * 展示所有颜色编号的列表，点击进入详情。
 *
 * 如何改？
 *   - 增加搜索：在 filteredList 做字符串 filter
 *   - 改表格列：修改 columns 数组
 */
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { callApi } from "../../api/callApi";
import { type Column } from "../../components/DataTable";
import DataTable from "../../components/DataTable";
import PageShell from "../../components/PageShell";
import StatusView from "../../components/StatusView";
import { useApi } from "../../hooks/useApi";
import type { 胶丝比例ListItem } from "../../shared/frontend/model/model";

export default function RatioListPage() {
  const navigate = useNavigate();

  const { data, loading, error } = useApi(() =>
    callApi("admin/ratio/GetList", {}),
  );

  const list: 胶丝比例ListItem[] = data?.list ?? [];

  const columns: Column<胶丝比例ListItem>[] = [
    {
      key: "_id",
      title: "颜色编号",
      render: (r) => (
        <span className="font-mono font-medium text-slate-900">{r._id}</span>
      ),
    },
    {
      key: "线色",
      title: "线色",
      render: (r) => r.线色 ?? <span className="text-slate-300">—</span>,
    },
    {
      key: "action",
      title: "",
      width: "80px",
      render: (r) => (
        <button
          type="button"
          className="rounded bg-slate-100 px-3 py-1 text-xs text-slate-700 hover:bg-slate-200"
          onClick={() => navigate(`/ratio/${r._id}`)}
        >
          查看
        </button>
      ),
    },
  ];

  return (
    <PageShell title="胶丝比例">
      <StatusView
        loading={loading}
        error={error}
        empty={list.length === 0}
        emptyText="暂无胶丝比例数据"
      >
        <DataTable columns={columns} rows={list} rowKey={(r) => r._id} />
      </StatusView>
    </PageShell>
  );
}
