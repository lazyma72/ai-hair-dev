import * as React from "react";
import { message } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { callApi } from "../../api/callApi";
import PageShell from "../../components/PageShell";
import 规格书View from "../file/sections/规格书View";
import 手织指示单View from "../file/sections/手织指示单View";
import 高针指示单View from "../file/sections/高针指示单View";
import type {
  制品规格书,
  沐茵丝假发成品稿,
} from "../../shared/db/Db沐茵丝假发成品稿";
import type { DbCustomer } from "../../shared/db/DbCustomer";
import type { 胶丝比例ListItem } from "../../shared/frontend/model/model";
import { to制品规格书Frontend } from "../../shared/frontend/converters/to制品规格书Frontend";
import { to手织指示单Frontend } from "../../shared/frontend/converters/to手织指示单Frontend";
import { to高针指示单Frontend } from "../../shared/frontend/converters/to高针指示单Frontend";
import { emptyFile } from "./add-file/defaults";
import { validate染色档位列表 } from "./add-file/components/DyeLevelEditor";
import BasicInfoSection from "./add-file/sections/BasicInfoSection";
import CapSpecSection from "./add-file/sections/CapSpecSection";
import DyeLevelsSection from "./add-file/sections/DyeLevelsSection";
import EngineeringWeightSection from "./add-file/sections/EngineeringWeightSection";
import HandWovenSection from "./add-file/sections/HandWovenSection";
import HighNeedleSection from "./add-file/sections/HighNeedleSection";
import MachineSpecSection from "./add-file/sections/MachineSpecSection";
import ManualSpecSection from "./add-file/sections/ManualSpecSection";
import ProcessNotesSection from "./add-file/sections/ProcessNotesSection";
import RatioSection from "./add-file/sections/RatioSection";

function normalizeName(s: string): string {
  return s.trim();
}

const MAX_CUT_WEIGHT_ITEMS = 3;
const STEPS = ["导入数据", "导入高针图", "导入手织图", "预览"] as const;
type StepIndex = 0 | 1 | 2 | 3;
const PREVIEW_TABS = [
  { key: "规格书", label: "制品规格书" },
  { key: "高针指示单", label: "高针指示单" },
  { key: "手织指示单", label: "手织指示单" },
] as const;
type PreviewTabKey = (typeof PREVIEW_TABS)[number]["key"];

