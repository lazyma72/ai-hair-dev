import * as React from "react";
import { message } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { callApi } from "../../../api/callApi";
import PageShell from "../../../components/PageShell";
import type { DbCustomer } from "../../../shared/db/DbCustomer";
import type { 沐茵丝假发成品稿 } from "../../../shared/db/Db沐茵丝假发成品稿";
import type { 胶丝比例ListItem } from "../../../shared/frontend/model/model";
import { emptyFile, 工艺说明Keys } from "../../admin/add-file/defaults";
import { validate染色档位列表 } from "../../admin/add-file/components/DyeLevelEditor";
import BasicInfoSection from "../../admin/add-file/sections/BasicInfoSection";
import DyeLevelsSection from "../../admin/add-file/sections/DyeLevelsSection";
import HighNeedleSection from "../../admin/add-file/sections/HighNeedleSection";
import HandWovenSection from "../../admin/add-file/sections/HandWovenSection";
import MachineSpecSection from "../../admin/add-file/sections/MachineSpecSection";
import ManualSpecSection from "../../admin/add-file/sections/ManualSpecSection";
import ProcessNotesSection from "../../admin/add-file/sections/ProcessNotesSection";
import RatioSection from "../../admin/add-file/sections/RatioSection";
import HighNeedleSvgAnnotator from "../../../modules/highNeedleAnnotator/HighNeedleSvgAnnotator";

const STEPS = ["导入数据", "导入高针图", "导入手织图"] as const;

type StepIndex = 0 | 1 | 2;

type FieldErrors = Partial<Record<string, string>>;

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

function normalizeName(s: string): string {
  return s.trim();
}

function validateStep1(form: 沐茵丝假发成品稿): FieldErrors {
  const errors: FieldErrors = {};

  const requiredStrings: Array<{ key: string; name: string; value: string }> = [
    { key: "_id", name: "样品编号", value: form._id },
    { key: "客户编号", name: "客户编号", value: form.客户编号 },
    { key: "品名", name: "品名", value: form.品名 },
    { key: "原材料", name: "原材料", value: form.原材料 },
    { key: "CAP", name: "CAP", value: form.CAP },
  ];

  for (const f of requiredStrings) {
    if (!f.value.trim()) errors[f.key] = `${f.name}不能为空`;
  }

  if (!form.制品规格书.胶丝比例id.发丝种类.trim()) {
    errors["胶丝比例.发丝种类"] = "请选择发丝种类";
  }

  if (!form.制品规格书.胶丝比例id.颜色编号.trim()) {
    errors["胶丝比例.颜色编号"] = "请选择颜色编号";
  }

  if (form.制品规格书.机器规格清单.length < 1) {
    errors["机器规格清单"] = "至少添加 1 条机器规格";
  }

  if (form.制品规格书.人工规格清单.length < 1) {
    errors["人工规格清单"] = "至少添加 1 条人工规格";
  }

  for (const k of 工艺说明Keys) {
    const val = form.制品规格书.工艺说明[k] ?? "";
    if (!val.trim()) errors[`工艺说明.${k}`] = "不能为空";
  }

  if (form.染色档位列表.length > 0) {
    const dyeCheck = validate染色档位列表(form.染色档位列表);
    if (!dyeCheck.ok) errors["染色档位列表"] = dyeCheck.message;
  }

  return errors;
}

