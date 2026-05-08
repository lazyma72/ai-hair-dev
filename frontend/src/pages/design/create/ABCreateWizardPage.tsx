import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { callApi } from "../../../api/callApi";
import DraftCardListSection, {
  DraftCard,
  filterDraftList,
} from "../../../components/DraftCardListSection";
import PageShell from "../../../components/PageShell";
import StatusView from "../../../components/StatusView";
import { useApi } from "../../../hooks/useApi";
import type {
  制品规格书Frontend,
  胶丝比例Frontend,
  沐茵丝假发成品稿ListItem,
} from "../../../shared/frontend/model/model";
import FileEditorPage from "../../../modules/fileDraft/FileEditorPage";
import {
  toDbPayload,
  toPreviewDbFile,
} from "../../../shared/fileDraft/adapters/toDbPayload";
import { fromDbToFileDraftViewModel } from "../../../shared/fileDraft/adapters/fromDbToFileDraftViewModel";
import type { FileDraftViewModel } from "../../../shared/fileDraft/model";
import type { 沐茵丝假发成品稿 } from "../../../shared/db/Db沐茵丝假发成品稿";
import type { Db胶丝比例 } from "../../../shared/db/Db胶丝比例";
import type { Db制帽 } from "../../../shared/db/Db制帽";
import FileDraftDocumentSections from "../../../modules/fileDraft/FileDraftDocumentSections";
import { to高针指示单Frontend } from "../../../shared/frontend/converters/to高针指示单Frontend";
import { to手织指示单Frontend } from "../../../shared/frontend/converters/to手织指示单Frontend";
import { to制品规格书Frontend } from "../../../shared/frontend/converters/to制品规格书Frontend";
import type {
  ResGetList,
} from "../../../shared/protocols/admin/file/PtlGetList";
import { loadFileDraftSession } from "../../../modules/fileDraft/fileDraftSessionBridge";

const STEPS = ["选择A稿", "选择B稿", "预览C稿"] as const;

