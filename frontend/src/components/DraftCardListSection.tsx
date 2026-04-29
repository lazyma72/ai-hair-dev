import type { ReactNode } from "react";
import Badge from "./Badge";
import StatusView from "./StatusView";
import type { 沐茵丝假发成品稿ListItem } from "../shared/frontend/model/model";

export function filterDraftList(
  list: 沐茵丝假发成品稿ListItem[],
  keyword: string,
) {
  const kw = keyword.trim().toLowerCase();
  if (!kw) return list;
  return list.filter((item) =>
    `${item.样品编号} ${item._id} ${item.客户编号} ${item.品名} ${item.CAP} ${item.颜色编号 ?? ""} ${item.发丝种类 ?? ""} ${item.假发类型}`
      .toLowerCase()
      .includes(kw),
  );
}

export function DraftCard({
  item,
  selected = false,
  onClick,
  badgeText,
  footer,
  actions,
}: {
  item: 沐茵丝假发成品稿ListItem;
  selected?: boolean;
  onClick?: () => void;
  badgeText?: string;
  footer?: ReactNode;
  actions?: ReactNode;
}) {
  const tagVariant = item.tag === "草稿" ? "blue" : "green";
  const hairTypeClass =
    item.假发类型 === "间色"
      ? "border border-violet-200 bg-violet-50 text-violet-700"
      : item.假发类型 === "上下分"
        ? "border border-amber-200 bg-amber-50 text-amber-700"
        : item.假发类型 === "T色"
          ? "border border-sky-200 bg-sky-50 text-sky-700"
          : "border border-slate-200 bg-slate-50 text-slate-700";
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">
            样品编号：{item.样品编号}
          </div>
          <div className="mt-1 space-y-0.5 text-xs text-slate-500">
            <div>品名：{item.品名}</div>
            <div>原材料：{item.原材料 || "—"}</div>
            <div>颜色编号：{item.颜色编号 || "—"}</div>
            <div>发丝种类：{item.发丝种类 || "—"}</div>
            {item.规则摘要 && item.规则摘要.length > 0 ? (
              <div className="mt-1 space-y-0.5">
                {item.规则摘要.slice(0, 4).map((line: string) => (
                  <div key={line} className="text-xs text-slate-500">
                    {line}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-semibold ${hairTypeClass}`}>
            {item.假发类型}
          </span>
          {badgeText ? (
            <Badge variant={selected ? "blue" : "default"}>{badgeText}</Badge>
          ) : null}
        </div>
      </div>

      <div className="mt-auto flex items-end justify-between gap-3 pt-3">
        <div className="text-[11px] text-slate-400">CAP: {item.CAP}</div>
        <Badge variant={tagVariant}>{item.tag ?? "成品稿"}</Badge>
      </div>

      {footer ? <div className="mt-3">{footer}</div> : null}
      {actions ? <div className="mt-4 flex items-center gap-2">{actions}</div> : null}
    </>
  );

  const className = `flex h-full w-full flex-col rounded-2xl border bg-white p-4 text-left transition ${
    selected
      ? "border-slate-900 ring-2 ring-slate-900/10"
      : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
  }`;

  if (!onClick) {
    return <div className={className}>{content}</div>;
  }

  return (
    <button type="button" className={className} onClick={onClick}>
      {content}
    </button>
  );
}

export default function DraftCardListSection({
  title,
  description,
  list,
  keyword,
  onKeywordChange,
  loading,
  error,
  emptyText,
  summaryText,
  renderCard,
  searchPlaceholder = "支持：样品编号 / 客户编号 / 品名 / CAP / 颜色编号 / 发丝种类",
}: {
  title?: string;
  description?: string;
  list: 沐茵丝假发成品稿ListItem[];
  keyword: string;
  onKeywordChange: (value: string) => void;
  loading: boolean;
  error: string;
  emptyText: string;
  summaryText?: string;
  renderCard: (item: 沐茵丝假发成品稿ListItem) => ReactNode;
  searchPlaceholder?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      {title ? <div className="text-sm font-semibold text-slate-900">{title}</div> : null}
      {description ? (
        <div className="mt-1 text-xs text-slate-500">{description}</div>
      ) : null}
      <div className="mt-3">
        <input
          type="text"
          className="w-full rounded border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
          placeholder={searchPlaceholder}
          value={keyword}
          onChange={(e) => onKeywordChange(e.target.value)}
        />
      </div>
      {summaryText ? <div className="mt-3 text-xs text-slate-400">{summaryText}</div> : null}
      <div className="mt-4">
        <StatusView
          loading={loading}
          error={error}
          empty={list.length === 0}
          emptyText={emptyText}
        >
          <div className="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
            {list.map((item) => (
              <div key={item._id} className="h-full">
                {renderCard(item)}
              </div>
            ))}
          </div>
        </StatusView>
      </div>
    </div>
  );
}
