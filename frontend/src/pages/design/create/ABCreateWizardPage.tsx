import * as React from "react";
import { Select } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { callApi } from "../../../api/callApi";
import PageShell from "../../../components/PageShell";
import StatusView from "../../../components/StatusView";
import { useApi } from "../../../hooks/useApi";
import type {
  沐茵丝假发成品稿Frontend,
  沐茵丝假发成品稿ListItem,
} from "../../../shared/frontend/model/model";
import 规格书View from "../../file/sections/规格书View";
import 高针指示单View from "../../file/sections/高针指示单View";
import 手织指示单View from "../../file/sections/手织指示单View";

const STEPS = ["选择A稿", "选择B稿", "预览C稿"] as const;

type TabKey = "规格书" | "高针指示单" | "手织指示单";

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "规格书", label: "制品规格书" },
  { key: "高针指示单", label: "高针指示单" },
  { key: "手织指示单", label: "手织指示单" },
];

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

function buildPreviewC(
  a: 沐茵丝假发成品稿Frontend,
  b: 沐茵丝假发成品稿Frontend,
): 沐茵丝假发成品稿Frontend {
  return {
    _id: `PREVIEW-${a._id}+${b._id}`,
    制品规格书: a.制品规格书,
    高针指示单: b.高针指示单,
    手织指示单: b.手织指示单,
  };
}

export default function ABCreateWizardPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [tab, setTab] = useState<TabKey>("规格书");
  const [aId, setAId] = useState<string>("");
  const [bId, setBId] = useState<string>("");

  const [aFile, setAFile] = useState<沐茵丝假发成品稿Frontend | null>(null);
  const [bFile, setBFile] = useState<沐茵丝假发成品稿Frontend | null>(null);
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);
  const [errorA, setErrorA] = useState("");
  const [errorB, setErrorB] = useState("");

  const listState = useApi(() => callApi("file/GetList", {}));
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
      setAFile(null);
      setErrorA("");
      return;
    }

    setLoadingA(true);
    setErrorA("");
    void callApi("file/GetDetail", { id: aId })
      .then((r) => {
        if (!r.isSucc) {
          setErrorA(r.err.message);
          return;
        }
        setAFile(r.res.file);
      })
      .catch((e) => setErrorA(e instanceof Error ? e.message : "请求失败"))
      .finally(() => setLoadingA(false));
  }, [aId]);

  useEffect(() => {
    if (!bId) {
      setBFile(null);
      setErrorB("");
      return;
    }

    setLoadingB(true);
    setErrorB("");
    void callApi("file/GetDetail", { id: bId })
      .then((r) => {
        if (!r.isSucc) {
          setErrorB(r.err.message);
          return;
        }
        setBFile(r.res.file);
      })
      .catch((e) => setErrorB(e instanceof Error ? e.message : "请求失败"))
      .finally(() => setLoadingB(false));
  }, [bId]);

  const canNext =
    (step === 0 && Boolean(aId)) ||
    (step === 1 && Boolean(bId)) ||
    (step === 2 && Boolean(aId) && Boolean(bId));

  const cFile = aFile && bFile ? buildPreviewC(aFile, bFile) : null;

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

      {step === 2 ? (
        <StatusView loading={loadingA || loadingB} error={errorA || errorB}>
          {cFile ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-600">
                C 稿预览（Demo）：规格书来自 A（{aId}），高针/手织来自 B（{bId}）。
              </div>

              <div className="flex gap-2">
                {TABS.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    className={
                      key === tab
                        ? "rounded bg-slate-900 px-3 py-1.5 text-sm text-white"
                        : "rounded bg-white px-3 py-1.5 text-sm text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                    }
                    onClick={() => setTab(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {tab === "规格书" && <规格书View data={cFile.制品规格书} />}
              {tab === "高针指示单" && (
                <高针指示单View data={cFile.高针指示单} />
              )}
              {tab === "手织指示单" && (
                <手织指示单View data={cFile.手织指示单} />
              )}
            </div>
          ) : null}
        </StatusView>
      ) : null}
    </PageShell>
  );
}
