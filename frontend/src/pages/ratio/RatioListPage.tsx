/**
 * RatioListPage — 胶丝比例列表页
 *
 * 需求改造：
 *  - 按发丝种类分标签页展示
 *  - 支持颜色编号（_id）搜索
 */
import * as React from "react";
import { useMemo, useState } from "react";
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
  const [activeType, setActiveType] = useState<string>("全部");
  const [keyword, setKeyword] = useState<string>("");

  const { data, loading, error } = useApi(() =>
    callApi("admin/ratio/GetList", {}),
  );
  const list = useMemo<胶丝比例ListItem[]>(() => data?.list ?? [], [data]);

  const types = useMemo(() => {
    const set = new Set(list.map((x) => x.发丝种类).filter(Boolean));
    return ["全部", ...Array.from(set).sort()];
  }, [list]);

  const filteredList = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return list
      .filter((x) => (activeType === "全部" ? true : x.发丝种类 === activeType))
      .filter((x) => (!kw ? true : x._id.toLowerCase().includes(kw)));
  }, [activeType, keyword, list]);

  const columns: Column<胶丝比例ListItem>[] = [
    {
      key: "_id",
      title: "颜色编号",
      render: (r) => (
        <span className="font-mono font-medium text-slate-900">{r._id}</span>
      ),
    },
    {
      key: "发丝种类",
      title: "发丝种类",
      render: (r) => r.发丝种类,
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
    <PageShell title="胶丝比例管理">
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="mb-2 text-xs font-medium text-slate-700">
              发丝种类
            </div>
            <div className="flex flex-wrap gap-2">
              {types.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={
                    t === activeType
                      ? "rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white"
                      : "rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 hover:bg-slate-200"
                  }
                  onClick={() => setActiveType(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="w-72">
            <label className="mb-1 block text-xs font-medium text-slate-700">
              颜色编号搜索
            </label>
            <input
              type="text"
              className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
              placeholder="例如：A01"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
        </div>
      </div>

      <StatusView
        loading={loading}
        error={error}
        empty={filteredList.length === 0}
        emptyText="暂无胶丝比例数据"
      >
        <DataTable columns={columns} rows={filteredList} rowKey={(r) => r._id} />
      </StatusView>
    </PageShell>
  );
}
