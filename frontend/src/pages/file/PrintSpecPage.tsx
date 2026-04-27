/**
 * PrintSpecPage — 成品稿三文档 A4 打印预览页
 *
 * 功能：
 *   - 从 admin/file/GetDetail 加载成品稿三份文档数据
 *   - 按 A4 竖版（210mm×297mm）排版，Excel 工厂制表风格
 *   - 预览页面各区块可拖动排序
 *   - 点击「打印 / 导出 PDF」触发浏览器打印对话框
 *
 * 路由：/file/:id/print
 */
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import InlineSvg from "../../components/InlineSvg";
import { callApi } from "../../api/callApi";
import { frontConfig } from "../../frontConfig";
import type { 制品规格书 } from "../../shared/db/Db沐茵丝假发成品稿";
import type {
  制品规格书Frontend,
  高针指示单Frontend,
  手织指示单Frontend,
  沐茵丝假发成品稿Frontend,
} from "../../shared/frontend/model/model";
import { buildPreviewSvg } from "../admin/add-file/components/DyeLevelEditor";
import {
  格式化可选定位小数,
  格式化定位小数,
  格式化四分之一分数,
} from "../../shared/models/数字格式化";

// ─────────────────────────────────────────────────────────────────────────────
// Row types
// ─────────────────────────────────────────────────────────────────────────────
type MachineRow = 制品规格书["机器规格清单"][number];
type ManualRow = 制品规格书["人工规格清单"][number];