export default function ManualCreateWizardPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<StepIndex>(0);
  const [customerList, setCustomerList] = useState<DbCustomer[]>([]);
  const [ratioList, setRatioList] = useState<胶丝比例ListItem[]>([]);
  const [form, setForm] = useState<沐茵丝假发成品稿>(() => emptyFile());
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [highNeedleSvgRevision, setHighNeedleSvgRevision] = useState(0);
  const [highNeedleSvgFileName, setHighNeedleSvgFileName] = useState<string | null>(
    null,
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    callApi("admin/customer/GetList", {}).then((r) => {
      if (r.isSucc) setCustomerList(r.res.list);
    });

    callApi("admin/ratio/GetList", {}).then((r) => {
      if (r.isSucc) setRatioList(r.res.list);
    });
  }, []);

  useEffect(() => {
    if (step !== 2) return;
    setForm((f) => ({
      ...f,
      手织指示单: { ...f.手织指示单, 手织图: { svg: "" } },
    }));
  }, [step]);

  const clearFieldError = React.useCallback((key: string) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
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

  function goNext() {
    if (step === 0) {
      const errors = validateStep1(form);
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        message.error("请补齐必填项");
        return;
      }
      setFieldErrors({});
      setStep(1);
      return;
    }

    if (step === 1) {
      if (!form.高针指示单.高针图.底图.svg.trim()) {
        message.error("请先选择高针图 SVG 并完成标注");
        return;
      }
      setStep(2);
    }
  }

  async function handleSave() {
    const errors = validateStep1(form);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setStep(0);
      message.error("请先补齐 Step1 必填项");
      return;
    }

    if (!form.高针指示单.高针图.底图.svg.trim()) {
      setStep(1);
      message.error("请先选择高针图 SVG 并完成标注");
      return;
    }

    setSaving(true);
    try {
      const r = await callApi("admin/file/Add", { file: form });
      if (!r.isSucc) {
        message.error(r.err.message);
        return;
      }
      message.success("保存成功");
      navigate("/designs", { replace: true });
    } catch (e) {
      message.error(e instanceof Error ? e.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  const actions = (
    <div className="flex items-center gap-2">
      {step > 0 ? (
        <button
          type="button"
          className="rounded bg-slate-100 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-200"
          onClick={() => setStep((s) => (s === 0 ? 0 : ((s - 1) as StepIndex)))}
        >
          上一步
        </button>
      ) : null}

      {step < 2 ? (
        <button
          type="button"
          className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
          onClick={goNext}
        >
          下一步
        </button>
      ) : (
        <button
          type="button"
          disabled={saving}
          className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          onClick={() => void handleSave()}
        >
          {saving ? "保存中…" : "保存成品稿"}
        </button>
      )}
    </div>
  );

  return (
    <PageShell title="添加成品稿" onBack={() => navigate("/designs")} actions={actions}>
      <Stepper step={step} />

      {step === 0 ? (
        <>
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-600">
            Step1：导入数据（此步需要补齐必填内容，完成后才能进入下一步）。
          </div>

          <BasicInfoSection
            form={form}
            setForm={setForm}
            customerList={customerList}
            errors={fieldErrors}
            clearError={clearFieldError}
          />

          <RatioSection
            value={form.制品规格书.胶丝比例id}
            onChange={(v) =>
              setForm((f) => ({
                ...f,
                制品规格书: { ...f.制品规格书, 胶丝比例id: v },
              }))
            }
            发丝种类选项={发丝种类选项}
            颜色编号选项={当前发丝种类颜色编号列表}
            errors={fieldErrors}
            clearError={clearFieldError}
          />

          <MachineSpecSection
            list={form.制品规格书.机器规格清单}
            onChange={(v) =>
              setForm((f) => ({
                ...f,
                制品规格书: { ...f.制品规格书, 机器规格清单: v },
              }))
            }
            假发类型={form.假发类型}
            error={fieldErrors["机器规格清单"]}
            clearError={() => clearFieldError("机器规格清单")}
          />

          <ManualSpecSection
            list={form.制品规格书.人工规格清单}
            onChange={(v) =>
              setForm((f) => ({
                ...f,
                制品规格书: { ...f.制品规格书, 人工规格清单: v },
              }))
            }
            error={fieldErrors["人工规格清单"]}
            clearError={() => clearFieldError("人工规格清单")}
          />

          <ProcessNotesSection
            list={form.制品规格书.工艺说明}
            onChange={(v) =>
              setForm((f) => ({
                ...f,
                制品规格书: { ...f.制品规格书, 工艺说明: v },
              }))
            }
            errors={fieldErrors}
            clearError={clearFieldError}
          />

          <DyeLevelsSection
            list={form.染色档位列表}
            onChange={(v) => setForm((f) => ({ ...f, 染色档位列表: v }))}
            全部档位名={全部档位名}
            error={fieldErrors["染色档位列表"]}
            clearError={() => clearFieldError("染色档位列表")}
          />

          <HighNeedleSection
            value={form.高针指示单}
            onChange={(v) => setForm((f) => ({ ...f, 高针指示单: v }))}
            showJsonImporter={false}
          />

          <HandWovenSection
            value={form.手织指示单}
            onChange={(v) => setForm((f) => ({ ...f, 手织指示单: v }))}
            showSvg={false}
          />
        </>
      ) : null}

      {step === 1 ? (
        <>
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-600">
            Step2：导入高针图（复用「测试页面 → 高针图标注 Demo」的标注能力）。
            先选择高针图 SVG，在本页完成标注；完成后生成的 JSON 会自动写入成品稿。
          </div>

          <section className="rounded-xl border border-slate-100 bg-slate-50 p-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="mb-0 text-xs font-semibold uppercase tracking-wide text-slate-500">
                高针图标注
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <label className="cursor-pointer rounded bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200">
                  选择 SVG 文件
                  <input
                    type="file"
                    accept="image/svg+xml,.svg"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        const text = typeof reader.result === "string" ? reader.result : "";
                        const emptyHighNeedle = emptyFile().高针指示单.高针图;
                        emptyHighNeedle.底图.svg = text;
                        setHighNeedleSvgFileName(file.name);
                        setHighNeedleSvgRevision((v) => v + 1);
                        setForm((f) => ({
                          ...f,
                          高针指示单: { ...f.高针指示单, 高针图: emptyHighNeedle },
                        }));
                      };
                      reader.readAsText(file);
                      e.target.value = "";
                    }}
                  />
                </label>

                <button
                  type="button"
                  className="rounded bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(
                        JSON.stringify(form.高针指示单.高针图, null, 2),
                      );
                      message.success("已复制 JSON");
                    } catch {
                      message.error("复制失败");
                    }
                  }}
                >
                  复制 JSON
                </button>

                <button
                  type="button"
                  className="rounded bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200"
                  onClick={() => {
                    const blob = new Blob([
                      JSON.stringify(form.高针指示单.高针图, null, 2),
                    ], {
                      type: "application/json;charset=utf-8",
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "high-needle.json";
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  下载 JSON
                </button>
              </div>
            </div>

            {highNeedleSvgFileName ? (
              <div className="mb-3 text-xs text-slate-500">
                当前 SVG：{highNeedleSvgFileName}
              </div>
            ) : null}

            {form.高针指示单.高针图.底图.svg.trim() ? (
              <HighNeedleSvgAnnotator
                key={highNeedleSvgRevision}
                initialSvg={form.高针指示单.高针图.底图.svg}
                initialValue={form.高针指示单.高针图}
                startAt="begin"
                enableDml
                enableDouble
                onChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    高针指示单: { ...f.高针指示单, 高针图: v },
                  }))
                }
              />
            ) : (
              <div className="text-sm text-slate-600">
                请先选择一份高针图 SVG 文件。
              </div>
            )}
          </section>
        </>
      ) : null}

      {step === 2 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          Step3：导入手织图（Demo）。当前版本无需上传，默认保存为空。
        </div>
      ) : null}
    </PageShell>
  );
}
