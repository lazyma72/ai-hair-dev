import { message } from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import { callApi } from "../../api/callApi";
import PageShell from "../../components/PageShell";
import StatusView from "../../components/StatusView";
import type { DbCustomer } from "../../shared/db/DbCustomer";
import type {
  胶丝比例Frontend,
  胶丝比例ListItem,
} from "../../shared/frontend/model/model";
import { to手织指示单Frontend } from "../../shared/frontend/converters/to手织指示单Frontend";
import { to高针指示单Frontend } from "../../shared/frontend/converters/to高针指示单Frontend";
import type { FileDraftViewModel } from "../../shared/fileDraft/model";
import { createTestFileDraft } from "../../pages/admin/add-file/defaults";
import { validate染色档位列表 } from "../../pages/admin/add-file/components/DyeLevelEditor";
import FileDraftDocumentSections from "./FileDraftDocumentSections";
import {
  toPreviewDbFile,
} from "../../shared/fileDraft/adapters/toDbPayload";
import { 假发类型 } from "../../shared/db/Db沐茵丝假发成品稿";
import { recalc机器规格清单上下分重量 } from "../../shared/models/重量计算";
import {
  按高针图回算机器规格清单上下分尺数,
  提取高针图上下分标记,
} from "../../shared/models/上下分计算尺数";

const MAX_CUT_WEIGHT_ITEMS = 3;
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
  enableSplitDmlSizing?: boolean;
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
  enableSplitDmlSizing = false,
}: Props) {
  const [form, setForm] = useState<FileDraftViewModel | null>(initialValue);
  const [ratioList, setRatioList] = useState<胶丝比例ListItem[]>([]);
  const [currentRatioDetail, setCurrentRatioDetail] = useState<胶丝比例Frontend | null>(null);
  const [hatMakingList, setHatMakingList] = useState<HatMakingOption[]>([]);
  const [customerList, setCustomerList] = useState<DbCustomer[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const loadedDraftIdRef = useRef<string | null>(initialValue?._id ?? null);

  useEffect(() => {
    const nextId = initialValue?._id ?? null;
    if (form == null) {
      setForm(initialValue);
      loadedDraftIdRef.current = nextId;
      return;
    }
    if (nextId !== loadedDraftIdRef.current) {
      setForm(initialValue);
      loadedDraftIdRef.current = nextId;
    }
  }, [form, initialValue]);

  // `useApi` may set `loading=true` on the next tick, which can cause a brief
  // empty-state flash when `initialValue` is still null in edit mode.
  const effectiveLoading =
    loading || (mode === "edit" && !initialValue && !error);

  useEffect(() => {
    if (!form) return;
    onDraftChange?.(form);
  }, [form, onDraftChange]);

  useEffect(() => {
    if (
      !enableSplitDmlSizing ||
      !form ||
      form.假发类型 !== 假发类型.上下分
    ) {
      return;
    }

    const splitFlags = 提取高针图上下分标记(form.高针指示单.高针图);
    const nextMachineRows = recalc机器规格清单上下分重量(
      按高针图回算机器规格清单上下分尺数(
        form.制品规格书.机器规格清单,
        form.高针指示单.高针图,
        splitFlags,
      ),
      splitFlags,
    );

    if (
      JSON.stringify(nextMachineRows) ===
      JSON.stringify(form.制品规格书.机器规格清单)
    ) {
      return;
    }

    setForm((prev) => {
      if (!prev || prev.假发类型 !== 假发类型.上下分) return prev;
      return {
        ...prev,
        制品规格书: {
          ...prev.制品规格书,
          机器规格清单: nextMachineRows,
        },
      };
    });
  }, [enableSplitDmlSizing, form]);

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

  useEffect(() => {
    const 发丝种类 = form?.制品规格书.胶丝比例id.发丝种类?.trim();
    const 颜色编号 = form?.制品规格书.胶丝比例id.颜色编号?.trim();
    if (!发丝种类 || !颜色编号) {
      setCurrentRatioDetail(null);
      return;
    }

    let cancelled = false;
    callApi("admin/ratio/GetDetail", { 发丝种类, 颜色编号 }).then((r) => {
      if (cancelled) return;
      if (r.isSucc) setCurrentRatioDetail(r.res.胶丝比例);
      else setCurrentRatioDetail(null);
    });
    return () => {
      cancelled = true;
    };
  }, [
    form?.制品规格书.胶丝比例id.发丝种类,
    form?.制品规格书.胶丝比例id.颜色编号,
  ]);

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

  const 高针数据 = useMemo(
    () => (form ? to高针指示单Frontend(toPreviewDbFile(form)) : null),
    [form],
  );
  const 手织数据 = useMemo(
    () => (form ? to手织指示单Frontend(toPreviewDbFile(form)) : null),
    [form],
  );
  const displayTitle = useMemo(() => {
    const sampleNo = form?.样品编号?.trim();
    if (!sampleNo || sampleNo === "无") {
      return title;
    }
    if (title.trim() === "无") {
      return sampleNo;
    }
    if (/·\s*无$/.test(title)) {
      return title.replace(/·\s*无$/, `· ${sampleNo}`);
    }
    return title;
  }, [form?.样品编号, title]);

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

  function importExcelData(_file: File) {
    fillTestData();
  }

  async function handleSubmit() {
    if (!form) return;

    const required: Array<{ name: string; value: string }> = [
      { name: "样品编号", value: form.样品编号 },
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
        return;
      }
    }

    const dyeCheck = validate染色档位列表(form.染色档位列表);
    if (!dyeCheck.ok) {
      setSubmitError(dyeCheck.message);
      message.error(dyeCheck.message);
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
      return;
    }

    if (!form.高针指示单.高针图.svg.trim()) {
      const msg = "请先选择高针图 SVG 并完成标注";
      setSubmitError(msg);
      message.error(msg);
      return;
    }

    if (!form.手织指示单.手织图.svg.trim()) {
      const msg = "请先选择手织图 SVG 并完成标注";
      setSubmitError(msg);
      message.error(msg);
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
      title={displayTitle}
      onBack={onBack}
      actions={actions}
      compact
    >
      {submitError ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {submitError}
        </div>
      ) : null}

      <StatusView
        loading={effectiveLoading}
        error={error ?? ""}
        empty={!form && !effectiveLoading}
        emptyText={mode === "add" ? "暂无初始稿件数据" : "暂无稿件数据"}
      >
        {form ? (
          <FileDraftDocumentSections
            mode="edit"
            value={form}
            enableSplitDmlSizing={enableSplitDmlSizing}
            onChange={updateForm}
            customerList={customerList}
            hatMakingList={hatMakingList}
            当前胶丝比例详情={currentRatioDetail}
            发丝种类选项={发丝种类选项}
            颜色编号选项={当前发丝种类颜色编号列表}
            全部档位名={全部档位名}
            allowTestData={allowTestData}
            onFillTestData={fillTestData}
            onImportExcelData={importExcelData}
            高针数据={高针数据}
            手织数据={手织数据}
          />
        ) : null}
      </StatusView>
    </PageShell>
  );
}
