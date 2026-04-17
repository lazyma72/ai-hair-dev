import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageShell from "../../../components/PageShell";
import type { Db胶丝比例 } from "../../../shared/db/Db胶丝比例";
import type { 沐茵丝假发成品稿 } from "../../../shared/db/Db沐茵丝假发成品稿";
import { 假发类型 } from "../../../shared/db/Db沐茵丝假发成品稿";
import { emptyFile } from "../../admin/add-file/defaults";
import 规格书View from "../../file/sections/规格书View";
import 手织指示单View from "../../file/sections/手织指示单View";
import 高针指示单View from "../../file/sections/高针指示单View";
import { to制品规格书Frontend } from "../../../shared/frontend/converters/to制品规格书Frontend";
import { to手织指示单Frontend } from "../../../shared/frontend/converters/to手织指示单Frontend";
import { to高针指示单Frontend } from "../../../shared/frontend/converters/to高针指示单Frontend";
import { createEmpty手织图 } from "../../../modules/highNeedleAnnotator/types";
import HighNeedleImportStep from "./components/HighNeedleImportStep";

const STEPS = ["选择文件", "导入高针图", "导入手织图", "预览"] as const;
const PREVIEW_TABS = [
  { key: "规格书", label: "制品规格书" },
  { key: "高针指示单", label: "高针指示单" },
  { key: "手织指示单", label: "手织指示单" },
] as const;
type PreviewTabKey = (typeof PREVIEW_TABS)[number]["key"];
type StepIndex = 0 | 1 | 2 | 3;

type UploadCardProps = {
  title: string;
  accept: string;
  fileName: string;
  hint: string;
  onFileSelect: (file: File) => void;
};

type HatMakingOption = {
  _id: string;
  帽围: number;
  帽深: number;
  前后: number;
};

const DEMO_RATIO_LIST: Db胶丝比例[] = [
  {
    _id: {
      颜色编号: "TT6/1062",
      发丝种类: "HL+FU",
    },
    线色: "8#",
    D: [
      { 发丝种类: "HL", 色号: "8#", 比例: 50 },
      { 发丝种类: "FU", 色号: "8#", 比例: 50 },
    ],
  },
];

const DEMO_HAT_MAKING: HatMakingOption = {
  _id: "P-025",
  帽围: 58,
  帽深: 36,
  前后: 37,
};

function Stepper({ step }: { step: number }) {
  return (
    <div className="flex flex-wrap gap-2">
      {STEPS.map((label, i) => (
        <div
          key={label}
          className={
            i === step
              ? "rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white"
              : i < step
                ? "rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700"
                : "rounded-full bg-white px-3 py-1 text-xs text-slate-400 ring-1 ring-slate-200"
          }
        >
          {i + 1}. {label}
        </div>
      ))}
    </div>
  );
}

function UploadCard({
  title,
  accept,
  fileName,
  hint,
  onFileSelect,
}: UploadCardProps) {
  return (
    <label className="block cursor-pointer rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 transition hover:border-slate-400 hover:bg-white">
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      <div className="mt-1 text-xs text-slate-500">{hint}</div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="rounded bg-slate-900 px-3 py-1.5 text-xs font-medium text-white">
          点击上传文件
        </span>
        <span className="text-[11px] text-slate-400">
          {fileName ? "已选择" : "未选择"}
        </span>
      </div>

      <div className="mt-3 truncate rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
        {fileName || "请选择文件"}
      </div>

      <input
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          onFileSelect(file);
          e.target.value = "";
        }}
      />
    </label>
  );
}

