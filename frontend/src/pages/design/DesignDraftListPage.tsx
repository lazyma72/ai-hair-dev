import { message } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { callApi } from "../../api/callApi";
import Badge from "../../components/Badge";
import PageShell from "../../components/PageShell";
import PaginationBar from "../../components/PaginationBar";
import StatusView from "../../components/StatusView";
import { useApi } from "../../hooks/useApi";
import type { 沐茵丝假发成品稿ListItem } from "../../shared/frontend/model/model";

export default function DesignDraftListPage() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [deleting, setDeleting] = useState<string | null>(null);

  const { data, loading, error, reload } = useApi(() =>
    callApi("admin/file/GetList", {
      pageNum: 1,
      pageSize: 1000,
      orderSort: "desc",
    }),
  );
  const list = useMemo<沐茵丝假发成品稿ListItem[]>(() => data?.list ?? [], [data]);

  const filteredList = useMemo(() => {
    const kw = keyword.trim();
    return list.filter((x) =>
      !kw
        ? true
        : `${x.样品编号} ${x._id} ${x.客户编号} ${x.品名} ${x.CAP} ${x.颜色编号 ?? ""} ${x.发丝种类 ?? ""}`
            .toLowerCase()
            .includes(kw.toLowerCase()),
    );
  }, [keyword, list]);

  const total = filteredList.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pagedList = useMemo(() => {
    const start = (pageNum - 1) * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, pageNum, pageSize]);

  useEffect(() => {
    if (pageNum > totalPages) {
      setPageNum(totalPages);
    }
  }, [pageNum, totalPages]);

  async function handleDelete(id: string) {
    if (!window.confirm(`确认删除「${id}」？此操作不可恢复。`)) return;
    setDeleting(id);
    try {
      const res = await callApi("admin/file/Delete", { id });
      if (res) {
        message.success("已删除");
        reload();
      }
    } catch {
      message.error("删除失败");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <PageShell
      title="产品规格系统 · 成品稿管理"
      actions={
        <button
          type="button"
          className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
          onClick={() => navigate("/designs/create")}
        >
          + 新建产品规格稿
        </button>
      }
    >
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="w-80">
            <label className="mb-1 block text-xs font-medium text-slate-700">
              搜索
            </label>
            <input
              type="text"
              className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
              placeholder="支持：ID / 客户编号 / 品名 / CAP"
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setPageNum(1);
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded bg-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200"
              onClick={reload}
            >
              刷新
            </button>
          </div>
        </div>
      </div>

      <StatusView
        loading={loading}
        error={error}
        empty={filteredList.length === 0}
        emptyText="暂无设计稿"
      >
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pagedList.map((item) => (
              <div
                key={item._id}
                className="rounded-2xl border border-slate-200 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      样品编号：{item.样品编号}
                    </div>
                    <div className="mt-1 space-y-0.5 text-xs text-slate-500">
                      <div>假发类型：{item.假发类型}</div>
                      <div>品名：{item.品名}</div>
                      <div>原材料：{item.原材料 || "—"}</div>
                      <div>颜色编号：{item.颜色编号 || "—"}</div>
                      <div>发丝种类：{item.发丝种类 || "—"}</div>
                    </div>
                  </div>
                  <Badge>{item.客户编号}</Badge>
                </div>

                <div className="mt-3 text-[11px] text-slate-400">
                  CAP: {item.CAP}
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
                    onClick={() => navigate(`/file/${item._id}`)}
                  >
                    查看详情
                  </button>
                  <button
                    type="button"
                    className="rounded bg-rose-50 px-3 py-1.5 text-xs text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                    disabled={deleting === item._id}
                    onClick={() => handleDelete(item._id)}
                  >
                    {deleting === item._id ? "删除中…" : "删除"}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <PaginationBar
            total={total}
            pageNum={pageNum}
            pageSize={pageSize}
            onPageNumChange={setPageNum}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPageNum(1);
            }}
          />
        </div>
      </StatusView>
    </PageShell>
  );
}
