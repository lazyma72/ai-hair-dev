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
