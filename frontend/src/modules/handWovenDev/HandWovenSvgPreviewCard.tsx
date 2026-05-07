import DownloadSvgButton from "../../components/DownloadSvgButton";
import InlineSvg from "../../components/InlineSvg";

type Props = {
  svg: string;
  title?: string;
  filename?: string;
  emptyText?: string;
  minHeightClassName?: string;
};

export default function HandWovenSvgPreviewCard({
  svg,
  title = "手织图 SVG",
  filename = "hand-woven.svg",
  emptyText = "暂未生成可预览的手织图 SVG。",
  minHeightClassName = "min-h-[200px]",
}: Props) {
  const previewSvg = svg.trim();

  if (!previewSvg) {
    return (
      <div>
        <div className="mb-1 text-xs font-medium text-slate-700">{title}</div>
        <div className="rounded border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
          {emptyText}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3">
        <div className="text-xs font-medium text-slate-700">{title}</div>
        <DownloadSvgButton svg={previewSvg} filename={filename} />
      </div>
      <div className="overflow-hidden rounded border border-slate-100 bg-white">
        <InlineSvg
          svg={previewSvg}
          className={`${minHeightClassName} w-full overflow-auto bg-white p-3`}
          height="auto"
        />
      </div>
    </div>
  );
}