import { message } from "antd";
import { useEffect, useMemo, useState } from "react";
import { callApi } from "../../api/callApi";
import PageShell from "../../components/PageShell";
import StatusView from "../../components/StatusView";
import type { DbCustomer } from "../../shared/db/DbCustomer";
import type { 胶丝比例ListItem } from "../../shared/frontend/model/model";
import { to手织指示单Frontend } from "../../shared/frontend/converters/to手织指示单Frontend";
import { to高针指示单Frontend } from "../../shared/frontend/converters/to高针指示单Frontend";
import type { FileDraftViewModel } from "../../shared/fileDraft/model";
import { createTestFileDraft } from "../../pages/admin/add-file/defaults";
import { validate染色档位列表 } from "../../pages/admin/add-file/components/DyeLevelEditor";
import HandWovenSection from "../../pages/admin/add-file/sections/HandWovenSection";
import HighNeedleSection from "../../pages/admin/add-file/sections/HighNeedleSection";
import FileDraftDataSections from "./FileDraftDataSections";
import DocumentTabs from "./DocumentTabs";

const MAX_CUT_WEIGHT_ITEMS = 3;
const EDITOR_TABS = [
  { key: "制品规格书", label: "制品规格书" },
  { key: "高针指示单", label: "高针指示单" },
  { key: "手织指示单", label: "手织指示单" },
] as const;
type EditorTabKey = (typeof EDITOR_TABS)[number]["key"];
type HatMakingOption = {
  _id: string;
  名称?: string;
  帽围: number;
  帽深: number;
  前后: number;
};

type Props = {
  mode: "add" | "edit";
  title: string;
  initialValue: FileDraftViewModel | null;
  loading?: boolean;
  error?: string | null;
  allowTestData?: boolean;
  submitLabel?: string;
  submittingLabel?: string;
  onSubmit: (form: FileDraftViewModel) => Promise<{ id: string }>;
  onBack: () => void;
  onSubmitted: (id: string, form: FileDraftViewModel) => void;
  onDraftChange?: (form: FileDraftViewModel) => void;
  extraActions?: React.ReactNode;
};

function normalizeName(s: string): string {
  return s.trim();
}

