import DraftSvgEditorPage from "../../modules/svgEditor/DraftSvgEditorPage";
import HighNeedleEditorCanvas from "../../modules/svgEditor/HighNeedleEditorCanvas";
import {
  clearHighNeedleEditorDocument,
  clearHighNeedleEditorDocumentSnapshot,
  loadHighNeedleEditorDocumentSnapshot,
  loadHighNeedleEditorDocument,
  saveHighNeedleEditorDocument,
} from "../../modules/svgEditor/highNeedleEditorSessionBridge";

export default function HighNeedleSvgEditorPage() {
  return (
    <DraftSvgEditorPage
      title="高针图"
      missingDraftError="未找到可编辑的稿件草稿，请从编辑页重新进入高针 SVG 编辑器。"
      Canvas={HighNeedleEditorCanvas}
      getValue={(draft) => draft.高针指示单.高针图}
      setValue={(draft, value) => ({
        ...draft,
        高针指示单: {
          ...draft.高针指示单,
          高针图: value,
        },
      })}
      loadEditorDocument={loadHighNeedleEditorDocument}
      saveEditorDocument={saveHighNeedleEditorDocument}
      clearEditorDocument={clearHighNeedleEditorDocument}
      loadEditorDocumentSnapshot={loadHighNeedleEditorDocumentSnapshot}
      clearEditorDocumentSnapshot={clearHighNeedleEditorDocumentSnapshot}
    />
  );
}
