import * as React from "react";
import { Select } from "antd";
import { message } from "antd";
import { callApi } from "../../api/callApi";
import { getApiBase } from "../../api/apiBase";
import InlineSvg from "../../components/InlineSvg";
import Section from "../../components/Section";
import type { DbCustomer } from "../../shared/db/DbCustomer";
import { 假发类型 } from "../../shared/db/Db沐茵丝假发成品稿";
import type {
  制品规格书,
  染色档位,
} from "../../shared/db/Db沐茵丝假发成品稿";
import type { FileDraftViewModel } from "../../shared/fileDraft/model";
import {
  buildPreviewSvg,
  formatInchText,
} from "../../pages/admin/add-file/components/DyeLevelEditor";
import DyeLevelsSection from "../../pages/admin/add-file/sections/DyeLevelsSection";
import MachineSpecSection from "../../pages/admin/add-file/sections/MachineSpecSection";
import ManualSpecSection from "../../pages/admin/add-file/sections/ManualSpecSection";
import { 工艺说明Keys } from "../../pages/admin/add-file/defaults";
import { inputCls } from "../../pages/admin/add-file/components/ui";
import { ExcelStyleMachineTable, ExcelStyleManualTable } from "./ExcelStyleSpecTables";

type HatMakingOption = {
  _id: string;
  帽围: number;
  帽深: number;
  前后: number;
};

type FieldErrors = Partial<Record<string, string>>;

type Props = {
  mode: "edit" | "readonly";
  value: FileDraftViewModel;
  onChange?: React.Dispatch<React.SetStateAction<FileDraftViewModel>>;
  customerList?: DbCustomer[];
  hatMakingList?: HatMakingOption[];
  发丝种类选项?: string[];
  颜色编号选项?: string[];
  全部档位名?: string[];
  errors?: FieldErrors;
  clearError?: (key: string) => void;
};

function ReadonlyRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-2 border-b border-slate-100 px-4 py-2 text-xs last:border-b-0">
      <div className="text-slate-400">{label}</div>
      <div className="text-slate-700">{value || "—"}</div>
    </div>
  );
}

function EditableRow({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[7rem_minmax(0,1fr)] items-start gap-2 border-b border-slate-100 px-4 py-2 text-xs first:border-0">
      <div
        className={`pt-2 ${error ? "text-rose-600" : "text-slate-400"}`}
      >
        {label}
      </div>
      <div>
        {children}
        {error ? <div className="mt-1 text-xs text-rose-500">{error}</div> : null}
      </div>
    </div>
  );
}