export default function FileEditorPage({
  mode,
  title,
  initialValue,
  loading = false,
  error = "",
  allowTestData = false,
  submitLabel,
  submittingLabel,
  onSubmit,
  onBack,
  onSubmitted,
  onDraftChange,
  extraActions,
}: Props) {
  const [form, setForm] = useState<FileDraftViewModel | null>(initialValue);
  const [activeTab, setActiveTab] = useState<EditorTabKey>("制品规格书");
  const [ratioList, setRatioList] = useState<胶丝比例ListItem[]>([]);
  const [hatMakingList, setHatMakingList] = useState<HatMakingOption[]>([]);
  const [customerList, setCustomerList] = useState<DbCustomer[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    setForm(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (!form) return;
    onDraftChange?.(form);
  }, [form, onDraftChange]);

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

    callApi("admin/hatMaking/GetList" as never, {
      pageNum: 1,
      pageSize: 1000,
      orderSort: "asc",
    } as never).then((r) => {
      const res = r as
        | { isSucc: true; res: { list: HatMakingOption[] } }
        | { isSucc: false };
      if (res.isSucc) setHatMakingList(res.res.list);
    });
  }, []);

  const 发丝种类选项 = useMemo(
    () => [...new Set(ratioList.map((r) => r.发丝种类))].sort(),
    [ratioList],
  );

  const 当前发丝种类颜色编号列表 = useMemo(
    () =>
      ratioList
        .filter((r) => r.发丝种类 === form?.制品规格书.胶丝比例id.发丝种类)
        .map((r) => r._id),
    [ratioList, form?.制品规格书.胶丝比例id.发丝种类],
  );

  const 全部档位名 = useMemo(() => {
    if (!form) return [];
    const 机器 = form.制品规格书.机器规格清单
      .map((d) => normalizeName(d.档位))
      .filter(Boolean);
    const 人工 = form.制品规格书.人工规格清单
      .map((d) => normalizeName(d.档位))
      .filter(Boolean);
    return [...机器, ...人工];
  }, [form]);

  const 高针数据 = useMemo(() => (form ? to高针指示单Frontend(form) : null), [form]);
  const 手织数据 = useMemo(() => (form ? to手织指示单Frontend(form) : null), [form]);

  const updateForm: React.Dispatch<React.SetStateAction<FileDraftViewModel>> = (
    next,
  ) => {
    setForm((prev) => {
      if (!prev) return prev;
      return typeof next === "function"
        ? (next as (prevState: FileDraftViewModel) => FileDraftViewModel)(prev)
        : next;
    });
  };

  function fillTestData() {
    const firstCustomerNo = customerList[0]?.客户编号 ?? "";
    const firstRatio = ratioList.find((item) => item.发丝种类 && item._id) ?? null;

    setForm(
      createTestFileDraft({
        customerNo: firstCustomerNo,
        发丝种类: firstRatio?.发丝种类 ?? "",
        颜色编号: firstRatio?._id ?? "",
      }),
    );
    setSubmitError("");
    message.success("已填充测试数据");
  }

  async function handleSubmit() {
    if (!form) return;

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
        setSubmitError(msg);
        message.error(msg);
        setActiveTab("制品规格书");
        return;
      }
    }

    const dyeCheck = validate染色档位列表(form.染色档位列表);
    if (!dyeCheck.ok) {
      setSubmitError(dyeCheck.message);
      message.error(dyeCheck.message);
      setActiveTab("制品规格书");
      return;
    }

    const hasTooManyCutWeights = [
      ...form.制品规格书.机器规格清单,
      ...form.制品规格书.人工规格清单,
    ].some((item) => item.裁断与重量.length > MAX_CUT_WEIGHT_ITEMS);

    if (hasTooManyCutWeights) {
      const msg = `裁断重量项最多 ${MAX_CUT_WEIGHT_ITEMS} 个`;
      setSubmitError(msg);
      message.error(msg);
      setActiveTab("制品规格书");
      return;
    }

    if (!form.高针指示单.高针图.底图.svg.trim()) {
      const msg = "请先选择高针图 SVG 并完成标注";
      setSubmitError(msg);
      message.error(msg);
      setActiveTab("高针指示单");
      return;
    }

    if (!form.手织指示单.手织图.底图.svg.trim()) {
      const msg = "请先选择手织图 SVG 并完成标注";
      setSubmitError(msg);
      message.error(msg);
      setActiveTab("手织指示单");
      return;
    }

    setSubmitError("");
    setSubmitting(true);
    try {
      const res = await onSubmit(form);
      message.success(mode === "add" ? "保存成功" : "更新成功");
      onSubmitted(res.id, form);
    } catch (e) {
      const msg = e instanceof Error ? e.message : mode === "add" ? "保存失败" : "更新失败";
      setSubmitError(msg);
      message.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const actions = (
    <div className="flex items-center gap-2">
      {extraActions}
      <button
        type="button"
        disabled={submitting || !form}
        className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        onClick={() => void handleSubmit()}
      >
        {submitting
          ? (submittingLabel ?? (mode === "add" ? "提交中…" : "更新中…"))
          : (submitLabel ?? (mode === "add" ? "保存成品稿" : "保存修改"))}
      </button>
    </div>
  );

  return (
    <PageShell
      title={title}
      onBack={onBack}
      actions={actions}
    >
      <DocumentTabs
        items={EDITOR_TABS}
        activeKey={activeTab}
        onChange={setActiveTab}
      />

      {submitError ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {submitError}
        </div>
      ) : null}

      <StatusView
        loading={loading}
        error={error ?? ""}
        empty={!form}
        emptyText={mode === "add" ? "暂无初始稿件数据" : "暂无稿件数据"}
      >
        {form ? (
          <div className="space-y-5">
            {activeTab === "制品规格书" ? (
              <>
                {allowTestData ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-amber-900">
                          测试快捷入口
                        </div>
                        <div className="mt-1 text-xs text-amber-700">
                          一键填充制品规格书数据，方便联调与验收。不会自动生成高针图/手织图。
                        </div>
                      </div>
                      <button
                        type="button"
                        className="rounded bg-amber-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-400"
                        onClick={fillTestData}
                      >
                        一键填充测试数据
                      </button>
                    </div>
                  </div>
                ) : null}

                <FileDraftDataSections
                  mode="edit"
                  value={form}
                  onChange={updateForm}
                  customerList={customerList}
                hatMakingList={hatMakingList}
                  发丝种类选项={发丝种类选项}
                  颜色编号选项={当前发丝种类颜色编号列表}
                  全部档位名={全部档位名}
                />
              </>
            ) : null}

            {activeTab === "高针指示单" ? (
              <HighNeedleSection
                value={form.高针指示单}
                onChange={(v) => updateForm((prev) => ({ ...prev, 高针指示单: v }))}
                showJsonImporter={false}
                previewData={高针数据}
                hideUploader={mode === "edit"}
              />
            ) : null}

            {activeTab === "手织指示单" ? (
              <HandWovenSection
                value={form.手织指示单}
                onChange={(v) => updateForm((prev) => ({ ...prev, 手织指示单: v }))}
                previewData={手织数据}
              />
            ) : null}
          </div>
        ) : null}
      </StatusView>
    </PageShell>
  );
}
