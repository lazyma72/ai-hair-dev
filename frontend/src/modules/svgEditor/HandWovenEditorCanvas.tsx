import React from "react";
import type { 手织图 } from "../../shared/models/手织图";
import SvgEditorCanvas, {
  type SvgEditorCanvasHandle,
} from "./SvgEditorCanvas";
import {
  createBaseSvgDocument,
  type DocumentState,
} from "./svgEditorDocument";

type Props = {
  value: 手织图;
  initialDocument?: DocumentState | null;
  onDocumentStateChange?: (document: DocumentState) => void;
  fileName?: string | null;
  heightClassName?: string;
  headerRight?: React.ReactNode;
};

export type HandWovenSvgValue = 手织图 & {
  json: string;
};

export type HandWovenEditorCanvasHandle = SvgEditorCanvasHandle<HandWovenSvgValue>;

function createEditorDocumentName(fileName?: string | null) {
  return fileName?.trim() || "手织图";
}

function createDocumentFromHandWoven(
  _value: HandWovenSvgValue,
  fileName?: string | null,
): DocumentState {
  return createBaseSvgDocument({
    name: createEditorDocumentName(fileName),
    sourceName: fileName,
  });
}

function toHandWovenValue(
  document: DocumentState,
  _svg: string,
  previous: HandWovenSvgValue,
): HandWovenSvgValue {
  const persisted: DocumentState = {
    ...document,
    meta: {
      ...document.meta,
      updatedAt: new Date().toISOString(),
    },
  };

  return {
    ...previous,
    json: JSON.stringify(persisted),
  };
}

const HandWovenEditorCanvas = React.forwardRef<
  HandWovenEditorCanvasHandle,
  Props
>(function HandWovenEditorCanvas(
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
      ref={
        ref as React.ForwardedRef<SvgEditorCanvasHandle<HandWovenSvgValue>>
      }
      value={value as HandWovenSvgValue}
      initialDocument={initialDocument}
      onDocumentStateChange={onDocumentStateChange}
      fileName={fileName}
      heightClassName={heightClassName}
      headerRight={headerRight}
      createDocumentFromValue={createDocumentFromHandWoven}
      toValue={toHandWovenValue}
    />
  );
});

export default HandWovenEditorCanvas;
