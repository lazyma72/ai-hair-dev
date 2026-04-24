import * as React from "react";
import { Select } from "antd";
import { message } from "antd";
import { callApi } from "../../api/callApi";
import DataTable, { type Column } from "../../components/DataTable";
import { frontConfig } from "../../frontConfig";
import InlineSvg from "../../components/InlineSvg";
import Section from "../../components/Section";
import type { DbCustomer } from "../../shared/db/DbCustomer";
import type { KLS胶丝比例 } from "../../shared/db/Db胶丝比例";
import { 假发类型 } from "../../shared/db/Db沐茵丝假发成品稿";
import type { 制品规格书, 染色档位 } from "../../shared/db/Db沐茵丝假发成品稿";
import type { FileDraftViewModel } from "../../shared/fileDraft/model";
import type {
  制品规格书Frontend,
  胶丝比例Frontend,
} from "../../shared/frontend/model/model";
import {
  buildPreviewSvg,
  formatInchText,
} from "../../pages/admin/add-file/components/DyeLevelEditor";
import DyeLevelsSection from "../../pages/admin/add-file/sections/DyeLevelsSection";
import MachineSpecSection from "../../pages/admin/add-file/sections/MachineSpecSection";
import ManualSpecSection from "../../pages/admin/add-file/sections/ManualSpecSection";
import { 工艺说明Keys } from "../../pages/admin/add-file/defaults";
import { inputCls } from "../../pages/admin/add-file/components/ui";
import {
  ExcelStyleMachineTable,
  ExcelStyleManualTable,
} from "./ExcelStyleSpecTables";
import { 提取高针图上下分标记 } from "../../shared/models/上下分计算尺数";

type HatMakingOption = {
  _id: string;
  名称?: string;
  帽围: number;
  帽深: number;
  前后: number;
};

function getHatMakingIdFromCAP(cap: string): string {
  return cap.trim().match(/^[^（(\s]+/)?.[0] ?? "";
}

function buildCapValue(item: HatMakingOption): string {
  const name = item.名称?.trim();
  return name ? `${item._id}(${name})` : item._id;
}

type FieldErrors = Partial<Record<string, string>>;

function splitEntries<T>(items: T[]): [T[], T[]] {
  const middle = Math.ceil(items.length / 2);
  return [items.slice(0, middle), items.slice(middle)];
}

const 胶丝比例列: Column<KLS胶丝比例>[] = [
  {
    key: "发丝",
    title: "发丝",
    render: (r) => r.发丝,
  },
  {
    key: "色号",
    title: "色号",
    render: (r) => r.色号,
  },
  {
    key: "比例",
    title: "比例 %",
    render: (r) => `${r.比例}%`,
  },
];

type Props = {
  mode: "edit" | "readonly";
  value: FileDraftViewModel;
  enableSplitDmlSizing?: boolean;
  制品规格书详情?: 制品规格书Frontend;
  当前胶丝比例详情?: 胶丝比例Frontend | null;
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
    <div className="grid grid-cols-[6rem_minmax(0,1fr)] gap-2 border-b border-slate-100 px-3 py-1.5 text-xs last:border-b-0">
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
    <div className="grid grid-cols-[6rem_minmax(0,1fr)] items-start gap-2 border-b border-slate-100 px-3 py-1.5 text-xs first:border-0">
      <div className={`pt-1.5 ${error ? "text-rose-600" : "text-slate-400"}`}>
        {label}
      </div>
      <div>
        {children}
        {error ? (
          <div className="mt-1 text-xs text-rose-500">{error}</div>
        ) : null}
      </div>
    </div>
  );
}

