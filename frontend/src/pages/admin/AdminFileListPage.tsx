import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { callApi } from "../../api/callApi";
import PageShell from "../../components/PageShell";
import PaginationBar from "../../components/PaginationBar";
import StatusView from "../../components/StatusView";
import { useApi } from "../../hooks/useApi";
import type { 沐茵丝假发成品稿ListItem } from "../../shared/frontend/model/model";

export default function AdminFileListPage() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [pageNum, setPageNum] = useState(1);
  const pageSize = 12;

  const { data, loading, error, reload } = useApi(() =>
    callApi("admin/file/GetList", {
      keyword: keyword.trim() || undefined,
      pageNum,
      pageSize,
      orderSort: "desc",
    }),
  );

  useEffect(() => {
    void reload();
  }, [keyword, pageNum, reload]);

  const list = useMemo<沐茵丝假发成品稿ListItem[]>(
    () => data?.list ?? [],
    [data],
  );
  const total = data?.total ?? 0;

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
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <label className="mb-1 block text-xs font-medium text-slate-700">
          搜索
        </label>
        <input
          type="text"
          className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
          placeholder="支持：样品编号 / 客户编号 / 品名 / 原材料 / CAP"
          value={keyword}
          onChange={(e) => {
            setKeyword(e.target.value);
            setPageNum(1);
          }}
        />
      </div>

      <StatusView
        loading={loading}
        error={error}
        empty={list.length === 0}
        emptyText="暂无成品稿"
      >
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((item) => (
              <div
                key={item._id}
                className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:shadow-md"
              >
                <div className="text-sm font-semibold text-slate-900">
                  {item._id}
                </div>
                <div className="mt-1 text-xs text-slate-500">{item.客户编号}</div>
                <div className="mt-0.5 text-xs text-slate-400">{item.品名}</div>
                <div className="mt-4 flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
                    onClick={() => navigate(`/file/${item._id}`)}
                  >
                    查看详情
                  </button>
                </div>
              </div>
            ))}
          </div>
          <PaginationBar
            total={total}
            pageNum={pageNum}
            pageSize={pageSize}
            pageSizeOptions={[12]}
            onPageNumChange={setPageNum}
          />
        </div>
      </StatusView>
    </PageShell>
  );
}
