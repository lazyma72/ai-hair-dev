import { message } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { callApi } from "../../api/callApi";
import DraftCardListSection, {
  DraftCard,
  filterDraftList,
} from "../../components/DraftCardListSection";
import PageShell from "../../components/PageShell";
import PaginationBar from "../../components/PaginationBar";
import { useApi } from "../../hooks/useApi";
import type { 沐茵丝假发成品稿ListItem } from "../../shared/frontend/model/model";
import type {
  ReqGetList,
  ResGetList,
} from "../../shared/protocols/admin/file/PtlGetList";

function fetchFileList(req: ReqGetList) {
  return callApi("admin/file/GetList" as never, req as never) as Promise<
    | { isSucc: true; res: ResGetList }
    | { isSucc: false; err: { message: string } }
  >;
}

export default function DesignDraftListPage() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState("");
  const [tagFilter, setTagFilter] = useState<"全部" | "成品稿" | "草稿">("全部");
  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [deleting, setDeleting] = useState<string | null>(null);
  const requestFilter =
    tagFilter === "全部"
      ? undefined
      : ({ tag: tagFilter } as unknown as ReqGetList["filter"]);

  const { data, loading, error, reload } = useApi(() =>
    fetchFileList({
      pageNum: 1,
      pageSize: 1000,
      orderSort: "desc",
      filter: requestFilter,
    }),
  );
  const list = useMemo<沐茵丝假发成品稿ListItem[]>(() => data?.list ?? [], [data]);

  const filteredList = useMemo(() => filterDraftList(list, keyword), [keyword, list]);

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

  useEffect(() => {
    // filter change -> refresh list + reset pagination
    setPageNum(1);
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tagFilter]);

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
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded border border-slate-200 bg-white p-0.5">
            {(["全部", "成品稿", "草稿"] as const).map((v) => (
              <button
                key={v}
                type="button"
                className={`rounded px-2.5 py-1 text-xs font-medium ${
                  tagFilter === v
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
                onClick={() => setTagFilter(v)}
              >
                {v}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
            onClick={() => navigate("/designs/create")}
          >
            + 新建产品规格稿
          </button>
        </div>
      }
    >
      <DraftCardListSection
        list={pagedList}
        keyword={keyword}
        onKeywordChange={(value) => {
          setKeyword(value);
          setPageNum(1);
        }}
        loading={loading}
        error={error}
        emptyText="暂无设计稿"
        summaryText={`共 ${total} 条，当前第 ${pageNum} 页`}
        renderCard={(item) => (
          <DraftCard
            item={item}
            actions={
              <>
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
              </>
            }
          />
        )}
      />
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-end">
          <button
            type="button"
            className="rounded bg-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200"
            onClick={reload}
          >
            刷新
          </button>
        </div>
        <div className="space-y-4">
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
      </div>
    </PageShell>
  );
}
