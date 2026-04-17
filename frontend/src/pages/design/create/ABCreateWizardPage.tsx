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
import type { 沐茵丝假发成品稿 } from "../../../shared/db/Db沐茵丝假发成品稿";
import FileEditorPage from "../../../modules/fileDraft/FileEditorPage";
import { toDbPayload } from "../../../shared/fileDraft/adapters/toDbPayload";
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

function buildSaveC(
  cId: string,
  a: 沐茵丝假发成品稿,
  b: 沐茵丝假发成品稿,
): 沐茵丝假发成品稿 {
  // 用 A 稿作为基础（客户/品名/规格书等），高针/手织取自 B
  return {
    ...JSON.parse(JSON.stringify(a)),
    _id: cId,
    高针指示单: b.高针指示单,
    手织指示单: b.手织指示单,
  } as 沐茵丝假发成品稿;
}

export default function ABCreateWizardPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [aId, setAId] = useState<string>("");
  const [bId, setBId] = useState<string>("");
  const [previewTab, setPreviewTab] = useState<PreviewTabKey>("制品规格书");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [aRawFile, setARawFile] = useState<沐茵丝假发成品稿 | null>(null);
  const [bRawFile, setBRawFile] = useState<沐茵丝假发成品稿 | null>(null);
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);
  const [errorA, setErrorA] = useState("");
  const [errorB, setErrorB] = useState("");
  const [cDraft, setCDraft] = useState<沐茵丝假发成品稿 | null>(null);

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
        label: `${x._id} · ${x.客户编号} · ${x.品名}`,
      })),
    [list],
  );

  useEffect(() => {
    if (!aId) {
      setARawFile(null);
      setErrorA("");
      return;
    }

    setLoadingA(true);
    setErrorA("");
    void callApi("admin/file/GetDetail", { id: aId })
      .then((r) => {
        if (!r.isSucc) {
          setErrorA(r.err.message);
          return;
        }
        setARawFile(r.res.rawFile);
      })
      .catch((e) => setErrorA(e instanceof Error ? e.message : "请求失败"))
      .finally(() => setLoadingA(false));
  }, [aId]);

  useEffect(() => {
    if (!bId) {
      setBRawFile(null);
      setErrorB("");
      return;
    }

    setLoadingB(true);
    setErrorB("");
    void callApi("admin/file/GetDetail", { id: bId })
      .then((r) => {
        if (!r.isSucc) {
          setErrorB(r.err.message);
          return;
        }
        setBRawFile(r.res.rawFile);
      })
      .catch((e) => setErrorB(e instanceof Error ? e.message : "请求失败"))
      .finally(() => setLoadingB(false));
  }, [bId]);

  useEffect(() => {
    // A/B 变化时，清空 C 草稿，避免引用旧数据
    setCDraft(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aId, bId]);

  const canNext =
    (step === 0 && Boolean(aId)) ||
    (step === 1 && Boolean(bId)) ||
    (step === 2 && Boolean(aId) && Boolean(bId));

  useEffect(() => {
    if (step !== 2) return;
    if (!aRawFile || !bRawFile) return;
    if (cDraft) return;

    setCDraft(
      buildSaveC(`C-${aRawFile._id}-${bRawFile._id}`, aRawFile, bRawFile),
    );
  }, [aRawFile, bRawFile, cDraft, step]);

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
                navigate(`/file/${r.res.id}`, { replace: true });
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
      <StatusView loading={loadingA || loadingB} error={errorA || errorB}>
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
              onSubmitted={(id) => navigate(`/file/${id}`, { replace: true })}
            />
          ) : (
            <PageShell
              title={`C 稿预览（未保存）· ${cDraft._id}`}
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
                <高针指示单View data={to高针指示单Frontend(cDraft)} />
              ) : null}

              {previewTab === "手织指示单" ? (
                <手织指示单View data={to手织指示单Frontend(cDraft)} />
              ) : null}
            </PageShell>
          )
        ) : null}
      </StatusView>
    );
  }

  return (
    <PageShell
      title="选择 A + B 生成 C 稿"
      onBack={() => navigate("/designs/create")}
      actions={actions}
    >
      <Stepper step={step} />

      {step === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-sm font-semibold text-slate-900">选择 A 稿</div>
          <div className="mt-1 text-xs text-slate-500">
            C 稿的“制品规格书”将使用 A 稿的数据。
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
            C 稿的“高针/手织指示单”将使用 B 稿的数据。
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
