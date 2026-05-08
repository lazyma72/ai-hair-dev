export {
  SvgEditor,
  type SvgEditorProps,
} from "../../../../vender/svg_editor/exported-react-component";
export { EditorProvider } from "../../../../vender/svg_editor/exported-react-component/app/EditorContext";
export { EditorShell } from "../../../../vender/svg_editor/exported-react-component/layers/view/EditorShell";
export {
  createEditor,
  type Editor,
} from "../../../../vender/svg_editor/exported-react-component/kernel/createEditor";
export type {
  DocumentState,
  高针图业务数据,
} from "../../../../vender/svg_editor/exported-react-component/layers/data/types";
export { serializeDocument } from "../../../../vender/svg_editor/exported-react-component/layers/data/serialization";
export { applyDmlModifiers } from "../../../../vender/svg_editor/exported-react-component/layers/businessCommands/markDmlAnnotations";
export { buildExportSvg } from "../../../../vender/svg_editor/exported-react-component/layers/view/FabricStage";
export {
  DEFAULT_VIEW_STATE,
  type ViewState,
} from "../../../../vender/svg_editor/exported-react-component/layers/view/viewState";
export { buildDocumentFromSvgImport } from "../../../../vender/svg_editor/exported-react-component/rendering/fabric/fabricImportExport";
