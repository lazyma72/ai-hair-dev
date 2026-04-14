import * as React from "react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import InlineSvg from "../../../components/InlineSvg";
import PageShell from "../../../components/PageShell";

const STEPS = ["选择文件", "预览基本信息"] as const;

function Stepper({ step }: { step: number }) {
  return (
    <div className="flex flex-wrap gap-2">
      {STEPS.map((label, i) => (
        <div
          key={label}
          className={
            i === step
              ? "rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white"
              : "rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700"
          }
        >
          {i + 1}. {label}
        </div>
      ))}
    </div>
  );
}

export default function ImportExcelWizardPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [excelFileName, setExcelFileName] = useState<string>("");
  const [highNeedleSvg, setHighNeedleSvg] = useState<string>("");
  const [handWovenSvg, setHandWovenSvg] = useState<string>("");

  const baseInfo = useMemo(() => {
    const guess = excelFileName.replace(/\.(xlsx|xls|csv)$/i, "");
    return {
      样品编号: guess || "XM-6190(L)",
      客户编号: "XM",
      品名: "Michelle BB TBOB080",
      原材料: "FU:50%+HL:50%",
      CAP: "P-025(侧分雪花网L)",
    };
  }, [excelFileName]);

  return (
    <PageShell
      title="导入 Excel（Demo）"
      onBack={() => navigate("/designs/create")}
      actions={
        <div className="flex items-center gap-2">
          {step > 0 ? (
            <button
              type="button"
              className="rounded bg-slate-100 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-200"
              onClick={() => setStep(0)}
            >
              上一步
            </button>
          ) : null}
          {step === 0 ? (
            <button
              type="button"
              className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
              onClick={() => setStep(1)}
            >
              下一步
            </button>
          ) : null}
        </div>
      }
    >
      <Stepper step={step} />

      {step === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-sm font-semibold text-slate-900">选择文件</div>
          <div className="mt-1 text-xs text-slate-500">
            这是静态 Demo：不解析 Excel 内容，仅用文件名自动填充一份“基本信息预览”。
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <div>
              <div className="text-xs font-medium text-slate-700">Excel</div>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="mt-2 w-full"
                onChange={(e) =>
                  setExcelFileName(e.target.files?.[0]?.name ?? "")
                }
              />
              <div className="mt-2 text-xs text-slate-500">
                {excelFileName || "未选择"}
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-slate-700">高针图 SVG</div>
              <input
                type="file"
                accept=".svg"
                className="mt-2 w-full"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => setHighNeedleSvg(String(reader.result ?? ""));
                  reader.readAsText(file);
                }}
              />
            </div>

            <div>
              <div className="text-xs font-medium text-slate-700">手织图 SVG</div>
              <input
                type="file"
                accept=".svg"
                className="mt-2 w-full"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => setHandWovenSvg(String(reader.result ?? ""));
                  reader.readAsText(file);
                }}
              />
            </div>
          </div>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-semibold text-slate-900">基本信息预览</div>
            <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
              <div>
                <span className="text-slate-400">样品编号：</span>
                <span className="font-mono">{baseInfo.样品编号}</span>
              </div>
              <div>
                <span className="text-slate-400">客户编号：</span>
                <span className="font-mono">{baseInfo.客户编号}</span>
              </div>
              <div>
                <span className="text-slate-400">品名：</span>
                {baseInfo.品名}
              </div>
              <div>
                <span className="text-slate-400">原材料：</span>
                {baseInfo.原材料}
              </div>
              <div>
                <span className="text-slate-400">CAP：</span>
                {baseInfo.CAP}
              </div>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold text-slate-700">高针图预览</div>
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                {highNeedleSvg ? (
                  <InlineSvg svg={highNeedleSvg} height={320} className="w-full" />
                ) : (
                  <div className="py-24 text-center text-xs text-slate-400">
                    未选择
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold text-slate-700">手织图预览</div>
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                {handWovenSvg ? (
                  <InlineSvg svg={handWovenSvg} height={320} className="w-full" />
                ) : (
                  <div className="py-24 text-center text-xs text-slate-400">
                    未选择
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500">
            下一步如需落库，可在“手动上传设计稿”向导中完成保存逻辑；本页面按需求保持静态 Demo。
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}