function buildDemoFile(params: {
  excelFileName: string;
  highNeedle图: 沐茵丝假发成品稿["高针指示单"]["高针图"];
  handWovenSvg: string;
}): 沐茵丝假发成品稿 {
  const guess = params.excelFileName.replace(/\.(xlsx|xls|csv)$/i, "");
  const file = emptyFile();

  return {
    ...file,
    _id: guess || "XM-6190(L)",
    假发类型: 假发类型.纯色,
    客户编号: "XM",
    品名: "Michelle BB TBOB080",
    原材料: "FU:50%+HL:50%",
    CAP: "P-025(侧分雪花网L)",
    制品规格书: {
      ...file.制品规格书,
      胶丝比例id: { 颜色编号: "TT6/1062", 发丝种类: "HL+FU" },
      制帽: {
        唛头: "2个标",
        编号: "P-025",
      } as unknown as 沐茵丝假发成品稿["制品规格书"]["制帽"],
      工艺说明: {
        作业方法: '本规格书为 "TT6/1062#" 作业',
        整毛: "按 MIX 比例各整毛计量。",
        双针: "毛长准确，密度均匀。",
        美容: "98°C * 70 分，尾部烫一个曲度。",
        制帽: "P-025(侧分雪花网L)",
        手织: "按图作业。",
        高针: "按图作业。",
        完成: "拆剪干净，处理手感。",
        包装: "按标准包装执行。",
      },
      工程重量: {
        整毛: { 加减: 10 },
        双针: { 加减: 20 },
        美容: { 加减: 5 },
        制帽: { 加减: 15 },
        高针: { 加减: 8 },
        手织: { 加减: 12 },
        剪驳: { 加减: -3 },
        发网: { 加减: 2 },
      },
      机器规格清单: [
        {
          档位: "1",
          裁断与重量: [
            { 裁断: 6.5, 重量g: { D: 25, M: 26, L: 27 } },
            { 裁断: 8, 重量g: { D: 30, M: 31, L: 32 } },
          ],
          整毛: { 拉尖: 6.5, 对裁: 7 },
          双针: { 毛长: 8, 尺数: { D: 15, M: 16, L: 17 }, 密度: 110 },
          形态: "直发",
          美容: { 铝管: 6, 方向: "后顺", 层数: 3 },
          备注: "Demo 机器规格 1",
        },
        {
          档位: "2",
          裁断与重量: [{ 裁断: 10, 重量g: { D: 35, M: 36, L: 37 } }],
          整毛: { 拉尖: 7, 对裁: 7.5 },
          双针: { 毛长: 10, 尺数: { D: 18, M: 19, L: 20 }, 密度: 120 },
          形态: "微卷",
          美容: { 铝管: 8, 方向: "侧顺", 层数: 2 },
          备注: "Demo 机器规格 2",
        },
      ],
      人工规格清单: [
        {
          档位: "H1",
          裁断与重量: [{ 裁断: 12, 重量g: { D: 18, M: 19, L: 20 } }],
          整毛: { 拉尖: 5.5, 对裁: 6 },
          双针: { 毛长: 12, 磅发: 15, 密度: 1 },
          形态: "顺直",
          美容: { 铝管: 6 },
          备注: "Demo 手工规格 1",
          位置: "前额",
        },
      ],
    },
    高针指示单: {
      注意事项: "高针：1. 高针后帽子不能变形。",
      高针图: params.highNeedle图,
    },
    手织指示单: {
      注意事项: "手织：1. 手织后帽子不能变形。",
      手织图: createEmpty手织图(params.handWovenSvg),
    },
  };
}

