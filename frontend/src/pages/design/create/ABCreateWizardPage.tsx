import { Select } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { callApi } from "../../../api/callApi";
import PageShell from "../../../components/PageShell";
import StatusView from "../../../components/StatusView";
import { useApi } from "../../../hooks/useApi";
import type {
  沐茵丝假发成品稿ListItem,
} from "../../../shared/frontend/model/model";
import FileEditorPage from "../../../modules/fileDraft/FileEditorPage";
import { toDbPayload } from "../../../shared/fileDraft/adapters/toDbPayload";
import { fromDbToFileDraftViewModel } from "../../../shared/fileDraft/adapters/fromDbToFileDraftViewModel";
import type { FileDraftViewModel } from "../../../shared/fileDraft/model";
import DocumentTabs from "../../../modules/fileDraft/DocumentTabs";
import FileDraftDataSections from "../../../modules/fileDraft/FileDraftDataSections";
import { to手织指示单Frontend } from "../../../shared/frontend/converters/to手织指示单Frontend";
import { to高针指示单Frontend } from "../../../shared/frontend/converters/to高针指示单Frontend";
import 高针指示单View from "../../file/sections/高针指示单View";
import 手织指示单View from "../../file/sections/手织指示单View";

const STEPS = ["选择A稿", "选择B稿", "预览C稿"] as const;
const PREVIEW_TABS = [
  { key: "制品规格书", label: "制品规格书" },
  { key: "高针指示单", label: "高针指示单" },
  { key: "手织指示单", label: "手织指示单" },
] as const;
type PreviewTabKey = (typeof PREVIEW_TABS)[number]["key"];

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

function withNewId(file: FileDraftViewModel, id: string): FileDraftViewModel {
  return {
    ...(JSON.parse(JSON.stringify(file)) as FileDraftViewModel),
    _id: id,
    样品编号: file.样品编号 || id,
  };
}

