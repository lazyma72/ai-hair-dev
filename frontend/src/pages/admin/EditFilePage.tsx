import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { callApi } from "../../api/callApi";
import { useApi } from "../../hooks/useApi";
import FileEditorPage from "../../modules/fileDraft/FileEditorPage";
import { fromDbToFileDraftViewModel } from "../../shared/fileDraft/adapters/fromDbToFileDraftViewModel";
import { toDbPayload } from "../../shared/fileDraft/adapters/toDbPayload";
import type { 沐茵丝假发成品稿 } from "../../shared/db/Db沐茵丝假发成品稿";

export default function EditFilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, loading, error } = useApi(() =>
    callApi("admin/file/GetDetail", { id: id! }),
  );

  const form = useMemo(() => {
    const rawFile = (data as { rawFile?: 沐茵丝假发成品稿 } | undefined)?.rawFile;
    return rawFile ? fromDbToFileDraftViewModel(rawFile) : null;
  }, [data]);

  return (
    <FileEditorPage
      mode="edit"
      title={form ? `编辑成品稿 · ${form.样品编号}` : "编辑成品稿"}
      initialValue={form}
      loading={loading}
      error={error}
      submitLabel="保存修改"
      submittingLabel="更新中…"
      onBack={() => navigate(id ? `/file/${id}` : "/designs")}
      onSubmit={async (nextForm) => {
        if (!id) {
          throw new Error("缺少稿件编号");
        }
        const r = (await callApi("admin/file/Update", {
          id,
          file: toDbPayload(nextForm),
        } )) as
          | { isSucc: true; res: { id: string } }
          | { isSucc: false; err: { message: string } };
        if (!r.isSucc) {
          throw new Error(r.err.message);
        }
        return { id: r.res.id };
      }}
      onSubmitted={(nextId) => navigate(`/file/${nextId}`, { replace: true })}
    />
  );
}