function resolveImg(src: string): string {
  if (!src) return "";
  if (/^https?:\/\//i.test(src)) return src;
  try {
    return new URL(src, frontConfig.prodServer).toString();
  } catch {
    return src;
  }
}

function getSvgAspectRatio(svg: string): number {
  if (!svg.trim()) return 3;

  const viewBoxMatch = svg.match(/viewBox=["']\s*([-\d.]+)[ ,]+([-\d.]+)[ ,]+([-\d.]+)[ ,]+([-\d.]+)\s*["']/i);
  if (viewBoxMatch) {
    const width = Number(viewBoxMatch[3]);
    const height = Number(viewBoxMatch[4]);
    if (width > 0 && height > 0) {
      return width / height;
    }
  }

  const widthMatch = svg.match(/width=["']([\d.]+)(?:px)?["']/i);
  const heightMatch = svg.match(/height=["']([\d.]+)(?:px)?["']/i);
  if (widthMatch && heightMatch) {
    const width = Number(widthMatch[1]);
    const height = Number(heightMatch[1]);
    if (width > 0 && height > 0) {
      return width / height;
    }
  }

  return 3;
}

function createInitialSvgState(svg: string) {
  const aspectRatio = getSvgAspectRatio(svg);
  const width = 140;
  const rawHeight = width / aspectRatio;
  const height = Math.max(40, Math.min(120, rawHeight));
  return { x: 0, y: 0, w: width, h: height };
}

function normalizeSvgForPrintBox(svg: string): string {
  if (!svg.trim()) return svg;

  const withoutRegionNumbers = svg.replace(
    /<text\b(?=[^>]*\bid=["']region_text[^"']*["'])[^>]*>[\s\S]*?<\/text>/gi,
    "",
  );

  return withoutRegionNumbers.replace(/<svg\b([^>]*)>/i, (_, attrs: string) => {
    const cleaned = attrs
      .replace(/\swidth=["'][^"']*["']/gi, "")
      .replace(/\sheight=["'][^"']*["']/gi, "")
      .replace(/\spreserveAspectRatio=["'][^"']*["']/gi, "");

    return `<svg${cleaned} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">`;
  });
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
  const { title } = data;
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
                <TD>{格式化可选定位小数(cut.裁断, 2)}</TD>
                {ci === 0 && (
                  <>
                    <TD rs={cuts.length}>{格式化四分之一分数(row.整毛.拉尖)}</TD>
                    {show对裁 && (
                      <TD rs={cuts.length}>{格式化四分之一分数(row.整毛.对裁)}</TD>
                    )}
                  </>
                )}
                <TD>{格式化可选定位小数(cut.重量g?.D, 2)}</TD>
                {showM && <TD>{格式化可选定位小数(cut.重量g?.M, 2)}</TD>}
                <TD>{格式化可选定位小数(cut.重量g?.L, 2)}</TD>
                {ci === 0 && (
                  <>
                    <TD rs={cuts.length}>{格式化四分之一分数(row.双针.毛长)}</TD>
                    <TD rs={cuts.length}>{格式化可选定位小数(row.双针.尺数.D, 2)}</TD>
                    {showM && (
                      <TD rs={cuts.length}>{格式化可选定位小数(row.双针.尺数.M, 2)}</TD>
                    )}
                    <TD rs={cuts.length}>{格式化可选定位小数(row.双针.尺数.L, 2)}</TD>
                    <TD rs={cuts.length}>{格式化可选定位小数(row.双针.密度, 2)}</TD>
                    <TD rs={cuts.length}>{row.形态 ?? "—"}</TD>
                    <TD rs={cuts.length}>{格式化可选定位小数(row.美容.铝管, 2)}</TD>
                    <TD rs={cuts.length}>{row.美容.方向 || "—"}</TD>
                    <TD rs={cuts.length}>{格式化可选定位小数(row.美容.层数, 2)}</TD>
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
                <TD>{格式化可选定位小数(cut.裁断, 2)}</TD>
                {ci === 0 && (
                  <>
                    <TD rs={cuts.length}>{格式化四分之一分数(row.整毛.拉尖)}</TD>
                    {show对裁 && (
                      <TD rs={cuts.length}>{格式化四分之一分数(row.整毛.对裁)}</TD>
                    )}
                  </>
                )}
                <TD>{格式化可选定位小数(cut.重量g?.D, 2)}</TD>
                {showM && <TD>{格式化可选定位小数(cut.重量g?.M, 2)}</TD>}
                <TD>{格式化可选定位小数(cut.重量g?.L, 2)}</TD>
                {ci === 0 && (
                  <>
                    <TD rs={cuts.length}>{格式化四分之一分数(row.双针.毛长)}</TD>
                    <TD rs={cuts.length}>
                      {row.双针.磅发 != null ? `磅${row.双针.磅发}g/扎` : "—"}
                    </TD>
                    <TD rs={cuts.length}>{格式化可选定位小数(row.双针.密度, 2)}</TD>
                    <TD rs={cuts.length}>{row.形态 ?? "—"}</TD>
                    <TD rs={cuts.length}>{格式化可选定位小数(row.美容.铝管, 2)}</TD>
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
  "手织",
  "高针",
  "剪驳",
  "发网",
  "完成",
] as const;

type WeightItem = { 加减: number; 数值: number };
type FloatRect = { x: number; y: number; w: number; h: number };

function layoutFloatRects(
  count: number,
  getSize: (index: number) => { w: number; h: number },
  maxPerRow = 2,
  gapX = 12,
  gapY = 12,
): FloatRect[] {
  const out: FloatRect[] = [];
  let cursorY = 0;
  for (let i = 0; i < count; i += maxPerRow) {
    let rowHeight = 0;
    for (let col = 0; col < maxPerRow && i + col < count; col++) {
      const idx = i + col;
      const { w, h } = getSize(idx);
      out[idx] = {
        x: col * (w + gapX),
        y: cursorY,
        w,
        h,
      };
      rowHeight = Math.max(rowHeight, h);
    }
    cursorY += rowHeight + gapY;
  }
  return out;
}

function getRectsBottom(rects: FloatRect[]): number {
  if (rects.length === 0) return 0;
  return Math.max(...rects.map((rect) => rect.y + rect.h));
}

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
  const [imgStates, setImgStates] = React.useState<FloatRect[]>(() =>
    layoutFloatRects(Math.min(发型图片.length, 2), () => ({ w: 120, h: 120 })),
  );
  const [svgStates, setSvgStates] = React.useState<FloatRect[]>(() =>
    layoutFloatRects((染色档位列表 ?? []).length, (index) => {
      const svg = buildPreviewSvg(染色档位列表[index]);
      const state = createInitialSvgState(svg || "");
      return { w: state.w, h: state.h };
    }),
  );

  React.useEffect(() => {
    setImgStates(
      layoutFloatRects(Math.min(发型图片.length, 2), () => ({ w: 120, h: 120 })),
    );
  }, [发型图片]);

  React.useEffect(() => {
    setSvgStates(
      layoutFloatRects((染色档位列表 ?? []).length, (index) => {
        const svg = buildPreviewSvg(染色档位列表[index]);
        const state = createInitialSvgState(svg || "");
        return { w: state.w, h: state.h };
      }),
    );
  }, [染色档位列表]);

  function startDrag(type: "img" | "svg", idx: number, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const states = type === "img" ? imgStates : svgStates;
    const { x, y } = states[idx];
    const startX = e.clientX;
    const startY = e.clientY;
    function onMove(ev: MouseEvent) {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (type === "img") {
        setImgStates((prev) =>
          prev.map((s, i) => (i === idx ? { ...s, x: x + dx, y: y + dy } : s)),
        );
      } else {
        setSvgStates((prev) =>
          prev.map((s, i) => (i === idx ? { ...s, x: x + dx, y: y + dy } : s)),
        );
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
    const states = type === "img" ? imgStates : svgStates;
    const { w, h } = states[idx];
    const startX = e.clientX;
    const startY = e.clientY;
    function onMove(ev: MouseEvent) {
      const dw = ev.clientX - startX;
      const dh = ev.clientY - startY;
      if (type === "img") {
        setImgStates((prev) =>
          prev.map((s, i) =>
            i === idx ? { ...s, w: Math.max(40, w + dw), h: Math.max(40, h + dh) } : s,
          ),
        );
      } else {
        setSvgStates((prev) =>
          prev.map((s, i) =>
            i === idx ? { ...s, w: Math.max(40, w + dw), h: Math.max(20, h + dh) } : s,
          ),
        );
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
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "20% 40% 40%",
          alignItems: "stretch",
          gap: "4px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={SECTION_HEADER}>制帽</div>
          <table style={{ width: "100%", borderCollapse: "collapse", height: "100%" }}>
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
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={SECTION_HEADER}>工艺说明</div>
          <table style={{ width: "100%", borderCollapse: "collapse", height: "100%" }}>
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
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={SECTION_HEADER}>工程重量（{格式化定位小数(data.当前重量, 2)}g）</div>
          <table style={{ width: "100%", borderCollapse: "collapse", height: "100%" }}>
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
                  <TD>{`${格式化定位小数(item.数值, 2)}g`}</TD>
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
        </div>
      </div>

      {发型图片.length > 0 || 染色档位列表.length > 0 ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              发型图片.length > 0 && 染色档位列表.length > 0 ? "1fr 1fr" : "1fr",
            gap: "4px",
            alignItems: "start",
          }}
        >
          {发型图片.length > 0 ? (
            <div>
              <div style={SECTION_HEADER}>发型参考图</div>
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  minHeight: Math.max(140, getRectsBottom(imgStates)),
                }}
              >
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
                      onMouseDown={(e) => {
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
                        onMouseDown={(e) => startResize("img", i, e)}
                        title="拖动缩放图片"
                      >
                        <div
                          style={{ width: 12, height: 12, background: "#aab", borderRadius: 3, opacity: 0.7 }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {染色档位列表.length > 0 ? (
            <div>
              <div style={SECTION_HEADER}>染色档位图</div>
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  minHeight: Math.max(80, getRectsBottom(svgStates)),
                }}
              >
                {染色档位列表.map((item, i) => {
                  const rawSvg = buildPreviewSvg(item);
                  if (!rawSvg) return null;
                  const svg = normalizeSvgForPrintBox(rawSvg);
                  const s = svgStates[i] ?? createInitialSvgState(rawSvg);
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
                      onMouseDown={(e) => {
                        const rect = (e.target as HTMLElement).getBoundingClientRect();
                        if (e.clientX > rect.right - 18 && e.clientY > rect.bottom - 18) return;
                        startDrag("svg", i, e);
                      }}
                    >
                      <div style={{ width: "100%", height: "100%" }}>
                        <InlineSvg svg={svg} height="100%" />
                      </div>
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
                        onMouseDown={(e) => startResize("svg", i, e)}
                        title="拖动缩放染色档位图"
                      >
                        <div
                          style={{ width: 12, height: 12, background: "#aab", borderRadius: 3, opacity: 0.7 }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Draggable module definitions
// ─────────────────────────────────────────────────────────────────────────────
type ModuleId = "info" | "machine" | "manual" | "dye-ratio" | "bottom";

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
    .psp-preview-frame, .psp-preview-scale { width: auto !important; min-height: auto !important; }
    .psp-a4-page { box-shadow: none !important; transform: none !important; border: none !important; border-radius: 0 !important; }
    .psp-print-doc { break-before: page; page-break-before: always; }
    .psp-print-doc:first-of-type { break-before: auto; page-break-before: auto; }
    .psp-print-doc { break-after: page; page-break-after: always; }
    .psp-print-doc:last-of-type { break-after: auto; page-break-after: auto; }
    .psp-drag-handle { display: none !important; }
    @page { size: A4 portrait; margin: 8mm; }
  }
`;

function PaperPreviewCard({
  zoom,
  pageTitle,
  pageSubTitle,
  children,
}: {
  zoom: number;
  pageTitle: string;
  pageSubTitle?: string;
  children: React.ReactNode;
}) {
  const A4_W_MM = 210;
  const A4_H_MM = 297;
  return (
    <div
      className="psp-print-doc"
      style={{
        width: `${A4_W_MM * zoom}mm`,
        minHeight: `${A4_H_MM * zoom}mm`,
        margin: "0 auto 24px",
      }}
    >
      <div
        className="psp-no-print"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
          fontSize: "12px",
          color: "#374151",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            borderRadius: 999,
            background: "rgba(255,255,255,0.78)",
            padding: "5px 10px",
            boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
          }}
        >
          <span style={{ fontWeight: 700 }}>{pageTitle}</span>
          {pageSubTitle ? (
            <span style={{ color: "#6b7280" }}>{pageSubTitle}</span>
          ) : null}
        </div>
        <div
          style={{
            borderRadius: 999,
            background: "rgba(255,255,255,0.62)",
            padding: "5px 10px",
            boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
            color: "#6b7280",
          }}
        >
          A4 210 × 297 mm
        </div>
      </div>

      <div
        className="psp-preview-scale"
        style={{
          position: "relative",
          width: `${A4_W_MM * zoom}mm`,
          minHeight: `${A4_H_MM * zoom}mm`,
        }}
      >
        <div
          className="psp-a4-page"
          style={{
            width: "210mm",
            minHeight: "297mm",
            background: "white",
            transform: `scale(${zoom})`,
            transformOrigin: "top left",
            margin: "0 auto",
            padding: "8mm 8mm 10mm",
            boxShadow: "0 10px 34px rgba(15, 23, 42, 0.28)",
            fontFamily: '"Arial", "SimSun", "PingFang SC", sans-serif',
            boxSizing: "border-box",
            borderRadius: "3px",
            border: "1px solid rgba(15,23,42,0.08)",
            overflow: "visible",
          }}
        >
          <div
            className="psp-no-print"
            style={{
              position: "absolute",
              inset: 0,
              border: "1px dashed rgba(59, 130, 246, 0.18)",
              pointerEvents: "none",
            }}
          />
          <div
            className="psp-no-print"
            style={{
              position: "absolute",
              top: 6,
              right: 8,
              fontSize: "9px",
              color: "#94a3b8",
              letterSpacing: "0.04em",
            }}
          >
            PRINT PREVIEW
          </div>
          <div
            style={{
              border: "1.5px solid #000",
              minHeight: "calc(297mm - 18mm)",
              boxSizing: "border-box",
              padding: "3mm 3mm 3.5mm",
              display: "flex",
              flexDirection: "column",
              background: "#fff",
            }}
          >
            {children}
            <div
              style={{
                marginTop: "4mm",
                paddingTop: "2.5mm",
                borderTop: "1px solid #000",
                textAlign: "center",
                fontSize: "9.5pt",
                fontWeight: 600,
                letterSpacing: "0.28em",
              }}
            >
              东 莞 沐 茵 丝 工 艺 品 有 限 公 司
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const PRINT_INFO_TH: React.CSSProperties = {
  ...TH_STYLE,
  width: "58px",
  whiteSpace: "nowrap",
  textAlign: "center",
};

function PrintInfoTable({
  rows,
}: {
  rows: Array<{ label: string; value: React.ReactNode }>;
}) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <tbody>
        {rows.map(({ label, value }) => (
          <tr key={label}>
            <th style={PRINT_INFO_TH}>{label}</th>
            <td
              style={{
                ...BASE_CELL,
                textAlign: "left",
                padding: "2px 4px",
                wordBreak: "break-all",
              }}
            >
              {value || "—"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PrintNeedleFigure({
  title,
  svg,
  boxed = true,
}: {
  title: string;
  svg?: string;
  boxed?: boolean;
}) {
  const previewSvg = svg?.trim() ? normalizeSvgForPrintBox(svg) : "";
  const aspectRatio = getSvgAspectRatio(svg || "");
  // A4 可打印内容宽度接近 190mm，这里用接近实际预览宽度的像素基准来估算高度，
  // 让图优先按整栏宽度铺开，而不是只给一个过小的默认高度。
  const targetWidthPx = boxed ? 680 : 720;
  const figureHeight = Math.max(
    180,
    Math.min(460, targetWidthPx / aspectRatio),
  );
  const [rect, setRect] = useState(() => ({
    x: 0,
    y: 0,
    w: targetWidthPx,
    h: figureHeight,
  }));

  useEffect(() => {
    setRect({
      x: 0,
      y: 0,
      w: targetWidthPx,
      h: figureHeight,
    });
  }, [targetWidthPx, figureHeight, svg]);

  function startDrag(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const { x, y } = rect;
    function onMove(ev: MouseEvent) {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      setRect((prev) => ({ ...prev, x: x + dx, y: y + dy }));
    }
    function onUp() {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  function startResize(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const { w, h } = rect;
    function onMove(ev: MouseEvent) {
      const dw = ev.clientX - startX;
      const dh = ev.clientY - startY;
      setRect((prev) => ({
        ...prev,
        w: Math.max(120, w + dw),
        h: Math.max(120, h + dh),
      }));
    }
    function onUp() {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  return (
    <div>
      <div style={SECTION_HEADER}>{title}</div>
      <div
        style={{
          border: boxed ? "1px solid #000" : "none",
          padding: boxed ? "2mm" : 0,
          minHeight: `${Math.max(figureHeight, rect.y + rect.h)}px`,
          boxSizing: "border-box",
          background: "#fff",
          position: "relative",
        }}
      >
        {previewSvg ? (
          <div
            style={{
              position: "absolute",
              left: rect.x,
              top: rect.y,
              width: rect.w,
              height: rect.h,
              background: "#fff",
              cursor: "move",
            }}
            onMouseDown={(e) => {
              const target = e.target as HTMLElement;
              const handle = target.closest("[data-resize-handle='true']");
              if (handle) return;
              startDrag(e);
            }}
          >
            <InlineSvg svg={previewSvg} height="100%" />
            <div
              className="psp-no-print"
              data-resize-handle="true"
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
              onMouseDown={startResize}
              title="拖动缩放图示"
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  background: "#aab",
                  borderRadius: 3,
                  opacity: 0.7,
                }}
              />
            </div>
          </div>
        ) : (
          <div style={{ color: "#888", fontSize: "10pt", padding: "8px" }}>暂无图示</div>
        )}
      </div>
    </div>
  );
}

function PrintHighNeedleTable({
  rows,
}: {
  rows: 高针指示单Frontend["机器规格清单_高针图"];
}) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          <th style={TH_STYLE}>档位</th>
          <th style={TH_STYLE}>毛长</th>
          <th style={TH_STYLE}>D</th>
          <th style={TH_STYLE}>M</th>
          <th style={TH_STYLE}>L</th>
          <th style={TH_STYLE}>形态</th>
          <th style={TH_STYLE}>管径Φ</th>
          <th style={TH_STYLE}>方向</th>
          <th style={TH_STYLE}>备注</th>
        </tr>
      </thead>
      <tbody>
        {rows.length > 0 ? (
          rows.map((row, idx) => (
            <tr key={`${row.档位}-${idx}`}>
              <TD>{row.档位 || "—"}</TD>
              <TD>{格式化四分之一分数(row.毛长)}</TD>
              <TD>{row.长度.D ?? "—"}</TD>
              <TD>{row.长度.M ?? "—"}</TD>
              <TD>{row.长度.L ?? "—"}</TD>
              <TD>{row.形态 || "—"}</TD>
              <TD>{row.管径 ?? "—"}</TD>
              <TD>{row.方向 || "—"}</TD>
              <TD style={{ ...BASE_CELL, textAlign: "left", padding: "2px 4px" }}>
                {row.备注 || "—"}
              </TD>
            </tr>
          ))
        ) : (
          <tr>
            <TD cs={9}>暂无机器规格清单（高针图版）</TD>
          </tr>
        )}
      </tbody>
    </table>
  );
}

function PrintHandWovenTable({
  rows,
}: {
  rows: 手织指示单Frontend["人工规格清单_手织图"];
}) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          <th style={TH_STYLE}>档位</th>
          <th style={TH_STYLE}>整毛</th>
          <th style={TH_STYLE}>毛长</th>
          <th style={TH_STYLE}>D</th>
          <th style={TH_STYLE}>M</th>
          <th style={TH_STYLE}>L</th>
          <th style={TH_STYLE}>备注</th>
        </tr>
      </thead>
      <tbody>
        {rows.length > 0 ? (
          rows.map((row, idx) => (
            <tr key={`${row.档位}-${idx}`}>
              <TD>{row.档位 || "—"}</TD>
              <TD>{row.整长 ?? "—"}</TD>
              <TD>{格式化四分之一分数(row.毛长)}</TD>
              <TD>{row.重量.D ?? "—"}</TD>
              <TD>{row.重量.M ?? "—"}</TD>
              <TD>{row.重量.L ?? "—"}</TD>
              <TD style={{ ...BASE_CELL, textAlign: "left", padding: "2px 4px" }}>
                {row.位置 || "—"}
              </TD>
            </tr>
          ))
        ) : (
          <tr>
            <TD cs={7}>暂无人工规格清单（手织图版）</TD>
          </tr>
        )}
      </tbody>
    </table>
  );
}

function PrintHighNeedleDoc({ data }: { data: 高针指示单Frontend }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
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
        高针指示单
      </div>
      <PrintInfoTable
        rows={[
          { label: "样品编号", value: data.title.样品编号 },
          { label: "客户编号", value: data.title.客户编号 },
          { label: "品名", value: data.title.品名 },
          { label: "尺寸", value: data.title.尺寸 },
          { label: "原料", value: data.title.原料 },
          { label: "CAP", value: data.title.CAP },
          { label: "重量", value: `${data.title.重量 ?? "—"}` },
        ]}
      />
      <div style={SECTION_HEADER}>机器规格清单（高针图版）</div>
      <PrintHighNeedleTable rows={data.机器规格清单_高针图} />
      <div>
        <div style={SECTION_HEADER}>注意事项</div>
        <div
          style={{
            ...BASE_CELL,
            minHeight: "14mm",
            whiteSpace: "pre-line",
            textAlign: "left",
          }}
        >
          {data.注意事项 || "—"}
        </div>
      </div>
      <PrintNeedleFigure
        title="高针图"
        svg={data.高针图svg || data.高针图数据?.底图?.svg || ""}
      />
    </div>
  );
}

function PrintHandWovenDoc({ data }: { data: 手织指示单Frontend }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
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
        手织指示单
      </div>
      <PrintInfoTable
        rows={[
          { label: "样品编号", value: data.title.样品编号 },
          { label: "客户编号", value: data.title.客户编号 },
          { label: "品名", value: data.title.品名 },
          { label: "尺寸", value: data.title.尺寸 },
          { label: "原材料", value: data.title.原材料 },
          { label: "颜色编号", value: data.title.颜色编号 },
          { label: "CAP", value: data.title.CAP },
          { label: "重量", value: `${data.title.重量}g` },
        ]}
      />
      <div style={SECTION_HEADER}>人工规格清单（手织图版）</div>
      <PrintHandWovenTable rows={data.人工规格清单_手织图} />
      <PrintNeedleFigure
        title="手织图"
        svg={data.手织图片}
        boxed={false}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page component
// ─────────────────────────────────────────────────────────────────────────────
export default function PrintSpecPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [file, setFile] = useState<沐茵丝假发成品稿Frontend | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [order, setOrder] = useState<ModuleId[]>(DEFAULT_ORDER);
  const [dragSrc, setDragSrc] = useState<ModuleId | null>(null);
  const [dragOver, setDragOver] = useState<ModuleId | null>(null);
  const [zoom, setZoom] = useState(0.9);

  useEffect(() => {
    if (!id) return;
    callApi("admin/file/GetDetail", { id }).then((res) => {
      if (res.isSucc) {
        setFile(res.res.file);
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
    if (!file) return null;
    const spec = file.制品规格书;
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

  if (fetchError || !file) {
    return (
      <div style={{ padding: "32px", color: "#c00", fontSize: "14px" }}>
        加载失败：{fetchError || "未找到稿件数据"}
      </div>
    );
  }

  const spec = file.制品规格书;

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
          background: "#111827",
          color: "#fff",
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          fontSize: "13px",
          boxShadow: "0 2px 10px rgba(0,0,0,0.25)",
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
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontWeight: 700, letterSpacing: "0.04em" }}>打印预览</span>
          <span style={{ color: "#9ca3af", fontSize: "12px" }}>
            A4 竖版 · 8mm 页边距 · 拖动手柄调整区块顺序
          </span>
        </div>
        <div style={{ flex: 1 }} />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 999,
            padding: "4px 6px",
            background: "rgba(255,255,255,0.04)",
          }}
        >
          {[0.8, 0.9, 1].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setZoom(value)}
              style={{
                border: "none",
                borderRadius: 999,
                padding: "4px 8px",
                cursor: "pointer",
                fontSize: "12px",
                color: zoom === value ? "#111827" : "#e5e7eb",
                background: zoom === value ? "#fff" : "transparent",
                fontWeight: 600,
              }}
            >
              {Math.round(value * 100)}%
            </button>
          ))}
        </div>
        <button
          onClick={() => window.print()}
          style={{
            background: "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "8px 18px",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 600,
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.12)",
          }}
        >
          🖨 打印 / 导出 PDF
        </button>
      </div>

      {/* ── A4 canvas wrapper ── */}
      <div
        className="psp-canvas"
        style={{
          background: "linear-gradient(180deg, #d1d5db 0%, #c7ccd4 100%)",
          padding: "28px 16px 40px",
          minHeight: "calc(100vh - 44px)",
        }}
      >
        <PaperPreviewCard
          zoom={zoom}
          pageTitle="制品规格书"
          pageSubTitle={spec.title.样品编号 || id}
        >
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

          <div style={{ flex: 1 }}>
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
                {renderModule(key)}
              </div>
            ))}
          </div>
        </PaperPreviewCard>

        <PaperPreviewCard
          zoom={zoom}
          pageTitle="高针指示单"
          pageSubTitle={file.高针指示单.title.样品编号 || id}
        >
          <PrintHighNeedleDoc data={file.高针指示单} />
        </PaperPreviewCard>

        <PaperPreviewCard
          zoom={zoom}
          pageTitle="手织指示单"
          pageSubTitle={file.手织指示单.title.样品编号 || id}
        >
          <PrintHandWovenDoc data={file.手织指示单} />
        </PaperPreviewCard>
      </div>
    </>
  );
}
