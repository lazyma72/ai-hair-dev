import DraftSvgEditorPage from "../../modules/svgEditor/DraftSvgEditorPage";
import HandWovenEditorCanvas, {
  type HandWovenSvgValue,
} from "../../modules/svgEditor/HandWovenEditorCanvas";
import {
  clearHandWovenEditorDocument,
  clearHandWovenEditorDocumentSnapshot,
  loadHandWovenEditorDocument,
  loadHandWovenEditorDocumentSnapshot,
  saveHandWovenEditorDocument,
} from "../../modules/svgEditor/handWovenEditorSessionBridge";

export default function HandWovenSvgEditorPage() {
  return (
    <DraftSvgEditorPage
      title="手织图"
      missingDraftError="未找到可编辑的稿件草稿，请从编辑页重新进入手织图 SVG 编辑器。"
      Canvas={HandWovenEditorCanvas}
      getValue={(draft) => draft.手织指示单.手织图 as HandWovenSvgValue}
      setValue={(draft, value) => ({
        ...draft,
        手织指示单: {
          ...draft.手织指示单,
          手织图: value,
        },
      })}
      loadEditorDocument={loadHandWovenEditorDocument}
      saveEditorDocument={saveHandWovenEditorDocument}
      clearEditorDocument={clearHandWovenEditorDocument}
      loadEditorDocumentSnapshot={loadHandWovenEditorDocumentSnapshot}
      clearEditorDocumentSnapshot={clearHandWovenEditorDocumentSnapshot}
    />
  );
}
