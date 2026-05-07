import React from "react";
import type {
  DocumentState,
  高针图业务数据,
} from "../../../../../../personal_test/svg_editor/edit/exported-react-component/layers/data/types";
import {
  applyDmlModifiers,
} from "../../../../../../personal_test/svg_editor/edit/exported-react-component/layers/businessCommands/markDmlAnnotations";
import type { 高针图 } from "../../shared/models/高针图";
import SvgEditorCanvas, {
  type SvgEditorCanvasHandle,
} from "./SvgEditorCanvas";
import { createBaseSvgDocument } from "./svgEditorDocument";

type Props = {
  value: 高针图;
  initialDocument?: DocumentState | null;
  onDocumentStateChange?: (document: DocumentState) => void;
  fileName?: string | null;
  heightClassName?: string;
  headerRight?: React.ReactNode;
};

export type HighNeedleEditorCanvasHandle = SvgEditorCanvasHandle<高针图>;

function createEditorDocumentName(fileName?: string | null) {
  return fileName?.trim() || "高针图";
}

function toEditorDomain(value: 高针图): 高针图业务数据 {
  return {
    车线: Array.isArray(value.车线) ? value.车线 : [],
    标注样式: value.标注样式 ?? {},
    自动修改器: value.自动修改器 ?? [],
  };
}

function createDocumentFromHighNeedle(
  value: 高针图,
  fileName?: string | null,
): DocumentState {
  return {
    ...createBaseSvgDocument({
      name: createEditorDocumentName(fileName),
      svg: value.svg,
      sourceName: fileName,
      domain: toEditorDomain(value),
    }),
    domain: toEditorDomain(value),
  };
}

function toHighNeedleValue(document: DocumentState, svg: string): 高针图 {
  const persisted = applyDmlModifiers({
    ...document,
    meta: {
      ...document.meta,
      updatedAt: new Date().toISOString(),
    },
  });

  return {
    json: JSON.stringify(persisted),
    svg,
    车线: persisted.domain.车线.map((item) => ({
      id: item.id,
      编号: item.编号,
      区域: item.区域,
      车线编号: String((item as { 车线编号?: unknown }).车线编号 ?? ""),
      尺数: item.尺数,
      档位: item.档位,
      DML: item.DML,
      是双数: item.是双数,
      标注NodeId: {
        车线编号: item.标注NodeId.车线编号,
        档位: item.标注NodeId.档位,
        单双: item.标注NodeId.单双,
        DML: item.标注NodeId.DML,
      },
    })),
    标注样式: persisted.domain.标注样式,
    自动修改器: persisted.domain.自动修改器,
  };
}

const HighNeedleEditorCanvas = React.forwardRef<
  HighNeedleEditorCanvasHandle,
  Props
>(function HighNeedleEditorCanvas(
  {
    value,
    initialDocument,
    onDocumentStateChange,
    fileName,
    heightClassName = "h-[calc(100vh-160px)] min-h-[640px]",
    headerRight,
  }: Props,
  ref,
) {
  return (
    <SvgEditorCanvas
      ref={ref}
      value={value}
      initialDocument={initialDocument}
      onDocumentStateChange={onDocumentStateChange}
      fileName={fileName}
      heightClassName={heightClassName}
      headerRight={headerRight}
      createDocumentFromValue={createDocumentFromHighNeedle}
      toValue={toHighNeedleValue}
    />
  );
});

export default HighNeedleEditorCanvas;
