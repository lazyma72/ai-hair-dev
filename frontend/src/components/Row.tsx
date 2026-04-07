/**
 * Row — 左标签 + 右内容 的两列行
 *
 * 用在 Section 内部展示单条字段。
 *
 * 用法：
 *   <Row label="客户编号" value="XM" />
 *   <Row label="备注" value={<span className="text-red-500">...</span>} />
 */
type Props = {
  label: string;
  value: React.ReactNode;
};

export default function Row({ label, value }: Props) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-2 border-t border-slate-100 px-4 py-2 text-xs first:border-0">
      <span className="text-slate-400">{label}</span>
      <span className="break-all text-slate-900">
        {value ?? <span className="text-slate-300">—</span>}
      </span>
    </div>
  );
}