type HatMakingOption = {
  _id: string;
  名称?: string;
  帽围: number;
  帽深: number;
  前后: number;
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

function withNewId(file: FileDraftViewModel, id: string): FileDraftViewModel {
  return {
    ...(JSON.parse(JSON.stringify(file)) as FileDraftViewModel),
    _id: id,
    样品编号: file.样品编号 || id,
    tag: "草稿",
  };
}

function getHatMakingIdFromCAP(cap: string): string {
  return cap.trim().match(/^[^（(\s]+/)?.[0] ?? "";
}

function fetchFileList(req: {
  omitIdList?: string[];
  pageNum?: number;
  pageSize?: number;
  keyword?: string;
  orderSort?: "asc" | "desc";
  filter?: {
    客户编号?: string;
    品名?: string;
    原材料?: string;
    假发类型?: 沐茵丝假发成品稿["假发类型"];
    CAP?: string;
  };
}) {
  return callApi("admin/file/GetList" as never, req as never) as Promise<
    | { isSucc: true; res: ResGetList }
    | { isSucc: false; err: { message: string } }
  >;
}

export default function ABCreateWizardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(0);
  const [aId, setAId] = useState<string>("");
  const [bId, setBId] = useState<string>("");
  const [aKeyword, setAKeyword] = useState("");
  const [bKeyword, setBKeyword] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingC, setLoadingC] = useState(false);
  const [errorC, setErrorC] = useState("");
  const [cDraft, setCDraft] = useState<FileDraftViewModel | null>(null);
  const [restoredFromSession, setRestoredFromSession] = useState(false);
  const [hatMakingList, setHatMakingList] = useState<HatMakingOption[]>([]);
  const [loadingHatMakingList, setLoadingHatMakingList] = useState(false);
  const [hatMakingError, setHatMakingError] = useState("");
  const [currentRatioDetail, setCurrentRatioDetail] = useState<胶丝比例Frontend | null>(
    null,
  );
  const [loadingRatioDetail, setLoadingRatioDetail] = useState(false);
  const [ratioError, setRatioError] = useState("");
  const draftKey = useMemo(
    () => new URLSearchParams(location.search).get("draftKey")?.trim() ?? "",
    [location.search],
  );

  const aListState = useApi(() =>
    fetchFileList({
      pageNum: 1,
      pageSize: 1000,
      orderSort: "desc",
    }),
  );
  const bListState = useApi(() =>
    fetchFileList({
      omitIdList: aId ? [aId] : undefined,
      pageNum: 1,
      pageSize: 1000,
      orderSort: "desc",
    }),
  );
  const aList = useMemo<沐茵丝假发成品稿ListItem[]>(
    () => aListState.data?.list ?? [],
    [aListState.data],
  );
  const bList = useMemo<沐茵丝假发成品稿ListItem[]>(
    () => bListState.data?.list ?? [],
    [bListState.data],
  );
  const reloadBList = bListState.reload;
  const filteredAList = useMemo(() => filterDraftList(aList, aKeyword), [aKeyword, aList]);
  const filteredBList = useMemo(() => filterDraftList(bList, bKeyword), [bKeyword, bList]);
  const currentHatMaking = useMemo(
    () =>
      cDraft
        ? hatMakingList.find((item) => item._id === getHatMakingIdFromCAP(cDraft.CAP)) ?? null
        : null,
    [cDraft, hatMakingList],
  );
  const preview高针数据 = useMemo(
    () => (cDraft ? to高针指示单Frontend(toPreviewDbFile(cDraft)) : null),
    [cDraft],
  );
  const preview手织数据 = useMemo(
    () => (cDraft ? to手织指示单Frontend(toPreviewDbFile(cDraft)) : null),
    [cDraft],
  );
  const preview制品规格书详情 = useMemo<制品规格书Frontend | null>(() => {
    if (!cDraft || !currentHatMaking || !currentRatioDetail) {
      return null;
    }
    const previewDbFile = toDbPayload(cDraft) as unknown as 沐茵丝假发成品稿;
    const hatMaking: Db制帽 = {
      _id: currentHatMaking._id,
      名称: currentHatMaking.名称 ?? "",
      帽围: currentHatMaking.帽围,
      帽深: currentHatMaking.帽深,
      前后: currentHatMaking.前后,
      帽网款式: "",
      备注: "",
    };
    return to制品规格书Frontend(
      previewDbFile,
      currentRatioDetail as unknown as Db胶丝比例,
      hatMaking,
    );
  }, [cDraft, currentHatMaking, currentRatioDetail]);
  const previewError =
    errorC ||
    ratioError ||
    hatMakingError ||
    (cDraft && !loadingHatMakingList && !currentHatMaking ? "找不到对应的制帽规格" : "");
  const previewLoading =
    loadingC || loadingHatMakingList || (Boolean(cDraft) && loadingRatioDetail);

  useEffect(() => {
    let cancelled = false;
    setLoadingHatMakingList(true);
    setHatMakingError("");
    void callApi(
      "admin/hatMaking/GetList" as never,
      {
        pageNum: 1,
        pageSize: 1000,
        orderSort: "asc",
      } as never,
    )
      .then((r) => {
        if (cancelled) return;
        const res = r as
          | { isSucc: true; res: { list: HatMakingOption[] } }
          | { isSucc: false; err: { message: string } };
        if (!res.isSucc) {
          setHatMakingError(res.err.message);
          return;
        }
        setHatMakingList(res.res.list);
      })
      .catch((e) => {
        if (cancelled) return;
        setHatMakingError(e instanceof Error ? e.message : "加载制帽规格失败");
      })
      .finally(() => {
        if (!cancelled) setLoadingHatMakingList(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!draftKey) return;
    const restoredDraft = loadFileDraftSession(draftKey);
    if (!restoredDraft) return;
    setCDraft(restoredDraft);
    setEditing(true);
    setStep(2);
    setRestoredFromSession(true);
  }, [draftKey]);

  useEffect(() => {
    // A/B 变化时，清空 C 草稿，避免引用旧数据
    if (restoredFromSession && !aId && !bId) return;
    setCDraft(null);
    setErrorC("");
    setCurrentRatioDetail(null);
    setRatioError("");
    if (restoredFromSession) {
      setRestoredFromSession(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aId, bId, restoredFromSession]);

  useEffect(() => {
    reloadBList();
  }, [aId, reloadBList]);

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

  useEffect(() => {
    const 发丝种类 = cDraft?.制品规格书.胶丝比例id.发丝种类?.trim() ?? "";
    const 颜色编号 = cDraft?.制品规格书.胶丝比例id.颜色编号?.trim() ?? "";
    if (!发丝种类 || !颜色编号) {
      setCurrentRatioDetail(null);
      setRatioError("");
      return;
    }

    let cancelled = false;
    setLoadingRatioDetail(true);
    setRatioError("");
    void callApi("admin/ratio/GetDetail", { 发丝种类, 颜色编号 })
      .then((r) => {
        if (cancelled) return;
        if (!r.isSucc) {
          setCurrentRatioDetail(null);
          setRatioError(r.err.message);
          return;
        }
        setCurrentRatioDetail(r.res.胶丝比例);
      })
      .catch((e) => {
        if (cancelled) return;
        setCurrentRatioDetail(null);
        setRatioError(e instanceof Error ? e.message : "加载胶丝比例失败");
      })
      .finally(() => {
        if (!cancelled) setLoadingRatioDetail(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    cDraft?.制品规格书.胶丝比例id.发丝种类,
    cDraft?.制品规格书.胶丝比例id.颜色编号,
  ]);

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
      <StatusView loading={previewLoading} error={previewError}>
        {cDraft ? (
          editing ? (
            <FileEditorPage
              mode="add"
              title={`编辑 C 稿（未保存）· A:${aId} + B:${bId}`}
              initialValue={cDraft}
              enableSplitDmlSizing
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
              {preview制品规格书详情 && preview高针数据 && preview手织数据 ? (
                <FileDraftDocumentSections
                  mode="readonly"
                  value={cDraft}
                  制品规格书详情={preview制品规格书详情}
                  hatMakingList={hatMakingList}
                  高针数据={preview高针数据}
                  手织数据={preview手织数据}
                />
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
        <DraftCardListSection
          title="选择 A 稿"
          description="C 稿以 A 为基础（具体以接口规则为准）。"
          list={filteredAList}
          keyword={aKeyword}
          onKeywordChange={setAKeyword}
          loading={aListState.loading}
          error={aListState.error}
          emptyText="暂无可选 A 稿"
          summaryText={`共 ${filteredAList.length} 条${aId ? "，已选择 1 条" : ""}`}
          renderCard={(item) => (
            <DraftCard
              item={item}
              selected={item._id === aId}
              badgeText={item._id === aId ? "已选择" : item.客户编号}
              onClick={() => setAId((prev) => (prev === item._id ? "" : item._id))}
            />
          )}
        />
      ) : null}

      {step === 1 ? (
        <DraftCardListSection
          title="选择 B 稿"
          description="后端会按 B 的假发类型套用生成规则（纯色/间色/上下分/T色）。"
          list={filteredBList}
          keyword={bKeyword}
          onKeywordChange={setBKeyword}
          loading={bListState.loading}
          error={bListState.error}
          emptyText="暂无可选 B 稿"
          summaryText={`共 ${filteredBList.length} 条${bId ? "，已选择 1 条" : ""}`}
          renderCard={(item) => (
            <DraftCard
              item={item}
              selected={item._id === bId}
              badgeText={item._id === bId ? "已选择" : item.客户编号}
              onClick={() => setBId((prev) => (prev === item._id ? "" : item._id))}
            />
          )}
        />
      ) : null}
    </PageShell>
  );
}
