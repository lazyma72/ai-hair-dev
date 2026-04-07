/**
 * Badge — 小标签徽章
 *
 * 用于展示类型、状态等标记文字。
 *
 * variant:
 *   - default: 灰色（默认）
 *   - blue: 蓝色
 *   - green: 绿色
 */
type Variant = "default" | "blue" | "green";

const variantClass: Record<Variant, string> = {
  default: "bg-slate-100 text-slate-700",
  blue: "bg-blue-50 text-blue-700",
  green: "bg-emerald-50 text-emerald-700",
};

type Props = {
  children: React.ReactNode;
  variant?: Variant;
};

export default function Badge({ children, variant = "default" }: Props) {
  return (
    <span
      className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${variantClass[variant]}`}
    >
      {children}
    </span>
  );
}
