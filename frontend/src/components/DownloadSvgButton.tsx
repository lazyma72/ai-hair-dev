type Props = {
  svg: string;
  filename: string;
  className?: string;
};

function sanitizeFilename(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, "_").trim() || "download.svg";
}

export default function DownloadSvgButton({
  svg,
  filename,
  className,
}: Props) {
  const disabled = !svg.trim();

  return (
    <button
      type="button"
      disabled={disabled}
      className={
        className ??
        "rounded border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      }
      onClick={() => {
        if (!svg.trim()) return;
        const blob = new Blob([svg], {
          type: "image/svg+xml;charset=utf-8",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = sanitizeFilename(filename);
        a.click();
        URL.revokeObjectURL(url);
      }}
    >
      下载 SVG
    </button>
  );
}
