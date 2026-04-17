/**
 * PrintSpecPage — 制品规格书 A4 打印预览页
 *
 * 功能：
 *   - 从 admin/file/GetDetail 加载制品规格书数据
 *   - 按 A4 竖版（210mm×297mm）排版，Excel 工厂制表风格
 *   - 预览页面各区块可拖动排序
 *   - 点击「打印 / 导出 PDF」触发浏览器打印对话框
 *
 * 路由：/file/:id/print
 */
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import InlineSvg from "../../components/InlineSvg";
import { callApi } from "../../api/callApi";
import { frontConfig } from "../../frontConfig";
import type { 制品规格书 } from "../../shared/db/Db沐茵丝假发成品稿";
import type { 制品规格书Frontend } from "../../shared/frontend/model/model";
import { buildPreviewSvg } from "../admin/add-file/components/DyeLevelEditor";
import { 数字转分数字符串 } from "../../shared/models/分数转换";

// ─────────────────────────────────────────────────────────────────────────────
// Row types
// ─────────────────────────────────────────────────────────────────────────────
type MachineRow = 制品规格书["机器规格清单"][number];
type ManualRow = 制品规格书["人工规格清单"][number];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function fmtNum(v: number | undefined): string {
  return v == null ? "—" : v.toFixed(2);
}

function fmtFrac(v: number | undefined): string {
  return v == null ? "—" : 数字转分数字符串(v);
}

