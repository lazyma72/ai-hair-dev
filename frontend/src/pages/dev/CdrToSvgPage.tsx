import * as React from "react";
import { message } from "antd";
import InlineSvg from "../../components/InlineSvg";
import PageShell from "../../components/PageShell";
import { callApi } from "../../api/callApi";

export default function CdrToSvgPage() {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [selectedFileName, setSelectedFileName] = React.useState("");
  const [svg, setSvg] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".cdr")) {
      message.error("请选择 .cdr 文件");
      return;
    }

    setSelectedFileName(file.name);
    setLoading(true);

    try {
      const fileData = new Uint8Array(await file.arrayBuffer());
      const result = await callApi("CdrToSvg", {
        fileData,
        fileName: file.name,
        dirName: "dev",
      });

      if (!result.isSucc) {
        throw new Error(result.err.message || "CDR 转 SVG 失败");
      }

      setSvg(result.res.svg);
      message.success("CDR 转 SVG 成功");
    } catch (error) {
      const errMsg =
        error instanceof Error ? error.message : "CDR 转 SVG 失败";
      setSvg("");
      message.error(errMsg);
    } finally {
      setLoading(false);
    }
  }

  function resetAll() {
    setSelectedFileName("");
    setSvg("");
    setLoading(false);
  }

  return (
    <PageShell
      title="CDR 转 SVG 测试页面"
      onBack={() => window.history.back()}
      actions={<div className="text-xs text-slate-500">入口：/test/cdr-to-svg</div>}
      fullWidth
    >
      <div className="grid gap-4 xl:grid-cols-[380px,minmax(0,1fr)]">
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <div className="text-sm font-semibold text-slate-900">
              上传 CDR 文件
            </div>
            <div className="mt-1 text-xs leading-5 text-slate-500">
              选择 `.cdr` 文件后会调用后端 `CdrToSvg` 接口，并在右侧直接预览返回的
              SVG 内容。
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="rounded border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
            >
              {loading ? "转换中..." : "选择 CDR 文件"}
            </button>
            <button
              type="button"
              className="rounded border border-slate-200 px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={resetAll}
              disabled={loading && !svg}
            >
              重置
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".cdr"
            className="hidden"
            onChange={handleFileChange}
          />

          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <div className="font-medium text-slate-900">当前文件</div>
            <div className="mt-1 break-all text-xs text-slate-500">
              {selectedFileName || "未选择文件"}
            </div>
          </div>

          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-500">
            如果页面提示 `服务器未安装 uniconvertor`，说明当前后端环境还未具备
            CDR 转换依赖，需要先安装 `uniconvertor`。
          </div>
        </section>

        <section className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  SVG 预览
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  转换成功后会在这里展示 SVG。
                </div>
              </div>
              {svg ? (
                <div className="text-xs text-slate-400">
                  返回字符数：{svg.length}
                </div>
              ) : null}
            </div>

            {svg ? (
              <div className="overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-4">
                <InlineSvg svg={svg} height={560} className="min-w-[720px]" />
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-20 text-center text-sm text-slate-500">
                请选择一个 `.cdr` 文件开始转换。
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 text-sm font-semibold text-slate-900">
              SVG 源码
            </div>
            <textarea
              className="h-80 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-mono text-xs leading-5 text-slate-700 outline-none focus:border-slate-300"
              value={svg}
              onChange={(event) => setSvg(event.target.value)}
              placeholder="转换完成后，这里会显示返回的 SVG 字符串。"
            />
          </div>
        </section>
      </div>
    </PageShell>
  );
}
