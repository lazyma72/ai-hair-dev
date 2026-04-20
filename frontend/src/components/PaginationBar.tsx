type Props = {
  total: number;
  pageNum: number;
  pageSize: number;
  pageSizeOptions?: number[];
  onPageNumChange: (pageNum: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
};

export default function PaginationBar({
  total,
  pageNum,
  pageSize,
  pageSizeOptions = [10, 20, 50],
  onPageNumChange,
  onPageSizeChange,
}: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const showPageSize = pageSizeOptions.length > 1 && Boolean(onPageSizeChange);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
      <span>
        共 {total} 条，第 {pageNum} / {totalPages} 页
      </span>

      <div className="flex flex-wrap items-center gap-2">
        {showPageSize ? (
          <label className="flex items-center gap-2">
            <span>每页</span>
            <select
              className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
              value={pageSize}
              onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span>条</span>
          </label>
        ) : null}

        <button
          type="button"
          disabled={pageNum <= 1}
          className="rounded bg-slate-100 px-3 py-1.5 disabled:opacity-50"
          onClick={() => onPageNumChange(Math.max(1, pageNum - 1))}
        >
          上一页
        </button>
        <button
          type="button"
          disabled={pageNum >= totalPages}
          className="rounded bg-slate-100 px-3 py-1.5 disabled:opacity-50"
          onClick={() => onPageNumChange(Math.min(totalPages, pageNum + 1))}
        >
          下一页
        </button>
      </div>
    </div>
  );
}