function resolveImg(src: string): string {
  if (!src) return "";
  if (/^https?:\/\//i.test(src)) return src;
  try {
    return new URL(src, frontConfig.prodServer).toString();
  } catch {
    return src;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared cell-style objects (print-safe inline styles)
// ─────────────────────────────────────────────────────────────────────────────
const BASE_CELL: React.CSSProperties = {
  border: "1px solid #000",
  padding: "1px 3px",
  fontSize: "7.5pt",
  lineHeight: "1.25",
  textAlign: "center",
  verticalAlign: "middle",
};

const TH_STYLE: React.CSSProperties = {
  ...BASE_CELL,
  fontWeight: 700,
  backgroundColor: "#e0e0e0",
};

const SECTION_HEADER: React.CSSProperties = {
  ...BASE_CELL,
  fontSize: "8pt",
  fontWeight: 700,
  backgroundColor: "#c8c8c8",
  textAlign: "left",
  padding: "2px 5px",
};

// ─────────────────────────────────────────────────────────────────────────────
// Primitive cell components
// ─────────────────────────────────────────────────────────────────────────────
function TH({
  children,
  cs,
  rs,
  style,
}: {
  children: React.ReactNode;
  cs?: number;
  rs?: number;
  style?: React.CSSProperties;
}) {
  return (
    <th colSpan={cs} rowSpan={rs} style={{ ...TH_STYLE, ...style }}>
      {children}
    </th>
  );
}

function TD({
  children,
  cs,
  rs,
  left,
  style,
}: {
  children?: React.ReactNode;
  cs?: number;
  rs?: number;
  left?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <td
      colSpan={cs}
      rowSpan={rs}
      style={{
        ...BASE_CELL,
        ...(left ? { textAlign: "left", paddingLeft: 4 } : {}),
        ...style,
      }}
    >
      {children ?? "—"}
    </td>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 基本信息 section (2-row wide info table)
// ─────────────────────────────────────────────────────────────────────────────
function InfoSection({ data }: { data: 制品规格书Frontend }) {
  const { title, 制帽 } = data;
  const LW = "52px";
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <tbody>
        <tr>
          <TH style={{ width: LW }}>样品编号</TH>
          <TD left style={{ width: "14%" }}>
            {title.样品编号}
          </TD>
          <TH style={{ width: LW }}>客户编号</TH>
          <TD left style={{ width: "10%" }}>
            {title.客户编号}
          </TD>
          <TH style={{ width: "36px" }}>品名</TH>
          <TD left cs={3}>
            {title.品名}
          </TD>
          <TH style={{ width: "36px" }}>订单</TH>
          <TD left cs={3}>
            {title.订单 || "—"}
          </TD>
        </tr>
        <tr>
          <TH>原料</TH>
          <TD left cs={7}>
            {title.原料}
          </TD>
        </tr>
      </tbody>
    </table>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 机器规格清单 compact table
// ─────────────────────────────────────────────────────────────────────────────
function MachineTable({ rows }: { rows: MachineRow[] }) {
  const showM = rows.some(
    (r) =>
      r.双针.尺数.M != null || r.裁断与重量.some((c) => c.重量g?.M != null),
  );
  const show对裁 = rows.some((r) => r.整毛.对裁 != null);

  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        tableLayout: "fixed",
      }}
    >
      <colgroup>
        <col style={{ width: "30px" }} />
        <col style={{ width: "33px" }} />
        <col style={{ width: "30px" }} />
        {show对裁 && <col style={{ width: "30px" }} />}
        <col style={{ width: "33px" }} />
        {showM && <col style={{ width: "33px" }} />}
        <col style={{ width: "33px" }} />
        <col style={{ width: "33px" }} />
        <col style={{ width: "36px" }} />
        {showM && <col style={{ width: "36px" }} />}
        <col style={{ width: "36px" }} />
        <col style={{ width: "33px" }} />
        <col style={{ width: "42px" }} />
        <col style={{ width: "28px" }} />
        <col style={{ width: "42px" }} />
        <col style={{ width: "28px" }} />
        <col />
      </colgroup>
      <thead>
        <tr>
          <TH rs={2}>档位</TH>
          <TH rs={2}>裁断</TH>
          <TH cs={show对裁 ? 2 : 1}>整毛</TH>
          <TH cs={showM ? 3 : 2}>重量g</TH>
          <TH cs={showM ? 5 : 4}>双针</TH>
          <TH rs={2}>形态</TH>
          <TH cs={3}>美容</TH>
          <TH rs={2}>备注</TH>
        </tr>
        <tr>
          <TH>拉尖</TH>
          {show对裁 && <TH>对裁</TH>}
          <TH>D</TH>
          {showM && <TH>M</TH>}
          <TH>L</TH>
          <TH>毛长</TH>
          <TH>尺数D</TH>
          {showM && <TH>尺数M</TH>}
          <TH>尺数L</TH>
          <TH>密度</TH>
          <TH>铝管</TH>
          <TH>方向</TH>
          <TH>层数</TH>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <TD cs={17} style={{ color: "#888" }}>
              暂无机器规格清单
            </TD>
          </tr>
        ) : (
          rows.flatMap((row, ri) => {
            const cuts =
              row.裁断与重量.length > 0 ? row.裁断与重量 : [{ 裁断: 0 }];
            return cuts.map((cut, ci) => (
              <tr key={`${ri}-${ci}`}>
                {ci === 0 && <TD rs={cuts.length}>{row.档位}</TD>}
                <TD>{fmtNum(cut.裁断)}</TD>
                {ci === 0 && (
                  <>
                    <TD rs={cuts.length}>{fmtFrac(row.整毛.拉尖)}</TD>
                    {show对裁 && (
                      <TD rs={cuts.length}>{fmtFrac(row.整毛.对裁)}</TD>
                    )}
                  </>
                )}
                <TD>{fmtNum(cut.重量g?.D)}</TD>
                {showM && <TD>{fmtNum(cut.重量g?.M)}</TD>}
                <TD>{fmtNum(cut.重量g?.L)}</TD>
                {ci === 0 && (
                  <>
                    <TD rs={cuts.length}>{fmtFrac(row.双针.毛长)}</TD>
                    <TD rs={cuts.length}>{fmtNum(row.双针.尺数.D)}</TD>
                    {showM && (
                      <TD rs={cuts.length}>{fmtNum(row.双针.尺数.M)}</TD>
                    )}
                    <TD rs={cuts.length}>{fmtNum(row.双针.尺数.L)}</TD>
                    <TD rs={cuts.length}>{fmtNum(row.双针.密度)}</TD>
                    <TD rs={cuts.length}>{row.形态 ?? "—"}</TD>
                    <TD rs={cuts.length}>{fmtNum(row.美容.铝管)}</TD>
                    <TD rs={cuts.length}>{row.美容.方向 || "—"}</TD>
                    <TD rs={cuts.length}>{fmtNum(row.美容.层数)}</TD>
                    <TD rs={cuts.length} left>
                      {row.备注 ?? "—"}
                    </TD>
                  </>
                )}
              </tr>
            ));
          })
        )}
      </tbody>
    </table>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 人工规格清单 compact table
// ─────────────────────────────────────────────────────────────────────────────
function ManualTable({ rows }: { rows: ManualRow[] }) {
  const showM = rows.some((r) => r.裁断与重量.some((c) => c.重量g?.M != null));
  const show对裁 = rows.some((r) => r.整毛.对裁 != null);

  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        tableLayout: "fixed",
      }}
    >
      <colgroup>
        <col style={{ width: "30px" }} />
        <col style={{ width: "33px" }} />
        <col style={{ width: "30px" }} />
        {show对裁 && <col style={{ width: "30px" }} />}
        <col style={{ width: "33px" }} />
        {showM && <col style={{ width: "33px" }} />}
        <col style={{ width: "33px" }} />
        <col style={{ width: "33px" }} />
        <col style={{ width: "52px" }} />
        <col style={{ width: "33px" }} />
        <col style={{ width: "42px" }} />
        <col style={{ width: "33px" }} />
        <col style={{ width: "52px" }} />
        <col />
      </colgroup>
      <thead>
        <tr>
          <TH rs={2}>档位</TH>
          <TH rs={2}>裁断</TH>
          <TH cs={show对裁 ? 2 : 1}>整毛</TH>
          <TH cs={showM ? 3 : 2}>重量g</TH>
          <TH cs={3}>双针</TH>
          <TH rs={2}>形态</TH>
          <TH rs={2}>美容铝管</TH>
          <TH rs={2}>位置</TH>
          <TH rs={2}>备注</TH>
        </tr>
        <tr>
          <TH>拉尖</TH>
          {show对裁 && <TH>对裁</TH>}
          <TH>D</TH>
          {showM && <TH>M</TH>}
          <TH>L</TH>
          <TH>毛长</TH>
          <TH>磅发</TH>
          <TH>密度</TH>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <TD cs={14} style={{ color: "#888" }}>
              暂无人工规格清单
            </TD>
          </tr>
        ) : (
          rows.flatMap((row, ri) => {
            const cuts =
              row.裁断与重量.length > 0 ? row.裁断与重量 : [{ 裁断: 0 }];
            return cuts.map((cut, ci) => (
              <tr key={`${ri}-${ci}`}>
                {ci === 0 && <TD rs={cuts.length}>{row.档位}</TD>}
                <TD>{fmtNum(cut.裁断)}</TD>
                {ci === 0 && (
                  <>
                    <TD rs={cuts.length}>{fmtFrac(row.整毛.拉尖)}</TD>
                    {show对裁 && (
                      <TD rs={cuts.length}>{fmtFrac(row.整毛.对裁)}</TD>
                    )}
                  </>
                )}
                <TD>{fmtNum(cut.重量g?.D)}</TD>
                {showM && <TD>{fmtNum(cut.重量g?.M)}</TD>}
                <TD>{fmtNum(cut.重量g?.L)}</TD>
                {ci === 0 && (
                  <>
                    <TD rs={cuts.length}>{fmtFrac(row.双针.毛长)}</TD>
                    <TD rs={cuts.length}>
                      {row.双针.磅发 != null ? `磅${row.双针.磅发}g/扎` : "—"}
                    </TD>
                    <TD rs={cuts.length}>{fmtNum(row.双针.密度)}</TD>
                    <TD rs={cuts.length}>{row.形态 ?? "—"}</TD>
                    <TD rs={cuts.length}>{fmtNum(row.美容.铝管)}</TD>
                    <TD rs={cuts.length}>{row.位置 ?? "—"}</TD>
                    <TD rs={cuts.length} left>
                      {row.备注 ?? "—"}
                    </TD>
                  </>
                )}
              </tr>
            ));
          })
        )}
      </tbody>
    </table>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 染色比例（胶丝比例）section