function resolveImageUrl(src: string): string {
  if (!src) return "";
  if (/^https?:\/\//i.test(src)) return src;
  try {
    return new URL(src, getApiBase()).toString();
  } catch {
    return src;
  }
}

function DyeLevelReadonlyCard({
  item,
  index,
}: {
  item: 染色档位;
  index: number;
}) {
  const previewSvg = buildPreviewSvg(item);

  return (
    <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs font-medium text-slate-500">
            染色档位 {index + 1}（{item.type}）
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {item.染色图.档位标注.档位列表.map((slot) => (
              <span
                key={slot}
                className="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white"
              >
                {slot}
              </span>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2 text-xs text-slate-600 sm:grid-cols-3">
          <div className="rounded bg-slate-50 px-3 py-2">
            染色尺寸：{formatInchText(item.染色图.染色尺寸标注.尺寸)}
          </div>
          {item.type === "错位" ? (
            <div className="rounded bg-slate-50 px-3 py-2">
              长尺寸：{formatInchText(item.染色图.长尺寸标注.尺寸)}
            </div>
          ) : null}
          {item.type === "错位" && item.染色图.短尺寸标注 ? (
            <div className="rounded bg-slate-50 px-3 py-2">
              短尺寸：{formatInchText(item.染色图.短尺寸标注.尺寸)}
            </div>
          ) : null}
        </div>
      </div>

      {previewSvg ? (
        <div className="overflow-x-auto rounded border border-slate-100 bg-white p-3">
          <InlineSvg svg={previewSvg} className="max-w-full" height="auto" />
        </div>
      ) : null}
    </div>
  );
}

function FileDraftReadonlySections({
  value,
  hatMakingList = [],
}: {
  value: FileDraftViewModel;
  hatMakingList?: HatMakingOption[];
}) {
  const 工艺说明列表 = Object.entries(value.制品规格书.工艺说明 ?? {});
  const hatSpec = value.制品规格书.制帽 as unknown as { 编号: string; 唛头: string };
  const currentHatMaking =
    hatMakingList.find((item) => item._id === hatSpec.编号) ?? null;

  return (
    <div className="space-y-5">
      <Section title="基本信息">
        <div>
          <ReadonlyRow label="样品编号" value={value._id} />
          <ReadonlyRow label="假发类型" value={value.假发类型} />
          <ReadonlyRow label="客户编号" value={value.客户编号} />
          <ReadonlyRow label="品名" value={value.品名} />
          <ReadonlyRow label="原材料" value={value.原材料} />
          <ReadonlyRow label="CAP" value={value.CAP} />
        </div>
      </Section>

      <Section title="制帽规格">
        <div>
          <ReadonlyRow label="编号" value={hatSpec.编号} />
          <ReadonlyRow
            label="帽围"
            value={currentHatMaking ? `${currentHatMaking.帽围} cm` : "—"}
          />
          <ReadonlyRow
            label="帽深"
            value={currentHatMaking ? `${currentHatMaking.帽深} cm` : "—"}
          />
          <ReadonlyRow
            label="前后"
            value={currentHatMaking ? `${currentHatMaking.前后} cm` : "—"}
          />
          <ReadonlyRow label="唛头" value={hatSpec.唛头} />
        </div>
      </Section>

      <Section title="胶丝比例">
        <div>
          <ReadonlyRow
            label="发丝种类"
            value={value.制品规格书.胶丝比例id.发丝种类}
          />
          <ReadonlyRow
            label="颜色编号"
            value={value.制品规格书.胶丝比例id.颜色编号}
          />
        </div>
      </Section>

      <Section title="工程重量（加减值 g）">
        <div>
          {(
            ["整毛", "双针", "美容", "制帽", "高针", "手织", "剪驳", "发网"] as const
          ).map((key) => (
            <ReadonlyRow
              key={key}
              label={key}
              value={value.制品规格书.工程重量[key]?.加减 ?? 0}
            />
          ))}
        </div>
      </Section>

      <Section title="机器规格清单">
        <div className="p-4">
          <ExcelStyleMachineTable rows={value.制品规格书.机器规格清单} />
        </div>
      </Section>

      <Section title="人工规格清单">
        <div className="p-4">
          <ExcelStyleManualTable rows={value.制品规格书.人工规格清单} />
        </div>
      </Section>

      <Section title="工艺说明">
        <div>
          {工艺说明列表.length > 0 ? (
            工艺说明列表.map(([key, item]) => (
              <ReadonlyRow key={key} label={key} value={item} />
            ))
          ) : (
            <div className="px-4 py-3 text-xs text-slate-400">暂无工艺说明</div>
          )}
        </div>
      </Section>

      <Section title="染色档位列表">
        {value.染色档位列表.length > 0 ? (
          <div className="space-y-3 p-4">
            {value.染色档位列表.map((item, index) => (
              <DyeLevelReadonlyCard
                key={`${item.type}-${index}`}
                item={item}
                index={index}
              />
            ))}
          </div>
        ) : (
          <div className="px-4 py-3 text-xs text-slate-400">暂无染色档位</div>
        )}
      </Section>

      {value.头型图片.length > 0 ? (
        <Section title="染色图片">
          <div className="flex flex-wrap gap-3 p-4">
            {value.头型图片.map((src, index) => (
              <img
                key={`${src}-${index}`}
                src={resolveImageUrl(src)}
                alt={`染色图片 ${index + 1}`}
                className="h-40 rounded object-contain ring-1 ring-slate-200"
              />
            ))}
          </div>
        </Section>
      ) : null}
    </div>
  );
}

function FileDraftEditSections({
  value,
  onChange,
  customerList = [],
  hatMakingList = [],
  发丝种类选项 = [],
  颜色编号选项 = [],
  全部档位名 = [],
  errors,
  clearError,
}: Omit<Props, "mode"> & {
  onChange: React.Dispatch<React.SetStateAction<FileDraftViewModel>>;
}) {
  const set规格书 = <K extends keyof 制品规格书>(key: K, val: 制品规格书[K]) => {
    onChange((prev) => ({
      ...prev,
      制品规格书: { ...prev.制品规格书, [key]: val },
    }));
  };
  const err = (key: string) => errors?.[key];
  const custom工艺说明 = Object.entries(value.制品规格书.工艺说明 ?? {}).filter(
    ([k]) => !工艺说明Keys.includes(k as (typeof 工艺说明Keys)[number]),
  );
  const hatSpec = value.制品规格书.制帽 as unknown as { 编号: string; 唛头: string };
  const currentHatMaking =
    hatMakingList.find((item) => item._id === hatSpec.编号) ?? null;
  const [uploadingImage, setUploadingImage] = React.useState(false);

  async function handleUploadHeadImage(file: File) {
    setUploadingImage(true);
    try {
      const fileData = new Uint8Array(await file.arrayBuffer());
      const res = (await callApi("Upload" as never, {
        fileData,
        fileName: file.name,
        dirName: "hair-draft",
      } as never)) as
        | { isSucc: true; res: { path: string } }
        | { isSucc: false; err: { message: string } };

      if (!res.isSucc) {
        throw new Error(res.err.message || "上传失败");
      }

      onChange((prev) => ({
        ...prev,
        头型图片: [...prev.头型图片, res.res.path],
      }));
      message.success("图片上传成功");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "图片上传失败";
      message.error(msg);
    } finally {
      setUploadingImage(false);
    }
  }

  function removeHeadImage(index: number) {
    onChange((prev) => ({
      ...prev,
      头型图片: prev.头型图片.filter((_, currentIndex) => currentIndex !== index),
    }));
  }

  return (
    <div className="space-y-5">
      <Section title="基本信息">
        <div>
          <EditableRow label="样品编号" error={err("_id")}>
            <input
              type="text"
              className={`${inputCls}${err("_id") ? " border-rose-400 focus:ring-rose-200" : ""}`}
              value={value._id}
              onChange={(e) => {
                clearError?.("_id");
                onChange((prev) => ({ ...prev, _id: e.target.value }));
              }}
            />
          </EditableRow>
          <EditableRow label="假发类型">
            <select
              className={inputCls}
              value={value.假发类型}
              onChange={(e) => {
                const next = e.target.value as 假发类型;
                onChange((prev) => ({
                  ...prev,
                  假发类型: next,
                  制品规格书:
                    next !== 假发类型.间色
                      ? {
                          ...prev.制品规格书,
                          机器规格清单: prev.制品规格书.机器规格清单.map(
                            ({ DML比值: _omit, ...rest }) => rest,
                          ),
                        }
                      : prev.制品规格书,
                }));
              }}
            >
              {["间色", "纯色", "上下分", "T色"].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </EditableRow>
          <EditableRow label="客户编号" error={err("客户编号")}>
            <Select
              className="w-full"
              status={err("客户编号") ? "error" : undefined}
              value={value.客户编号 || undefined}
              options={customerList.map((c) => ({
                label: `${c.客户编号}${c.客户名称 ? ` - ${c.客户名称}` : ""}`,
                value: c.客户编号,
              }))}
              placeholder="选择客户编号 / 客户名称"
              allowClear
              showSearch
              optionFilterProp="label"
              onChange={(v) => {
                clearError?.("客户编号");
                onChange((prev) => ({ ...prev, 客户编号: v ?? "" }));
              }}
            />
          </EditableRow>
          {(
            [
              { key: "品名" as const, placeholder: "Michelle BB TBOB080" },
              { key: "原材料" as const, placeholder: "FU:50%+HL:50%" },
              { key: "CAP" as const, placeholder: "P-025(侧分雪花网L)" },
            ] as const
          ).map(({ key, placeholder }) => (
            <EditableRow key={key} label={key} error={err(key)}>
              <input
                type="text"
                className={`${inputCls}${err(key) ? " border-rose-400 focus:ring-rose-200" : ""}`}
                value={value[key]}
                placeholder={placeholder}
                onChange={(e) => {
                  clearError?.(key);
                  onChange((prev) => ({ ...prev, [key]: e.target.value }));
                }}
              />
            </EditableRow>
          ))}
        </div>
      </Section>

      <Section title="制帽规格">
        <div>
          <EditableRow label="编号">
            <Select
              className="w-full"
              value={hatSpec.编号 || undefined}
              options={hatMakingList.map((item) => ({
                label: `${item._id} · 帽围 ${item.帽围} / 帽深 ${item.帽深} / 前后 ${item.前后}`,
                value: item._id,
              }))}
              placeholder="搜索并选择制帽编号"
              allowClear
              showSearch
              optionFilterProp="label"
              onChange={(v) =>
                set规格书("制帽", {
                  ...(value.制品规格书.制帽 as object),
                  编号: v ?? "",
                } as unknown as 制品规格书["制帽"])
              }
            />
          </EditableRow>
          <EditableRow label="帽围">
            <div className="rounded border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {currentHatMaking ? `${currentHatMaking.帽围} cm` : "—"}
            </div>
          </EditableRow>
          <EditableRow label="帽深">
            <div className="rounded border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {currentHatMaking ? `${currentHatMaking.帽深} cm` : "—"}
            </div>
          </EditableRow>
          <EditableRow label="前后">
            <div className="rounded border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              {currentHatMaking ? `${currentHatMaking.前后} cm` : "—"}
            </div>
          </EditableRow>
          <EditableRow label="唛头">
              <input
                type="text"
                className={inputCls}
                value={hatSpec.唛头}
                onChange={(e) =>
                  set规格书("制帽", {
                    ...(value.制品规格书.制帽 as object),
                    唛头: e.target.value,
                  } as unknown as 制品规格书["制帽"])
                }
              />
          </EditableRow>
        </div>
      </Section>

      <Section title="胶丝比例">
        <div>
          <EditableRow
            label="发丝种类"
            error={err("胶丝比例.发丝种类")}
          >
            <Select
              className="w-full"
              status={err("胶丝比例.发丝种类") ? "error" : undefined}
              value={value.制品规格书.胶丝比例id.发丝种类 || undefined}
              options={发丝种类选项.map((t) => ({ label: t, value: t }))}
              placeholder="选择发丝种类"
              allowClear
              showSearch
              optionFilterProp="label"
              onChange={(v) => {
                clearError?.("胶丝比例.发丝种类");
                clearError?.("胶丝比例.颜色编号");
                set规格书("胶丝比例id", { 发丝种类: v ?? "", 颜色编号: "" });
              }}
            />
          </EditableRow>
          <EditableRow
            label="颜色编号"
            error={err("胶丝比例.颜色编号")}
          >
            <Select
              className="w-full"
              status={err("胶丝比例.颜色编号") ? "error" : undefined}
              value={value.制品规格书.胶丝比例id.颜色编号 || undefined}
              options={颜色编号选项.map((c) => ({ label: c, value: c }))}
              placeholder={
                value.制品规格书.胶丝比例id.发丝种类
                  ? "选择颜色编号"
                  : "请先选择发丝种类"
              }
              disabled={!value.制品规格书.胶丝比例id.发丝种类}
              allowClear
              showSearch
              optionFilterProp="label"
              onChange={(v) => {
                clearError?.("胶丝比例.颜色编号");
                set规格书("胶丝比例id", {
                  ...value.制品规格书.胶丝比例id,
                  颜色编号: v ?? "",
                });
              }}
            />
          </EditableRow>
        </div>
      </Section>

      <Section title="工程重量（加减值 g）">
        <div>
          {(
            ["整毛", "双针", "美容", "制帽", "高针", "手织", "剪驳", "发网"] as const
          ).map((k) => (
            <EditableRow key={k} label={k}>
              <input
                type="number"
                step="0.01"
                className={inputCls}
                value={value.制品规格书.工程重量[k]?.加减 ?? 0}
                onChange={(e) =>
                  set规格书("工程重量", {
                    ...value.制品规格书.工程重量,
                    [k]:
                      Number(e.target.value) === 0
                        ? undefined
                        : { 加减: Number(e.target.value) || 0 },
                  })
                }
              />
            </EditableRow>
          ))}
        </div>
      </Section>

      <Section title="染色图片">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex cursor-pointer items-center rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800">
              {uploadingImage ? "上传中…" : "上传图片"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploadingImage}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  void handleUploadHeadImage(file);
                  e.target.value = "";
                }}
              />
            </label>
            <div className="text-xs text-slate-500">
              支持 `jpg/png/webp/svg/pdf/json` 中的图片格式，上传后会加入制品规格书图片区。
            </div>
          </div>

          {value.头型图片.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {value.头型图片.map((src, index) => (
                <div
                  key={`${src}-${index}`}
                  className="overflow-hidden rounded-lg bg-white ring-1 ring-slate-200"
                >
                  <img
                    src={resolveImageUrl(src)}
                    alt={`染色图片 ${index + 1}`}
                    className="h-40 w-32 bg-slate-50 object-contain"
                  />
                  <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-2 py-2">
                    <span className="truncate text-xs text-slate-500">
                      图片 {index + 1}
                    </span>
                    <button
                      type="button"
                      className="text-xs text-rose-500 hover:text-rose-600"
                      onClick={() => removeHeadImage(index)}
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded border border-dashed border-slate-200 px-4 py-6 text-center text-xs text-slate-400">
              暂未上传染色图片
            </div>
          )}
        </div>
      </Section>

      <MachineSpecSection
        list={value.制品规格书.机器规格清单}
        onChange={(v) => set规格书("机器规格清单", v)}
        假发类型={value.假发类型}
        error={errors?.["机器规格清单"]}
        clearError={() => clearError?.("机器规格清单")}
      />

      <ManualSpecSection
        list={value.制品规格书.人工规格清单}
        onChange={(v) => set规格书("人工规格清单", v)}
        error={errors?.["人工规格清单"]}
        clearError={() => clearError?.("人工规格清单")}
      />

      <Section title="工艺说明">
        <div>
          {工艺说明Keys.map((k) => {
            const errorKey = `工艺说明.${k}`;
            return (
              <EditableRow key={k} label={k} error={errors?.[errorKey]}>
                <input
                  type="text"
                  className={`${inputCls}${errors?.[errorKey] ? " border-rose-400 focus:ring-rose-200" : ""}`}
                  value={value.制品规格书.工艺说明[k] ?? ""}
                  onChange={(e) => {
                    clearError?.(errorKey);
                    set规格书("工艺说明", {
                      ...value.制品规格书.工艺说明,
                      [k]: e.target.value,
                    });
                  }}
                />
              </EditableRow>
            );
          })}
          {custom工艺说明.map(([k, v]) => (
            <EditableRow key={k} label={k}>
              <input
                type="text"
                className={inputCls}
                value={v}
                onChange={(e) =>
                  set规格书("工艺说明", {
                    ...value.制品规格书.工艺说明,
                    [k]: e.target.value,
                  })
                }
              />
            </EditableRow>
          ))}
        </div>
      </Section>

      <DyeLevelsSection
        list={value.染色档位列表}
        onChange={(v) => onChange((prev) => ({ ...prev, 染色档位列表: v }))}
        全部档位名={全部档位名}
        error={errors?.["染色档位列表"]}
        clearError={() => clearError?.("染色档位列表")}
      />
    </div>
  );
}

export default function FileDraftDataSections({
  mode,
  value,
  onChange,
  customerList = [],
  hatMakingList = [],
  发丝种类选项 = [],
  颜色编号选项 = [],
  全部档位名 = [],
  errors,
  clearError,
}: Props) {
  if (mode === "readonly") {
    return <FileDraftReadonlySections value={value} hatMakingList={hatMakingList} />;
  }

  if (!onChange) {
    throw new Error("FileDraftDataSections edit 模式必须提供 onChange");
  }

  return (
    <FileDraftEditSections
      value={value}
      onChange={onChange}
      customerList={customerList}
      hatMakingList={hatMakingList}
      发丝种类选项={发丝种类选项}
      颜色编号选项={颜色编号选项}
      全部档位名={全部档位名}
      errors={errors}
      clearError={clearError}
    />
  );
}
