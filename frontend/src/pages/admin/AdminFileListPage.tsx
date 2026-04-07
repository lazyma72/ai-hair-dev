import * as React from "react";
import { useNavigate } from "react-router-dom";
import { callApi } from "../../api/callApi";
import PageShell from "../../components/PageShell";
import StatusView from "../../components/StatusView";
import { useApi } from "../../hooks/useApi";

export default function AdminFileListPage() {
  const navigate = useNavigate();

  const { data, loading, error } = useApi(() => callApi("file/GetList", {}));

  const list = data?.list ?? [];

  return (
    <PageShell
      title="成品稿管理"
      actions={
        <button
          type="button"
          className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
          onClick={() => navigate("/admin/add")}
        >
          + 添加成品稿
        </button>
      }
    >
      <StatusView
        loading={loading}
        error={error}
        empty={list.length === 0}
        emptyText="暂无成品稿"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((item) => (
            <button
              key={item._id}
              type="button"
              className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:shadow-md"
              onClick={() => navigate(`/file/${item._id}`)}
            >
              <div className="text-sm font-semibold text-slate-900">
                {item._id}
              </div>
              <div className="mt-1 text-xs text-slate-500">{item.客户编号}</div>
              <div className="mt-0.5 text-xs text-slate-400">{item.品名}</div>
            </button>
          ))}
        </div>
      </StatusView>
    </PageShell>
  );
}