// ─────────────────────────────────────────────────────────────────────────────
function DyeRatioSection({ data }: { data: 制品规格书Frontend }) {
  const 胶丝 = data.胶丝比例;
  if (!胶丝) return null;

  function RatioGroup({
    rows,
    label,
  }: {
    rows: (typeof 胶丝.D)[number][];
    label: string;
  }) {
    return (
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            ...TH_STYLE,
            display: "block",
            borderBottom: "none",
            textAlign: "center",
            padding: "2px 4px",
          }}
        >
          {label}
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <TH>发丝</TH>
              <TH>色号</TH>
              <TH>比例 %</TH>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              // 兼容“发丝”或“发丝种类”字段
              const hair = (r as any).发丝 ?? (r as any)["发丝"] ?? (r as any).发丝种类 ?? (r as any)["发丝种类"] ?? "—";
              return (
                <tr key={i}>
                  <TD>{hair}</TD>
                  <TD>{r.色号}</TD>
                  <TD>{r.比例}%</TD>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  const DGroups =
    胶丝.D.length > 0 ? [<RatioGroup key="D" rows={胶丝.D} label="D" />] : [];
  const MGroups =
    (胶丝.M ?? []).length > 0
      ? [<RatioGroup key="M" rows={胶丝.M!} label="M" />]
      : [];
  const LGroups =
    (胶丝.L ?? []).length > 0
      ? [<RatioGroup key="L" rows={胶丝.L!} label="L" />]
      : [];

  return (
    <div style={{ border: "1px solid #000" }}>
      {/* Info row */}
      <div
        style={{
          display: "flex",
          gap: "16px",
          padding: "2px 6px",
          fontSize: "7.5pt",
          borderBottom: "1px solid #000",
          backgroundColor: "#f4f4f4",
        }}
      >
        <span>
          <b>颜色编号：</b>
          {胶丝._id.颜色编号}
        </span>
        <span>
          <b>发丝种类：</b>
          {胶丝._id.发丝种类}
        </span>
        {胶丝.线色 ? (
          <span>
            <b>线色：</b>
            {胶丝.线色}
          </span>
        ) : null}
        {胶丝.备注 ? (
          <span>
            <b>备注：</b>
            {胶丝.备注}
          </span>
        ) : null}
      </div>
      {/* D/M/L tables side by side */}
      <div style={{ display: "flex", gap: "0", alignItems: "flex-start" }}>
        {[...DGroups, ...MGroups, ...LGroups]}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 下方三栏区（图片 | 工艺说明 | 工程重量）
// ─────────────────────────────────────────────────────────────────────────────
const WEIGHT_KEYS = [
  "整毛",
  "双针",
  "美容",
  "制帽",
  "高针",
  "手织",
  "剪驳",
  "发网",
  "完成",
] as const;

type WeightItem = { 加减: number; 数值: number };

type BottomColId = "images" | "hatMaking" | "process" | "weight";

// Default widths in percentage points (must sum to 100)
const BOTTOM_DEFAULT_WIDTHS: Record<BottomColId, number> = {
  images: 20,
  hatMaking: 9,
  process: 47,
  weight: 24,
};

const BOTTOM_COL_LABELS: Record<BottomColId, string> = {
  images: "发型 / 染色图",
  hatMaking: "制帽",
  process: "工艺说明",
  weight: "工程重量",
};

function BottomSection({ data }: { data: 制品规格书Frontend }) {
  const { 工艺说明, 工程重量, 发型图片, 染色档位列表, 制帽 } = data;

  const weightRows: { key: (typeof WEIGHT_KEYS)[number]; item: WeightItem }[] = WEIGHT_KEYS
    .map((key) => {
      const item = (工程重量 as Record<string, unknown>)[key];
      return typeof item === "object" && item !== null && "加减" in item && "数值" in item
        ? { key, item: item as WeightItem }
        : null;
    })
    .filter((x): x is { key: (typeof WEIGHT_KEYS)[number]; item: WeightItem } => x !== null);

  const 工艺条目 = Object.entries(工艺说明 ?? {});

  const 制帽行: { label: string; value: React.ReactNode }[] = [
    { label: "帽围", value: `${制帽.帽围} cm` },
    { label: "帽深", value: `${制帽.帽深} cm` },
    { label: "前后", value: `${制帽.前后} cm` },
    { label: "唛头", value: 制帽.唛头 || "—" },
    { label: "号码", value: "—" },
  ];

  // ── column order & widths (interactive state) ──
  const [colOrder, setColOrder] = useState<BottomColId[]>([
    "images",
    "hatMaking",
    "process",
    "weight",
  ]);
  const [colWidths, setColWidths] = useState<Record<BottomColId, number>>(
    BOTTOM_DEFAULT_WIDTHS,
  );

  // ── column drag-to-reorder ──
  const [dragSrc, setDragSrc] = useState<BottomColId | null>(null);
  const [dragOver, setDragOver] = useState<BottomColId | null>(null);

  function onColDragStart(col: BottomColId) {
    setDragSrc(col);
  }
  function onColDragOver(e: React.DragEvent, col: BottomColId) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(col);
  }
  function onColDrop(col: BottomColId) {
    if (!dragSrc || dragSrc === col) {
      setDragSrc(null);
      setDragOver(null);
      return;
    }
    setColOrder((prev) => {
      const next = [...prev];
      const from = next.indexOf(dragSrc);
      const to = next.indexOf(col);
      if (from < 0 || to < 0) return prev;
      next.splice(from, 1);
      next.splice(to, 0, dragSrc);
      return next;
    });
    setDragSrc(null);
    setDragOver(null);
  }
  function onColDragEnd() {
    setDragSrc(null);
    setDragOver(null);
  }

  // ── resize divider ──
  const containerRef = useRef<HTMLDivElement>(null);

  function startResize(
    leftColId: BottomColId,
    rightColId: BottomColId,
    e: React.MouseEvent,
  ) {
    e.preventDefault();
    e.stopPropagation();
    const container = containerRef.current;
    if (!container) return;
    const totalWidth = container.offsetWidth;
    const startX = e.clientX;
    const startLeft = colWidths[leftColId];
    const startRight = colWidths[rightColId];

    function onMove(ev: MouseEvent) {
      const delta = ev.clientX - startX;
      const deltaPct = (delta / totalWidth) * 100;
      const newLeft = Math.max(
        4,
        Math.min(startLeft + startRight - 4, startLeft + deltaPct),
      );
      const newRight = startLeft + startRight - newLeft;
      setColWidths((prev) => ({
        ...prev,
        [leftColId]: newLeft,
        [rightColId]: newRight,
      }));
    }
    function onUp() {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  // ── column content renderers ──
  function renderColContent(col: BottomColId) {
    switch (col) {
      case "images": {
        // 每张图片/染色档位图都可自由拖动和缩放
        const [imgStates, setImgStates] = React.useState(
          () => 发型图片.slice(0, 2).map(() => ({ x: 0, y: 0, w: 120, h: 120 }))
        );
        const [svgStates, setSvgStates] = React.useState(
          () => (染色档位列表 ?? []).map(() => ({ x: 0, y: 0, w: 120, h: 40 }))
        );
        // 拖动和缩放逻辑
        function startDrag(type: "img" | "svg", idx: number, e: React.MouseEvent) {
          e.preventDefault();
          e.stopPropagation();
          const startX = e.clientX, startY = e.clientY;
          const states = type === "img" ? imgStates : svgStates;
          const { x, y } = states[idx];
          function onMove(ev: MouseEvent) {
            const dx = ev.clientX - startX;
            const dy = ev.clientY - startY;
            if (type === "img") {
              setImgStates(prev => prev.map((s, i) => i === idx ? { ...s, x: x + dx, y: y + dy } : s));
            } else {
              setSvgStates(prev => prev.map((s, i) => i === idx ? { ...s, x: x + dx, y: y + dy } : s));
            }
          }
          function onUp() {
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup", onUp);
          }
          document.addEventListener("mousemove", onMove);
          document.addEventListener("mouseup", onUp);
        }
        function startResize(type: "img" | "svg", idx: number, e: React.MouseEvent) {
          e.preventDefault();
          e.stopPropagation();
          const startX = e.clientX, startY = e.clientY;
          const states = type === "img" ? imgStates : svgStates;
          const { w, h } = states[idx];
          function onMove(ev: MouseEvent) {
            const dw = ev.clientX - startX;
            const dh = ev.clientY - startY;
            if (type === "img") {
              setImgStates(prev => prev.map((s, i) => i === idx ? { ...s, w: Math.max(40, w + dw), h: Math.max(40, h + dh) } : s));
            } else {
              setSvgStates(prev => prev.map((s, i) => i === idx ? { ...s, w: Math.max(40, w + dw), h: Math.max(20, h + dh) } : s));
            }
          }
          function onUp() {
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup", onUp);
          }
          document.addEventListener("mousemove", onMove);
          document.addEventListener("mouseup", onUp);
        }
        return (
          <>
            {发型图片.length > 0 && (
              <div style={{ marginBottom: "3px", position: "relative", minHeight: 140 }}>
                <div style={SECTION_HEADER}>发型参考图</div>
                <div style={{ position: "relative", width: "100%", minHeight: 140 }}>
                  {发型图片.slice(0, 2).map((src, i) => {
                    const s = imgStates[i];
                    return (
                      <div
                        key={i}
                        style={{
                          position: "absolute",
                          left: s.x,
                          top: s.y,
                          width: s.w,
                          height: s.h,
                          border: "1px solid #999",
                          background: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden",
                          cursor: "move",
                          zIndex: 10 + i,
                        }}
                        onMouseDown={e => {
                          // 只在非右下角缩放区拖动
                          const rect = (e.target as HTMLElement).getBoundingClientRect();
                          if (e.clientX > rect.right - 18 && e.clientY > rect.bottom - 18) return;
                          startDrag("img", i, e);
                        }}
                      >
                        <img
                          src={resolveImg(src)}
                          alt="发型图"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                            display: "block",
                          }}
                        />
                        {/* 缩放手柄 */}
                        <div
                          className="psp-no-print"
                          style={{
                            position: "absolute",
                            right: 0,
                            bottom: 0,
                            width: 18,
                            height: 18,
                            cursor: "nwse-resize",
                            zIndex: 20,
                            display: "flex",
                            alignItems: "flex-end",
                            justifyContent: "flex-end",
                          }}
                          onMouseDown={e => startResize("img", i, e)}
                          title="拖动缩放图片"
                        >
                          <div style={{ width: 12, height: 12, background: "#aab", borderRadius: 3, opacity: 0.7 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {染色档位列表.length > 0 && (
              <div style={{ position: "relative", minHeight: 60 }}>
                <div style={SECTION_HEADER}>染色档位图</div>
                <div style={{ position: "relative", width: "100%", minHeight: 60 }}>
                  {染色档位列表.map((item, i) => {
                    const svg = buildPreviewSvg(item);
                    if (!svg) return null;
                    const s = svgStates[i];
                    return (
                      <div
                        key={i}
                        style={{
                          position: "absolute",
                          left: s.x,
                          top: s.y,
                          width: s.w,
                          height: s.h,
                          border: "1px solid #999",
                          background: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden",
                          cursor: "move",
                          zIndex: 10 + i,
                        }}
                        onMouseDown={e => {
                          // 只在非右下角缩放区拖动
                          const rect = (e.target as HTMLElement).getBoundingClientRect();
                          if (e.clientX > rect.right - 18 && e.clientY > rect.bottom - 18) return;
                          startDrag("svg", i, e);
                        }}
                      >
                        <div style={{ width: "100%", height: "100%" }}>
                          <InlineSvg svg={svg} />
                        </div>
                        {/* 缩放手柄 */}
                        <div
                          className="psp-no-print"
                          style={{
                            position: "absolute",
                            right: 0,
                            bottom: 0,
                            width: 18,
                            height: 18,
                            cursor: "nwse-resize",
                            zIndex: 20,
                            display: "flex",
                            alignItems: "flex-end",
                            justifyContent: "flex-end",
                          }}
                          onMouseDown={e => startResize("svg", i, e)}
                          title="拖动缩放染色档位图"
                        >
                          <div style={{ width: 12, height: 12, background: "#aab", borderRadius: 3, opacity: 0.7 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        );
      }

      case "hatMaking":
        return (
          <>
            <div style={SECTION_HEADER}>制帽</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {制帽行.map(({ label, value }) => (
                  <tr key={label}>
                    <th
                      style={{
                        ...TH_STYLE,
                        textAlign: "center",
                        whiteSpace: "nowrap",
                        padding: "2px 2px",
                        width: "24px",
                      }}
                    >
                      {label}
                    </th>
                    <td
                      style={{
                        ...BASE_CELL,
                        textAlign: "center",
                        verticalAlign: "middle",
                        wordBreak: "break-all",
                        padding: "2px 2px",
                      }}
                    >
                      {value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        );

      case "process":
        return (
          <>
            <div style={SECTION_HEADER}>工艺说明</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {工艺条目.map(([key, val]) => (
                  <tr key={key}>
                    <th
                      style={{
                        ...TH_STYLE,
                        width: "48px",
                        whiteSpace: "nowrap",
                        verticalAlign: "top",
                      }}
                    >
                      {key}
                    </th>
                    <td
                      style={{
                        ...BASE_CELL,
                        textAlign: "left",
                        verticalAlign: "top",
                        wordBreak: "break-all",
                      }}
                    >
                      {val}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        );

      case "weight":
        return (
          <>
            <div style={SECTION_HEADER}>工程重量（{data.当前重量}g）</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <TH>工序</TH>
                  <TH>加减</TH>
                  <TH>重量g</TH>
                </tr>
              </thead>
              <tbody>
                {weightRows.map(({ key, item }) => (
                  <tr key={key}>
                    <TD>{key}</TD>
                    <TD>
                      {item.加减 >= 0 ? "+" : ""}
                      {item.加减}
                    </TD>
                    <TD>{item.数值}g</TD>
                  </tr>
                ))}
                {工程重量.重量 ? (
                  <tr>
                    <TD
                      cs={3}
                      style={{
                        fontWeight: 700,
                        backgroundColor: "#e0e0e0",
                        textAlign: "center",
                      }}
                    >
                      完成重量：{工程重量.重量}
                    </TD>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </>
        );
    }
  }

  return (
    <div
      ref={containerRef}
      style={{
        display: "flex",
        alignItems: "flex-start",
        position: "relative",
      }}
    >
      {/* 最左侧伸缩杆 */}
      <div
        className="psp-no-print"
        title="拖动调整宽度"
        onMouseDown={e => startResize(colOrder[0], colOrder[1], e)}
        style={{
          width: "6px",
          flexShrink: 0,
          alignSelf: "stretch",
          cursor: "col-resize",
          background: "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10,
        }}
      >
        <div
          style={{
            width: "2px",
            height: "100%",
            minHeight: "20px",
            background: "#aab",
            borderRadius: "1px",
          }}
        />
      </div>
      {colOrder.map((col, idx) => (
        <React.Fragment key={col}>
          {/* ── Column ── */}
          <div
            draggable
            onDragStart={() => onColDragStart(col)}
            onDragOver={(e) => onColDragOver(e, col)}
            onDrop={() => onColDrop(col)}
            onDragEnd={onColDragEnd}
            style={{
              width: `${colWidths[col]}%`,
              minWidth: 0,
              flexShrink: 0,
              opacity: dragSrc === col ? 0.35 : 1,
              outline:
                dragOver === col && dragSrc !== col
                  ? "2px dashed #0070f3"
                  : "none",
              outlineOffset: "1px",
              transition: "opacity 0.15s",
              position: "relative",
            }}
          >
            {/* Drag handle — screen only */}
            <div
              className="psp-no-print"
              title={`拖动以调整顺序：${BOTTOM_COL_LABELS[col]}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "4px",
                background: "#f0f4ff",
                border: "1px dashed #99b",
                borderBottom: "none",
                padding: "1px 5px",
                fontSize: "9px",
                color: "#557",
                cursor: "grab",
                userSelect: "none",
              }}
            >
              <span style={{ fontSize: "12px", color: "#99b" }}>⠿</span>
              <span>{BOTTOM_COL_LABELS[col]}</span>
            </div>

            {renderColContent(col)}
          </div>

          {/* ── Resize divider (between columns) ── */}
          {idx < colOrder.length - 1 && (
            <div
              className="psp-no-print"
              title="拖动调整宽度"
              onMouseDown={(e) => startResize(col, colOrder[idx + 1], e)}
              style={{
                width: "6px",
                flexShrink: 0,
                alignSelf: "stretch",
                cursor: "col-resize",
                background: "transparent",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 10,
              }}
            >
              <div
                style={{
                  width: "2px",
                  height: "100%",
                  minHeight: "20px",
                  background: "#aab",
                  borderRadius: "1px",
                }}
              />
            </div>
          )}
        </React.Fragment>
      ))}
      {/* 最右侧伸缩杆 */}
      <div
        className="psp-no-print"
        title="拖动调整宽度"
        onMouseDown={e => startResize(colOrder[colOrder.length - 1], colOrder[colOrder.length - 2], e)}
        style={{
          width: "6px",
          flexShrink: 0,
          alignSelf: "stretch",
          cursor: "col-resize",
          background: "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10,
        }}
      >
        <div
          style={{
            width: "2px",
            height: "100%",
            minHeight: "20px",
            background: "#aab",
            borderRadius: "1px",
          }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Draggable module definitions
// ─────────────────────────────────────────────────────────────────────────────
type ModuleId = "info" | "machine" | "manual" | "dye-ratio" | "bottom";

const MODULE_LABELS: Record<ModuleId, string> = {
  info: "基本信息",
  machine: "机器规格清单",
  manual: "人工规格清单",
  "dye-ratio": "染色比例（胶丝比例）",
  bottom: "下方三栏（图片 · 工艺说明 · 工程重量）",
};

const DEFAULT_ORDER: ModuleId[] = [
  "info",
  "machine",
  "manual",
  "dye-ratio",
  "bottom",
];

// ─────────────────────────────────────────────────────────────────────────────
// Print CSS (injected as <style> tag — only affects this page)
// ─────────────────────────────────────────────────────────────────────────────
const PRINT_CSS = `
  @media print {
    .psp-no-print { display: none !important; }
    body { margin: 0 !important; padding: 0 !important; background: white !important; }
    .psp-canvas  { background: white !important; padding: 0 !important; }
    .psp-a4-page { box-shadow: none !important; }
    .psp-drag-handle { display: none !important; }
    @page { size: A4 portrait; margin: 8mm; }
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// Main page component
// ─────────────────────────────────────────────────────────────────────────────
export default function PrintSpecPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [spec, setSpec] = useState<制品规格书Frontend | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [order, setOrder] = useState<ModuleId[]>(DEFAULT_ORDER);
  const [dragSrc, setDragSrc] = useState<ModuleId | null>(null);
  const [dragOver, setDragOver] = useState<ModuleId | null>(null);

  useEffect(() => {
    if (!id) return;
    callApi("admin/file/GetDetail", { id }).then((res) => {
      if (res.isSucc) {
        setSpec(res.res.file.制品规格书);
      } else {
        setFetchError(res.err.message);
      }
      setLoading(false);
    });
  }, [id]);

  // ── Drag handlers ──
  function onDragStart(mod: ModuleId) {
    setDragSrc(mod);
  }
  function onDragOver(e: React.DragEvent, mod: ModuleId) {
    e.preventDefault();
    setDragOver(mod);
  }
  function onDrop(mod: ModuleId) {
    if (!dragSrc || dragSrc === mod) {
      setDragSrc(null);
      setDragOver(null);
      return;
    }
    setOrder((prev) => {
      const next = [...prev];
      const from = next.indexOf(dragSrc);
      const to = next.indexOf(mod);
      if (from < 0 || to < 0) return prev;
      next.splice(from, 1);
      next.splice(to, 0, dragSrc);
      return next;
    });
    setDragSrc(null);
    setDragOver(null);
  }
  function onDragEnd() {
    setDragSrc(null);
    setDragOver(null);
  }

  // ── Module renderer ──
  function renderModule(key: ModuleId) {
    if (!spec) return null;
    switch (key) {
      case "info":
        return <InfoSection data={spec} />;
      case "machine":
        return (
          <>
            <div style={SECTION_HEADER}>机器规格清单</div>
            <MachineTable rows={spec.机器规格清单} />
          </>
        );
      case "manual":
        return (
          <>
            <div style={SECTION_HEADER}>人工规格清单</div>
            <ManualTable rows={spec.人工规格清单} />
          </>
        );
      case "dye-ratio":
        return (
          <>
            <div style={SECTION_HEADER}>染色比例（胶丝比例）</div>
            <DyeRatioSection data={spec} />
          </>
        );
      case "bottom":
        return <BottomSection data={spec} />;
    }
  }

  // ── Loading / error states ──
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "60vh",
          fontSize: "14px",
          color: "#666",
        }}
      >
        加载中...
      </div>
    );
  }

  if (fetchError || !spec) {
    return (
      <div style={{ padding: "32px", color: "#c00", fontSize: "14px" }}>
        加载失败：{fetchError || "未找到稿件数据"}
      </div>
    );
  }

  // ── Render ──
  return (
    <>
      {/* Print CSS */}
      <style>{PRINT_CSS}</style>

      {/* ── Toolbar (screen only) ── */}
      <div
        className="psp-no-print"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 200,
          background: "#1a1a1a",
          color: "#fff",
          padding: "8px 16px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          fontSize: "13px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            color: "#aaa",
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "13px",
            padding: "0 4px",
          }}
        >
          ← 返回
        </button>
        <span style={{ flex: 1, color: "#777", fontSize: "12px" }}>
          ⠿ 拖动各模块左侧手柄可调整区块顺序
        </span>
        <button
          onClick={() => window.print()}
          style={{
            background: "#0070f3",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            padding: "6px 18px",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 600,
          }}
        >
          🖨 打印 / 导出 PDF
        </button>
      </div>

      {/* ── A4 canvas wrapper ── */}
      <div
        className="psp-canvas"
        style={{
          background: "#8a8a8a",
          padding: "24px 16px",
          minHeight: "calc(100vh - 44px)",
        }}
      >
        <div
          className="psp-a4-page"
          style={{
            width: "210mm",
            minHeight: "297mm",
            background: "white",
            margin: "0 auto",
            padding: "8mm 8mm 10mm",
            boxShadow: "0 4px 28px rgba(0,0,0,0.45)",
            fontFamily: '"Arial", "SimSun", "PingFang SC", sans-serif',
            boxSizing: "border-box",
          }}
        >
          {/* ── Fixed document title ── */}
          <div
            style={{
              textAlign: "center",
              fontSize: "14pt",
              fontWeight: 800,
              letterSpacing: "0.15em",
              borderBottom: "2px solid #000",
              marginBottom: "4px",
              paddingBottom: "4px",
            }}
          >
            制品规格书
          </div>

          {/* ── Draggable modules ── */}
          {order.map((key) => (
            <div
              key={key}
              draggable
              onDragStart={() => onDragStart(key)}
              onDragOver={(e) => onDragOver(e, key)}
              onDrop={() => onDrop(key)}
              onDragEnd={onDragEnd}
              style={{
                marginBottom: "4px",
                opacity: dragSrc === key ? 0.35 : 1,
                outline:
                  dragOver === key && dragSrc !== key
                    ? "2px dashed #0070f3"
                    : "none",
                outlineOffset: "1px",
                transition: "opacity 0.15s",
              }}
            >
              {/* Drag handle — screen only, hidden on print */}
              <div
                className="psp-drag-handle psp-no-print"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "#eef2ff",
                  border: "1px dashed #99b",
                  borderBottom: "none",
                  padding: "1px 6px",
                  fontSize: "10px",
                  color: "#557",
                  cursor: "grab",
                  userSelect: "none",
                }}
              >
                <span style={{ fontSize: "13px", color: "#99b" }}>⠿</span>
                <span>{MODULE_LABELS[key]}</span>
              </div>

              {/* Module content */}
              {renderModule(key)}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
