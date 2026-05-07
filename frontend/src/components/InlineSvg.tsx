/**
 * InlineSvg — 安全渲染内联 SVG 字符串
 *
 * 使用 DOMPurify 清理 SVG 内容，防止 XSS 注入。
 *
 * 用法：
 *   <InlineSvg svg={svgString} height={200} />
 *
 * 注意：需要安装 dompurify：npm install dompurify @types/dompurify
 */
import * as React from "react";
import DOMPurify from "dompurify";

type Props = {
  svg: string;
  className?: string;
  height?: number | string;
  style?: React.CSSProperties;
  fitWidth?: boolean;
};

function normalizeSvgForFitWidth(svg: string): string {
  if (!svg.trim()) return svg;
  return svg.replace(/<svg\b([^>]*)>/i, (_, attrs: string) => {
    const cleaned = attrs
      .replace(/\swidth=["'][^"']*["']/gi, "")
      .replace(/\sheight=["'][^"']*["']/gi, "")
      .replace(/\spreserveAspectRatio=["'][^"']*["']/gi, "");
    return `<svg${cleaned} width="100%" preserveAspectRatio="xMidYMid meet">`;
  });
}

export default function InlineSvg({
  svg,
  className,
  height = 200,
  style,
  fitWidth = false,
}: Props) {
  // DOMPurify's SVG profile is conservative and may drop some SVG text layout
  // attributes (e.g. `dominant-baseline`) which are needed to keep label
  // alignment consistent with exported SVGs.
  const source = fitWidth ? normalizeSvgForFitWidth(svg) : svg;
  const clean = DOMPurify.sanitize(source, {
    USE_PROFILES: { svg: true },
    ADD_ATTR: [
      // text layout
      "dominant-baseline",
      "alignment-baseline",
      "baseline-shift",
      "text-anchor",
      // font
      "font-family",
      "font-size",
      "font-weight",
      "letter-spacing",
    ],
  });
  return (
    <div
      className={className}
      style={{ height, overflow: "visible", width: "100%", ...style }}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
