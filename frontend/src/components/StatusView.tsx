/**
 * StatusView — 统一展示 loading / error / 空数据 三种状态
 *
 * 所有页面数据加载区域用这个，避免每个页面重复写 if(loading) / if(error)。
 *
 * 用法：
 *   <StatusView loading={loading} error={error}>
 *     <实际内容 />
 *   </StatusView>
 */
type Props = {
  loading: boolean;
  error: string;
  empty?: boolean;
  emptyText?: string;
  children: React.ReactNode;
};

export default function StatusView({
  loading,
  error,
  empty,
  emptyText,
  children,
}: Props) {
  if (loading) {
    return (
      <div className="py-10 text-center text-sm text-slate-400">加载中…</div>
    );
  }
  if (error) {
    return (
      <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
        {error}
      </div>
    );
  }
  if (empty) {
    return (
      <div className="py-10 text-center text-sm text-slate-400">
        {emptyText ?? "暂无数据"}
      </div>
    );
  }
  return <>{children}</>;
}
