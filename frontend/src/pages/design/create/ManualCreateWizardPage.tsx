import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { callApi } from "../../../api/callApi";
import { useApi } from "../../../hooks/useApi";
import FileEditorPage from "../../../modules/fileDraft/FileEditorPage";
import { fromDbToFileDraftViewModel } from "../../../shared/fileDraft/adapters/fromDbToFileDraftViewModel";
import { toDbPayload } from "../../../shared/fileDraft/adapters/toDbPayload";
import type { FileDraftViewModel } from "../../../shared/fileDraft/model";
import type { 沐茵丝假发成品稿 } from "../../../shared/db/Db沐茵丝假发成品稿";
import { emptyFile } from "../../admin/add-file/defaults";

function makeSaveAsDraft(source: FileDraftViewModel): FileDraftViewModel {
  const cloned = JSON.parse(JSON.stringify(source)) as FileDraftViewModel;
  const sampleNo = cloned.样品编号?.trim();
  const fileName = cloned.文件名称?.trim();
  return {
    ...cloned,
    _id: "",
    样品编号: sampleNo ? `${sampleNo}-副本` : "",
    文件名称: fileName ? `${fileName}-副本` : "",
    tag: "草稿",
  };
}

export default function ManualCreateWizardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as
    | {
        initialValue?: FileDraftViewModel;
        copyFromId?: string;
        title?: string;
      }
    | undefined;

  const copyFromId = state?.copyFromId?.trim() || "";
  const copyState = useApi(() =>
    copyFromId
      ? callApi("admin/file/GetDetail", { id: copyFromId })
      : Promise.resolve({ isSucc: true as const, res: null as never }),
  );
  const rawFile = (copyState.data as { rawFile?: 沐茵丝假发成品稿 } | undefined)
    ?.rawFile;

  const initialValue = useMemo((): FileDraftViewModel | null => {
    // Explicit initialValue wins (used by other entry points / tests).
    if (state?.initialValue) {
      return JSON.parse(JSON.stringify(state.initialValue)) as FileDraftViewModel;
    }

    // Save-as flow: wait until the source draft is fetched; otherwise FileEditorPage
    // would initialize with emptyFile() and keep it (add mode uses empty _id).
    if (copyFromId) {
      if (!rawFile) return null;
      return makeSaveAsDraft(fromDbToFileDraftViewModel(rawFile));
    }

    // Regular manual create.
    return emptyFile();
  }, [copyFromId, rawFile, state?.initialValue]);

  const pageTitle = useMemo(() => {
    if (state?.title) return state.title;
    if (!copyFromId) return "产品规格系统 · 手动添加成品稿";
    const name = initialValue?.样品编号 || initialValue?.品名 || copyFromId;
    return `另存为稿件 · ${name}`;
  }, [copyFromId, initialValue, state?.title]);

  return (
    <FileEditorPage
      mode="add"
      title={pageTitle}
      onBack={() => navigate(copyFromId ? `/file/${copyFromId}` : "/designs")}
      initialValue={initialValue}
      loading={Boolean(copyFromId) ? copyState.loading : false}
      error={Boolean(copyFromId) ? copyState.error : ""}
      allowTestData
      submitLabel="保存成品稿"
      submittingLabel="保存中…"
      onSubmit={async (form) => {
        const r = await callApi("admin/file/Add", { file: toDbPayload(form) });
        if (!r.isSucc) {
          throw new Error(r.err.message);
        }
        return { id: r.res.id };
      }}
      onSubmitted={() => navigate("/designs", { replace: true })}
    />
  );
}