export default function ABCreateWizardPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [aId, setAId] = useState<string>("");
  const [bId, setBId] = useState<string>("");
  const [previewTab, setPreviewTab] = useState<PreviewTabKey>("制品规格书");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [loadingC, setLoadingC] = useState(false);
  const [errorC, setErrorC] = useState("");
  const [cDraft, setCDraft] = useState<FileDraftViewModel | null>(null);

  const listState = useApi(() =>
    callApi("admin/file/GetList", {
      pageNum: 1,
      pageSize: 1000,
      orderSort: "desc",
    }),
  );
  const list = useMemo<沐茵丝假发成品稿ListItem[]>(
    () => listState.data?.list ?? [],
    [listState.data],
  );

  const options = useMemo(
    () =>
      list.map((x) => ({
        value: x._id,
        label: `${(x as any).样品编号 ?? x._id} · ${x.客户编号} · ${x.品名}`,
      })),
    [list],
  );

  useEffect(() => {
    // A/B 变化时，清空 C 草稿，避免引用旧数据
    setCDraft(null);
    setErrorC("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aId, bId]);

  const canNext =
    (step === 0 && Boolean(aId)) ||
    (step === 1 && Boolean(bId)) ||
    (step === 2 && Boolean(aId) && Boolean(bId));

  useEffect(() => {
    if (step !== 2) return;
    if (!aId || !bId) return;
    if (cDraft) return;

    let cancelled = false;
    setLoadingC(true);
    setErrorC("");
    void callApi("admin/file/GenerateByAB", { fileAId: aId, fileBId: bId })
      .then((r) => {
        if (cancelled) return;
        if (!r.isSucc) {
          setErrorC(r.err.message);
          return;
        }
        // 后端生成的文件默认会沿用 A 的 _id；前端这里改成新 id，便于直接保存为新稿。
        setCDraft(withNewId(fromDbToFileDraftViewModel(r.res.file), `C-${aId}-${bId}`));
      })
      .catch((e) => {
        if (cancelled) return;
        setErrorC(e instanceof Error ? e.message : "请求失败");
      })
      .finally(() => {
        if (!cancelled) setLoadingC(false);
      });

    return () => {
      cancelled = true;
    };
  }, [aId, bId, cDraft, step]);

  const actions = (
    <div className="flex items-center gap-2">
      {step > 0 ? (
        <button
          type="button"
          className="rounded bg-slate-100 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-200"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
        >
          上一步
        </button>
      ) : null}

      {step === 2 ? (
        <>
          <button
            type="button"
            disabled={!cDraft}
            className="rounded border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            onClick={() => setEditing(true)}
          >
            编辑
          </button>
          <button
            type="button"
            disabled={!cDraft || saving}
            className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            onClick={async () => {
              if (!cDraft) return;
              if (saving) return;
              setSaving(true);
              try {
                const r = await callApi("admin/file/Add", {
                  file: toDbPayload(cDraft),
                });
                if (!r.isSucc) {
                  throw new Error(r.err.message);
                }
                navigate("/designs", { replace: true });
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? "保存中…" : "保存"}
          </button>
        </>
      ) : null}

      {step < STEPS.length - 1 ? (
        <button
          type="button"
          disabled={!canNext}
          className="rounded bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
        >
          下一步
        </button>
      ) : null}
    </div>
  );

  if (step === 2) {
    return (
      <StatusView loading={loadingC} error={errorC}>
        {cDraft ? (
          editing ? (
            <FileEditorPage
              mode="add"
              title={`编辑 C 稿（未保存）· A:${aId} + B:${bId}`}
              initialValue={cDraft}
              submitLabel="保存 C 稿"
              submittingLabel="保存中…"
              onBack={() => setEditing(false)}
              extraActions={
                <>
                  <button
                    type="button"
                    className="rounded border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    onClick={() => setEditing(false)}
                  >
                    返回预览
                  </button>
                  <button
                    type="button"
                    className="rounded border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    onClick={() => {
                      setEditing(false);
                      setStep(1);
                    }}
                  >
                    上一步
                  </button>
                </>
              }
              onDraftChange={setCDraft}
              onSubmit={async (form) => {
                const r = await callApi("admin/file/Add", {
                  file: toDbPayload(form),
                });
                if (!r.isSucc) {
                  throw new Error(r.err.message);
                }
                return { id: r.res.id };
              }}
              onSubmitted={() => navigate("/designs", { replace: true })}
            />
          ) : (
            <PageShell
              title={`C 稿预览（未保存）· ${cDraft.样品编号}`}
              onBack={() => setStep(1)}
              actions={actions}
            >
              <DocumentTabs
                items={PREVIEW_TABS}
                activeKey={previewTab}
                onChange={setPreviewTab}
              />

              {previewTab === "制品规格书" ? (
                <FileDraftDataSections mode="readonly" value={cDraft} />
              ) : null}

              {previewTab === "高针指示单" ? (
                <高针指示单View data={to高针指示单Frontend(toDbPayload(cDraft))} />
              ) : null}

              {previewTab === "手织指示单" ? (
                <手织指示单View data={to手织指示单Frontend(toDbPayload(cDraft))} />
              ) : null}
            </PageShell>
          )
        ) : null}
      </StatusView>
    );
  }

  return (
    <PageShell
      title="产品规格系统 · 选择 A + B 生成 C 稿"
      onBack={() => navigate("/designs/create")}
      actions={actions}
    >
      <Stepper step={step} />

      {step === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-sm font-semibold text-slate-900">选择 A 稿</div>
          <div className="mt-1 text-xs text-slate-500">
            C 稿以 A 为基础（具体以接口规则为准）。
          </div>
          <div className="mt-3">
            <Select
              className="w-full"
              value={aId || undefined}
              options={options}
              placeholder="选择 A 稿"
              allowClear
              showSearch
              optionFilterProp="label"
              onChange={(v) => setAId(v ?? "")}
            />
          </div>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-sm font-semibold text-slate-900">选择 B 稿</div>
          <div className="mt-1 text-xs text-slate-500">
            后端会按 B 的假发类型套用生成规则（纯色/间色/上下分/T色）。
          </div>
          <div className="mt-3">
            <Select
              className="w-full"
              value={bId || undefined}
              options={options}
              placeholder="选择 B 稿"
              allowClear
              showSearch
              optionFilterProp="label"
              onChange={(v) => setBId(v ?? "")}
            />
          </div>
        </div>
      ) : null}
    </PageShell>
  );
}
