import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { callApi } from "../../../api/callApi";
import FileEditorPage from "../../../modules/fileDraft/FileEditorPage";
import { fromDbToFileDraftViewModel } from "../../../shared/fileDraft/adapters/fromDbToFileDraftViewModel";
import { toDbPayload } from "../../../shared/fileDraft/adapters/toDbPayload";
import { emptyFile } from "../../admin/add-file/defaults";

export default function ManualCreateWizardPage() {
  const navigate = useNavigate();
  const initialValue = useMemo(
    () => fromDbToFileDraftViewModel(emptyFile()),
    [],
  );

  return (
    <FileEditorPage
      mode="add"
      title="添加成品稿"
      onBack={() => navigate("/designs")}
      initialValue={initialValue}
      allowTestData
      submitLabel="保存成品稿"
      submittingLabel="保存中…"
      onSubmit={async (form) => {
        const r = await callApi("admin/file/Add", { file: toDbPayload(form) });
        if (!r.isSucc) {
          throw new Error(r.err.message);
        }
        return { id: form._id };
      }}
      onSubmitted={() => navigate("/designs", { replace: true })}
    />
  );
}
