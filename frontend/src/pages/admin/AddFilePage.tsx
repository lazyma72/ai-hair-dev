import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { callApi } from "../../api/callApi";
import { fromDbToFileDraftViewModel } from "../../shared/fileDraft/adapters/fromDbToFileDraftViewModel";
import { toDbPayload } from "../../shared/fileDraft/adapters/toDbPayload";
import FileEditorPage from "../../modules/fileDraft/FileEditorPage";
import { emptyFile } from "./add-file/defaults";

export default function AddFilePage() {
  const navigate = useNavigate();
  const initialValue = useMemo(
    () => fromDbToFileDraftViewModel(emptyFile()),
    [],
  );

  return (
    <FileEditorPage
      mode="add"
      title="添加成品稿"
      initialValue={initialValue}
      allowTestData
      submitLabel="保存成品稿"
      submittingLabel="提交中…"
      onBack={() => navigate("/admin/files")}
      onSubmit={async (form) => {
        const r = await callApi("admin/file/Add", { file: toDbPayload(form) });
        if (!r.isSucc) {
          throw new Error(r.err.message);
        }
        return { id: form._id };
      }}
      onSubmitted={() => navigate("/admin/files")}
    />
  );
}
