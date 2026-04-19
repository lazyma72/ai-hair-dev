/**
 * Section — 带标题的白色卡片区块
 *
 * 在详情页中用来分隔"基本信息"、"工程重量"等各区块。
 *
 * 用法：
 *   <Section title="基本信息">...</Section>
 */
type Props = {
  title: string;
  children: React.ReactNode;
  className?: string;
  compact?: boolean;
};

export default function Section({ title, children, className, compact = false }: Props) {
  return (
    <section
      className={`overflow-hidden rounded-xl bg-white ring-1 ring-slate-200 ${className ?? ""}`}
    >
      <div
        className={`border-b border-slate-100 bg-slate-50 ${
          compact ? "px-3 py-2" : "px-5 py-3"
        }`}
      >
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      </div>
      {children}
    </section>
  );
}
