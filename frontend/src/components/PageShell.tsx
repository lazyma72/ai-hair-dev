/**
 * PageShell — 页面外壳
 *
 * 提供标题行（含可选返回按钮）+ 子内容区域。
 * 所有 page 用这个包裹，确保间距和标题风格统一。
 *
 * 怎么改？
 *   - 改标题样式：修改 h1 的 className
 *   - 加操作按钮：通过 actions prop 传 <button> 节点
 */
type Props = {
  title: string;
  onBack?: () => void;
  actions?: React.ReactNode;
  children: React.ReactNode;
};

export default function PageShell({ title, onBack, actions, children }: Props) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              className="text-sm text-slate-500 hover:text-slate-900"
              onClick={onBack}
            >
              ←
            </button>
          )}
          <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
}
