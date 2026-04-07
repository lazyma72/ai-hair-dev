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
import DOMPurify from "dompurify";

type Props = {
  svg: string;
  className?: string;
  height?: number | string;
};

export default function InlineSvg({ svg, className, height = 200 }: Props) {
  const clean = DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true } });
  return (
    <div
      className={className}
      style={{ height, overflow: "hidden" }}
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: clean }}
    />
  );
}