function Stepper({ step }: { step: StepIndex }) {
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

export default function AddFilePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState<沐茵丝假发成品稿>(emptyFile);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<StepIndex>(0);
  const [previewTab, setPreviewTab] = useState<PreviewTabKey>("规格书");
  const [ratioList, setRatioList] = useState<胶丝比例ListItem[]>([]);
  const [customerList, setCustomerList] = useState<DbCustomer[]>([]);

  useEffect(() => {
    callApi("admin/ratio/GetList", {
      pageNum: 1,
      pageSize: 1000,
      orderSort: "asc",
    }).then((r) => {
      if (r.isSucc) setRatioList(r.res.list);
    });

    callApi("admin/customer/GetList", {}).then((r) => {
      if (r.isSucc) setCustomerList(r.res.list);
    });
  }, []);

  const 发丝种类选项 = useMemo(
    () => [...new Set(ratioList.map((r) => r.发丝种类))].sort(),
    [ratioList],
  );

  const 当前发丝种类颜色编号列表 = useMemo(
    () =>
      ratioList
        .filter((r) => r.发丝种类 === form.制品规格书.胶丝比例id.发丝种类)
        .map((r) => r._id),
    [ratioList, form.制品规格书.胶丝比例id.发丝种类],
  );

  const 全部档位名 = useMemo(() => {
    const 机器 = form.制品规格书.机器规格清单
      .map((d) => normalizeName(d.档位))
      .filter(Boolean);
    const 人工 = form.制品规格书.人工规格清单
      .map((d) => normalizeName(d.档位))
      .filter(Boolean);
    return [...机器, ...人工];
  }, [form.制品规格书.机器规格清单, form.制品规格书.人工规格清单]);

  const canGoNext =
    step === 0
      ? true
      : step === 1
        ? Boolean(form.高针指示单.高针图.底图.svg.trim())
        : step === 2
          ? Boolean(form.手织指示单.手织图.svg.trim())
          : true;

  const 规格书数据 = useMemo(
    // 预览页无需强依赖胶丝比例详情；为空则不展示胶丝比例表格
    () => to制品规格书Frontend(form, []),
    [form],
  );
  const 高针数据 = useMemo(() => to高针指示单Frontend(form), [form]);
  const 手织数据 = useMemo(() => to手织指示单Frontend(form), [form]);

  function set规格书<K extends keyof 制品规格书>(key: K, val: 制品规格书[K]) {
    setForm((f) => ({ ...f, 制品规格书: { ...f.制品规格书, [key]: val } }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const required: Array<{ name: string; value: string }> = [
      { name: "样品编号", value: form._id },
      { name: "客户编号", value: form.客户编号 },
      { name: "品名", value: form.品名 },
      { name: "原材料", value: form.原材料 },
      { name: "CAP", value: form.CAP },
    ];

    for (const f of required) {
      if (!f.value.trim()) {
        const msg = `${f.name}不能为空`;
        setError(msg);
        message.error(msg);
        return;
      }
    }

    const dyeCheck = validate染色档位列表(form.染色档位列表);
    if (!dyeCheck.ok) {
      setError(dyeCheck.message);
      message.error(dyeCheck.message);
      return;
    }

    const hasTooManyCutWeights = [
      ...form.制品规格书.机器规格清单,
      ...form.制品规格书.人工规格清单,
    ].some((item) => item.裁断与重量.length > MAX_CUT_WEIGHT_ITEMS);

    if (hasTooManyCutWeights) {
      const msg = `裁断重量项最多 ${MAX_CUT_WEIGHT_ITEMS} 个`;
      setError(msg);
      message.error(msg);
      return;
    }

    setError("");
    setLoading(true);
    try {
      const r = await callApi("admin/file/Add", { file: form });
      if (!r.isSucc) {
        setError(r.err.message);
        message.error(r.err.message);
        return;
      }
      message.success("保存成功");
      navigate("/admin/files");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "保存失败";
      setError(msg);
      message.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageShell
      title="添加成品稿"
      onBack={() => navigate("/admin/files")}
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
          ) : (
            <button
              type="submit"
              form="add-file-form"
              disabled={loading}
              className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? "提交中…" : "保存成品稿"}
            </button>
          )}
        </div>
      }
    >
      <Stepper step={step} />

      {error ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <form
        id="add-file-form"
        onSubmit={(e) => void handleSubmit(e)}
        className="space-y-5"
      >
        {step === 0 ? (
          <>
            <BasicInfoSection
              form={form}
              setForm={setForm}
              customerList={customerList}
            />

            <CapSpecSection
              value={form.制品规格书.制帽}
              onChange={(v) => set规格书("制帽", v)}
            />

            <RatioSection
              value={form.制品规格书.胶丝比例id}
              onChange={(v) => set规格书("胶丝比例id", v)}
              发丝种类选项={发丝种类选项}
              颜色编号选项={当前发丝种类颜色编号列表}
            />

            <EngineeringWeightSection
              value={form.制品规格书.工程重量}
              onChange={(v) => set规格书("工程重量", v)}
            />

            <MachineSpecSection
              list={form.制品规格书.机器规格清单}
              onChange={(v) => set规格书("机器规格清单", v)}
              假发类型={form.假发类型}
            />

            <ManualSpecSection
              list={form.制品规格书.人工规格清单}
              onChange={(v) => set规格书("人工规格清单", v)}
            />

            <ProcessNotesSection
              list={form.制品规格书.工艺说明}
              onChange={(v) => set规格书("工艺说明", v)}
            />

            <DyeLevelsSection
              list={form.染色档位列表}
              onChange={(v) => setForm((f) => ({ ...f, 染色档位列表: v }))}
              全部档位名={全部档位名}
            />
          </>
        ) : null}

        {step === 1 ? (
          <HighNeedleSection
            value={form.高针指示单}
            onChange={(v) => setForm((f) => ({ ...f, 高针指示单: v }))}
            showJsonImporter={false}
          />
        ) : null}

        {step === 2 ? (
          <HandWovenSection
            value={form.手织指示单}
            onChange={(v) => setForm((f) => ({ ...f, 手织指示单: v }))}
          />
        ) : null}

        {step === 3 ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">预览</div>
                  <div className="mt-1 text-xs text-slate-500">
                    预览不影响提交逻辑；点击右上角“保存成品稿”仍按原校验与接口提交。
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
          </div>
        ) : null}
      </form>
    </PageShell>
  );
}