function resolveImageUrl(src: string): string {
  if (!src) return "";
  if (/^https?:\/\//i.test(src)) return src;
  try {
    return new URL(src, frontConfig.prodServer).toString();
  } catch {
    return src;
  }
}

function RatioDetailInline({
  ratio,
}: {
  ratio: 胶丝比例Frontend;
}) {
  return (
    <div className="mt-2 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="grid gap-2 md:grid-cols-2">
        <div className="rounded bg-white p-2 text-xs text-slate-700">
          <div>发丝种类：{ratio._id.发丝种类}</div>
          <div className="mt-1">颜色编号：{ratio._id.颜色编号}</div>
          <div className="mt-1">线色：{ratio.线色 || "—"}</div>
          <div className="mt-1">备注：{ratio.备注 || "—"}</div>
        </div>
        {ratio.颜色图片参考 ? (
          <div className="rounded bg-white p-2">
            <img
              src={`data:image/jpeg;base64,${ratio.颜色图片参考}`}
              alt="颜色参考"
              className="max-h-32 rounded object-contain"
            />
          </div>
        ) : null}
      </div>
      {ratio.D.length > 0 ? (
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-slate-600">D 色配比</div>
          <DataTable
            columns={胶丝比例列}
            rows={ratio.D}
            rowKey={(r) => `inline-D-${r.发丝}-${r.色号}`}
          />
        </div>
      ) : null}
      {ratio.M && ratio.M.length > 0 ? (
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-slate-600">M 色配比</div>
          <DataTable
            columns={胶丝比例列}
            rows={ratio.M}
            rowKey={(r) => `inline-M-${r.发丝}-${r.色号}`}
          />
        </div>
      ) : null}
      {ratio.L && ratio.L.length > 0 ? (
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-slate-600">L 色配比</div>
          <DataTable
            columns={胶丝比例列}
            rows={ratio.L}
            rowKey={(r) => `inline-L-${r.发丝}-${r.色号}`}
          />
        </div>
      ) : null}
    </div>
  );
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
    <div className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-xs font-medium text-slate-500">
            染色档位 {index + 1}（{item.type}）
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {item.染色图.档位标注.档位列表.map((slot) => (
              <span
                key={slot}
                className="rounded-full bg-slate-900 px-2.5 py-0.5 text-[11px] font-medium text-white"
              >
                {slot}
              </span>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-1.5 text-xs text-slate-600 sm:grid-cols-3">
          <div className="rounded bg-slate-50 px-2.5 py-1.5">
            染色尺寸：{formatInchText(item.染色图.染色尺寸标注.尺寸)}
          </div>
          {item.type === "错位" ? (
            <div className="rounded bg-slate-50 px-2.5 py-1.5">
              长尺寸：{formatInchText(item.染色图.长尺寸标注.尺寸)}
            </div>
          ) : null}
          {item.type === "错位" && item.染色图.短尺寸标注 ? (
            <div className="rounded bg-slate-50 px-2.5 py-1.5">
              短尺寸：{formatInchText(item.染色图.短尺寸标注.尺寸)}
            </div>
          ) : null}
        </div>
      </div>

      {previewSvg ? (
        <div className="overflow-x-auto rounded border border-slate-100 bg-white p-2">
          <InlineSvg svg={previewSvg} className="max-w-full" height="auto" />
        </div>
      ) : null}
    </div>
  );
}

function FileDraftReadonlySections({
  value,
  制品规格书详情,
  hatMakingList = [],
}: {
  value: FileDraftViewModel;
  制品规格书详情?: 制品规格书Frontend;
  hatMakingList?: HatMakingOption[];
}) {
  const 工艺说明列表 = Object.entries(value.制品规格书.工艺说明 ?? {});
  const [左侧工艺说明, 右侧工艺说明] = splitEntries(工艺说明列表);
  const currentHatMaking =
    hatMakingList.find(
      (item) => item._id === getHatMakingIdFromCAP(value.CAP),
    ) ?? null;
  const 胶丝比例 = 制品规格书详情?.胶丝比例;
  const 工程重量 = 制品规格书详情?.工程重量;
  const 机器规格清单 = 制品规格书详情?.机器规格清单 ?? value.制品规格书.机器规格清单;
  const 人工规格清单 = 制品规格书详情?.人工规格清单 ?? value.制品规格书.人工规格清单;
  const 工程重量行 = 工程重量
    ? ([
        ["整毛", 工程重量.整毛],
        ["双针", 工程重量.双针],
        ["美容", 工程重量.美容],
        ["制帽", 工程重量.制帽],
        ["手织", 工程重量.手织],
        ["高针", 工程重量.高针],
        ["剪驳", 工程重量.剪驳],
        ["发网", 工程重量.发网],
        ["完成", 工程重量.完成],
      ] as const)
    : [];

  // 判断是否有 M/L 数据
  const hasGlobalM =
    机器规格清单.some(
      (row) => row.双针.尺数.M != null || row.裁断与重量.some((item) => item.重量g?.M != null),
    );
  const hasGlobalL =
    机器规格清单.some(
      (row) => row.双针.尺数.L != null || row.裁断与重量.some((item) => item.重量g?.L != null),
    );

  return (
    <div className="space-y-3">
      <div className="grid gap-3 xl:grid-cols-2">
        <Section title="基本信息" compact>
          <div>
            <ReadonlyRow label="样品编号" value={value.样品编号} />
            <ReadonlyRow label="假发类型" value={value.假发类型} />
            <ReadonlyRow label="客户编号" value={value.客户编号} />
            <ReadonlyRow label="品名" value={value.品名} />
            <ReadonlyRow label="原材料" value={value.原材料} />
          </div>
        </Section>

        <Section title="制帽规格" compact>
          <div>
            <ReadonlyRow label="CAP" value={value.CAP} />
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
            <ReadonlyRow label="唛头" value={value.制品规格书.制帽.唛头} />
          </div>
        </Section>

        <Section title="胶丝比例" compact>
          {胶丝比例 ? (
            <div className="space-y-2 p-3">
              <div className="rounded-xl bg-slate-50">
                <ReadonlyRow label="发丝种类" value={胶丝比例._id.发丝种类} />
                <ReadonlyRow label="颜色编号" value={胶丝比例._id.颜色编号} />
                <ReadonlyRow label="线色" value={胶丝比例.线色 || "—"} />
                <ReadonlyRow label="备注" value={胶丝比例.备注 || "—"} />
              </div>
              {胶丝比例.D.length > 0 ? (
                <div className="space-y-1.5">
                  <div className="text-xs font-medium text-slate-600">
                    D = {胶丝比例.D.map((item) => `${item.发丝}/${item.色号} ${item.比例}%`).join("，")}
                  </div>
                  <DataTable
                    columns={胶丝比例列}
                    rows={胶丝比例.D}
                    rowKey={(r) => `D-${r.发丝}-${r.色号}`}
                  />
                </div>
              ) : null}
              {胶丝比例.M && 胶丝比例.M.length > 0 ? (
                <div className="space-y-1.5">
                  <div className="text-xs font-medium text-slate-600">
                    M = {胶丝比例.M.map((item) => `${item.发丝}/${item.色号} ${item.比例}%`).join("，")}
                  </div>
                  <DataTable
                    columns={胶丝比例列}
                    rows={胶丝比例.M}
                    rowKey={(r) => `M-${r.发丝}-${r.色号}`}
                  />
                </div>
              ) : null}
              {胶丝比例.L && 胶丝比例.L.length > 0 ? (
                <div className="space-y-1.5">
                  <div className="text-xs font-medium text-slate-600">
                    L = {胶丝比例.L.map((item) => `${item.发丝}/${item.色号} ${item.比例}%`).join("，")}
                  </div>
                  <DataTable
                    columns={胶丝比例列}
                    rows={胶丝比例.L}
                    rowKey={(r) => `L-${r.发丝}-${r.色号}`}
                  />
                </div>
              ) : null}
            </div>
          ) : (
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
          )}
        </Section>

        <Section title="工程重量（操作值 g）" compact>
          {工程重量 ? (
            <div>
              <div className="grid grid-cols-[6rem_6rem_1fr] gap-2 border-b border-slate-100 px-3 py-1.5 text-xs text-slate-400">
                <span>项目</span>
                <span>操作值</span>
                <span>数值</span>
              </div>
              {工程重量行.map(([key, item]) => (
                <div
                  key={key}
                  className="grid grid-cols-[6rem_6rem_1fr] gap-2 border-b border-slate-100 px-3 py-1.5 text-xs last:border-b-0"
                >
                  <span className="text-slate-400">{key}</span>
                  <span className="text-slate-900">
                    {item.加减 >= 0 ? "+" : ""}
                    {item.加减}
                  </span>
                  <span className="text-slate-900">{item.数值}g</span>
                </div>
              ))}
              <div className="flex items-center justify-between bg-slate-900 px-3 py-1.5 text-xs text-white">
                <span className="text-slate-300">完成重量</span>
                <span className="font-semibold">{工程重量.重量}</span>
              </div>
            </div>
          ) : (
            <div>
              {(
                [
                  "整毛",
                  "双针",
                  "美容",
                  "制帽",
                  "手织",
                  "高针",
                  "剪驳",
                  "发网",
                ] as const
              ).map((key) => (
                <ReadonlyRow
                  key={key}
                  label={key}
                  value={value.制品规格书.工程重量[key]?.加减 ?? 0}
                />
              ))}
            </div>
          )}
        </Section>
      </div>

      <Section title="机器规格清单" compact>
        <div className="p-3">
          <ExcelStyleMachineTable
            rows={机器规格清单}
            假发类型={value.假发类型}
            hasGlobalM={hasGlobalM}
            hasGlobalL={hasGlobalL}
          />
        </div>
      </Section>

      <Section title="人工规格清单" compact>
        <div className="p-3">
          <ExcelStyleManualTable
            rows={人工规格清单}
            假发类型={value.假发类型}
            hasGlobalM={hasGlobalM}
            hasGlobalL={hasGlobalL}
          />
        </div>
      </Section>

      <Section title="工艺说明" compact>
        <div className="grid gap-0 xl:grid-cols-2 xl:divide-x xl:divide-slate-100">
          {工艺说明列表.length > 0 ? (
            <>
              <div>
                {左侧工艺说明.map(([key, item]) => (
                  <ReadonlyRow key={key} label={key} value={item} />
                ))}
              </div>
              <div>
                {右侧工艺说明.map(([key, item]) => (
                  <ReadonlyRow key={key} label={key} value={item} />
                ))}
              </div>
            </>
          ) : (
            <div className="px-4 py-3 text-xs text-slate-400">暂无工艺说明</div>
          )}
        </div>
      </Section>

      <Section title="染色档位列表" compact>
        {value.染色档位列表.length > 0 ? (
          <div className="space-y-2 p-3">
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
        <Section title="染色图片" compact>
          <div className="flex flex-wrap gap-2 p-3">
            {value.头型图片.map((src, index) => (
              <img
                key={`${src}-${index}`}
                src={resolveImageUrl(src)}
                alt={`染色图片 ${index + 1}`}
                className="h-32 rounded object-contain ring-1 ring-slate-200"
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
  enableSplitDmlSizing = false,
  当前胶丝比例详情,
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
  const set规格书 = <K extends keyof 制品规格书>(
    key: K,
    val: 制品规格书[K],
  ) => {
    onChange((prev) => ({
      ...prev,
      制品规格书: { ...prev.制品规格书, [key]: val },
    }));
  };
  const err = (key: string) => errors?.[key];
  const custom工艺说明 = Object.entries(value.制品规格书.工艺说明 ?? {}).filter(
    ([k]) => !工艺说明Keys.includes(k as (typeof 工艺说明Keys)[number]),
  );
  const 工艺说明列表 = [
    ...工艺说明Keys.map((k) => [k, value.制品规格书.工艺说明[k] ?? ""] as const),
    ...custom工艺说明,
  ];
  const [左侧工艺说明, 右侧工艺说明] = splitEntries(工艺说明列表);
  const currentHatMaking =
    hatMakingList.find(
      (item) => item._id === getHatMakingIdFromCAP(value.CAP),
    ) ?? null;
  const [uploadingImage, setUploadingImage] = React.useState(false);

  async function handleUploadHeadImage(file: File) {
    setUploadingImage(true);
    try {
      const fileData = new Uint8Array(await file.arrayBuffer());
      const res = (await callApi(
        "Upload" as never,
        {
          fileData,
          fileName: file.name,
          dirName: "hair-draft",
        } as never,
      )) as
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
      头型图片: prev.头型图片.filter(
        (_, currentIndex) => currentIndex !== index,
      ),
    }));
  }

  const 上下分配置 = React.useMemo(() => {
    if (value.假发类型 !== 假发类型.上下分) {
      return { hasM: false, hasL: false };
    }
    if (enableSplitDmlSizing) {
      return 提取高针图上下分标记(value.高针指示单.高针图);
    }
    const derivedHasM = value.制品规格书.机器规格清单.some(
      (row) => row.双针.尺数.M != null,
    );
    const derivedHasL = value.制品规格书.机器规格清单.some(
      (row) => row.双针.尺数.L != null,
    );
    return { hasM: derivedHasM, hasL: derivedHasL };
  }, [
    enableSplitDmlSizing,
    value.假发类型,
    value.高针指示单.高针图,
    value.制品规格书.机器规格清单,
  ]);

  return (
    <div className="space-y-3">
      <div className="grid gap-3 xl:grid-cols-2">
        <Section title="基本信息" compact>
          <div>
            <EditableRow label="样品编号" error={err("样品编号")}>
              <input
                type="text"
                className={`${inputCls}${err("样品编号") ? " border-rose-400 focus:ring-rose-200" : ""}`}
                value={value.样品编号}
                onChange={(e) => {
                  clearError?.("样品编号");
                  onChange((prev) => ({ ...prev, 样品编号: e.target.value }));
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
                            人工规格清单: prev.制品规格书.人工规格清单.map((row) => {
                              const { DML比值: _omit, ...rest } = row as typeof row & {
                                DML比值?: { D: number; L?: number };
                              };
                              return rest;
                            }),
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

        <Section title="制帽规格" compact>
          <div>
            <EditableRow label="CAP" error={err("CAP")}>
              <Select
                className="w-full"
                status={err("CAP") ? "error" : undefined}
                value={value.CAP || undefined}
                options={hatMakingList.map((item) => ({
                  label: `${buildCapValue(item)} · 帽围 ${item.帽围} / 帽深 ${item.帽深} / 前后 ${item.前后}`,
                  value: buildCapValue(item),
                }))}
                placeholder="搜索并选择 CAP"
                allowClear
                showSearch
                optionFilterProp="label"
                onChange={(v) => {
                  clearError?.("CAP");
                  onChange((prev) => ({ ...prev, CAP: v ?? "" }));
                }}
              />
            </EditableRow>
            <EditableRow label="帽围">
              <div className="rounded border border-slate-100 bg-slate-50 px-2.5 py-1.5 text-sm text-slate-700">
                {currentHatMaking ? `${currentHatMaking.帽围} cm` : "—"}
              </div>
            </EditableRow>
            <EditableRow label="帽深">
              <div className="rounded border border-slate-100 bg-slate-50 px-2.5 py-1.5 text-sm text-slate-700">
                {currentHatMaking ? `${currentHatMaking.帽深} cm` : "—"}
              </div>
            </EditableRow>
            <EditableRow label="前后">
              <div className="rounded border border-slate-100 bg-slate-50 px-2.5 py-1.5 text-sm text-slate-700">
                {currentHatMaking ? `${currentHatMaking.前后} cm` : "—"}
              </div>
            </EditableRow>
            <EditableRow label="唛头">
              <input
                type="text"
                className={inputCls}
                value={value.制品规格书.制帽.唛头}
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

        <Section title="胶丝比例" compact>
          <div>
            <EditableRow label="发丝种类" error={err("胶丝比例.发丝种类")}>
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
            <EditableRow label="颜色编号" error={err("胶丝比例.颜色编号")}>
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
            {当前胶丝比例详情 ? <RatioDetailInline ratio={当前胶丝比例详情} /> : null}
          </div>
        </Section>

        <Section title="工程重量（操作值 g）" compact>
          <div>
            {(
              [
                "整毛",
                "双针",
                "美容",
                "制帽",
                "手织",
                "高针",
                "剪驳",
                "发网",
                "完成",
              ] as const
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
      </div>

      <Section title="染色图片" compact>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex cursor-pointer items-center rounded bg-slate-900 px-3 py-1 text-sm font-medium text-white hover:bg-slate-800">
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
              支持 `jpg/png/webp/svg/pdf/json`
              中的图片格式，上传后会加入制品规格书图片区。
            </div>
          </div>

          {value.头型图片.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {value.头型图片.map((src, index) => (
                <div
                  key={`${src}-${index}`}
                  className="overflow-hidden rounded-lg bg-white ring-1 ring-slate-200"
                >
                  <img
                    src={resolveImageUrl(src)}
                    alt={`染色图片 ${index + 1}`}
                    className="h-32 w-28 bg-slate-50 object-contain"
                  />
                  <div className="flex items-center justify-between gap-2 border-t border-slate-100 px-2 py-1.5">
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
        hasGlobalM={上下分配置.hasM}
        hasGlobalL={上下分配置.hasL}
        lockSplitSizeInputs={enableSplitDmlSizing}
        error={errors?.["机器规格清单"]}
        clearError={() => clearError?.("机器规格清单")}
      />

      <ManualSpecSection
        list={value.制品规格书.人工规格清单}
        onChange={(v) => set规格书("人工规格清单", v)}
        假发类型={value.假发类型}
        hasGlobalM={上下分配置.hasM}
        hasGlobalL={上下分配置.hasL}
        error={errors?.["人工规格清单"]}
        clearError={() => clearError?.("人工规格清单")}
      />

      <Section title="工艺说明" compact>
        <div className="grid gap-0 xl:grid-cols-2 xl:divide-x xl:divide-slate-100">
          {[左侧工艺说明, 右侧工艺说明].map((列, 列索引) => (
            <div key={列索引}>
              {列.map(([k, v]) => {
                const errorKey = `工艺说明.${k}`;
                const isPreset = 工艺说明Keys.includes(
                  k as (typeof 工艺说明Keys)[number],
                );
                return (
                  <EditableRow
                    key={k}
                    label={k}
                    error={isPreset ? errors?.[errorKey] : undefined}
                  >
                    <input
                      type="text"
                      className={`${inputCls}${isPreset && errors?.[errorKey] ? " border-rose-400 focus:ring-rose-200" : ""}`}
                      value={v}
                      onChange={(e) => {
                        if (isPreset) {
                          clearError?.(errorKey);
                        }
                        set规格书("工艺说明", {
                          ...value.制品规格书.工艺说明,
                          [k]: e.target.value,
                        });
                      }}
                    />
                  </EditableRow>
                );
              })}
            </div>
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
  enableSplitDmlSizing = false,
  制品规格书详情,
  当前胶丝比例详情,
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
    return (
      <FileDraftReadonlySections
        value={value}
        制品规格书详情={制品规格书详情}
        hatMakingList={hatMakingList}
      />
    );
  }

  if (!onChange) {
    throw new Error("FileDraftDataSections edit 模式必须提供 onChange");
  }

  return (
    <FileDraftEditSections
      value={value}
        enableSplitDmlSizing={enableSplitDmlSizing}
      当前胶丝比例详情={当前胶丝比例详情}
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