export default function ImportExcelWizardPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<StepIndex>(0);
  const [previewTab, setPreviewTab] = useState<PreviewTabKey>("规格书");
  const [excelFileName, setExcelFileName] = useState<string>("");
  const [highNeedleFileName, setHighNeedleFileName] = useState<string | null>(null);
  const [handWovenFileName, setHandWovenFileName] = useState<string>("");
  const [highNeedle图, setHighNeedle图] = useState(
    () => emptyFile().高针指示单.高针图,
  );
  const [handWovenSvg, setHandWovenSvg] = useState<string>("");

  const canGoNext =
    step === 0
      ? Boolean(excelFileName.trim())
      : step === 1
        ? Boolean(highNeedle图.底图.svg.trim())
        : step === 2
          ? Boolean(handWovenSvg.trim())
          : true;
  const demoFile = useMemo(
    () =>
      buildDemoFile({
        excelFileName,
        highNeedle图,
        handWovenSvg,
      }),
    [excelFileName, handWovenSvg, highNeedle图],
  );
  const 规格书数据 = useMemo(
    () =>
      (to制品规格书Frontend as unknown as (
        稿: 沐茵丝假发成品稿,
        胶丝比例: Db胶丝比例,
        制帽: HatMakingOption,
      ) => ReturnType<typeof to制品规格书Frontend>)(
        demoFile,
        DEMO_RATIO_LIST[0],
        DEMO_HAT_MAKING,
      ),
    [demoFile],
  );
  const 高针数据 = useMemo(() => to高针指示单Frontend(demoFile), [demoFile]);
  const 手织数据 = useMemo(() => to手织指示单Frontend(demoFile), [demoFile]);

  return (
    <PageShell
      title="导入 Excel（Demo）"
      onBack={() => navigate("/designs/create")}
      fullWidth={step === 1}
      actions={
        <div className="flex items-center gap-2">
          {step > 0 ? (
            <button
              type="button"
              className="rounded bg-slate-100 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-200"
              onClick={() => setStep((s) => ((s - 1) as StepIndex))}
            >
              上一步
            </button>
          ) : null}
          {step < 3 ? (
            <button
              type="button"
              disabled={!canGoNext}
              className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => setStep((s) => ((s + 1) as StepIndex))}
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
            这是静态 Demo：不解析 Excel 内容。Excel 仅用文件名生成样品编号。
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-1">
            <UploadCard
              title="Excel"
              accept=".xlsx,.xls,.csv"
              fileName={excelFileName}
              hint="支持 .xlsx / .xls / .csv"
              onFileSelect={(file) => {
                setExcelFileName(file.name);
              }}
            />
          </div>

          <div className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
            当前状态：
            <span className="ml-2">
              Excel {excelFileName ? "已选择" : "未选择"}
            </span>
          </div>
        </div>
      ) : null}

      {step === 1 ? (
        <HighNeedleImportStep
          description="请选择高针图 SVG 文件，并在当前页面完成标注；下一步将进入手织图导入。"
          value={highNeedle图}
          onChange={setHighNeedle图}
          fileName={highNeedleFileName}
          onFileNameChange={setHighNeedleFileName}
          fullscreen
        />
      ) : null}

      {step === 2 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-sm font-semibold text-slate-900">导入手织图</div>
          <div className="mt-1 text-xs text-slate-500">
            请选择手织图 SVG 文件，下一步将进入预览。
          </div>

          <div className="mt-4">
            <UploadCard
              title="手织图 SVG"
              accept=".svg"
              fileName={handWovenFileName}
              hint="点击上传手织图 SVG"
              onFileSelect={(file) => {
                setHandWovenFileName(file.name);
                const reader = new FileReader();
                reader.onload = () => setHandWovenSvg(String(reader.result ?? ""));
                reader.readAsText(file);
              }}
            />
          </div>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  预览设计稿（Demo 假数据）
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  Excel 仅使用文件名生成样品编号；规格书/重量/工艺说明等内容均为写死示例数据。
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {PREVIEW_TABS.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    className={
                      key === previewTab
                        ? "rounded bg-slate-900 px-3 py-1.5 text-sm text-white"
                        : "rounded bg-slate-100 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-200"
                    }
                    onClick={() => setPreviewTab(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {previewTab === "规格书" ? <规格书View data={规格书数据} /> : null}
          {previewTab === "高针指示单" ? <高针指示单View data={高针数据} /> : null}
          {previewTab === "手织指示单" ? <手织指示单View data={手织数据} /> : null}

          <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-500">
            当前仅为导入流程 Demo：可用于验收“选择文件 → 导入高针图 → 导入手织图 → 预览”的交互。正式落库逻辑仍建议走“手动上传设计稿”。
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}
