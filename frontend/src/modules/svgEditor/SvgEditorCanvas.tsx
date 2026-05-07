import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  EditorProvider,
  EditorShell,
  buildExportSvg,
  createEditor,
  DEFAULT_VIEW_STATE,
  type Editor,
} from "./externalSvgEditor";
import type { DocumentState, SvgDocumentValue } from "./svgEditorDocument";
import {
  buildDocumentFromSvgValue,
  parseDocumentJson,
} from "./svgEditorDocument";

type Props<TValue extends SvgDocumentValue> = {
  value: TValue;
  initialDocument?: DocumentState | null;
  onDocumentStateChange?: (document: DocumentState) => void;
  fileName?: string | null;
  heightClassName?: string;
  headerRight?: React.ReactNode;
  createDocumentFromValue: (
    value: TValue,
    fileName?: string | null,
  ) => DocumentState;
  buildDocumentFromValue?: (
    value: TValue,
    fileName?: string | null,
  ) => Promise<DocumentState>;
  resolveDocumentFromJson?: (
    document: DocumentState,
    value: TValue,
    fileName?: string | null,
  ) => DocumentState;
  toValue: (document: DocumentState, svg: string, previous: TValue) => TValue;
};

export type SvgEditorCanvasHandle<TValue extends SvgDocumentValue> = {
  getCurrentDocument: () => DocumentState;
  exportCurrentState: () => {
    document: DocumentState;
    svg: string;
    value: TValue;
  };
};

async function waitForDocumentFontsReady() {
  const fonts = globalThis.document?.fonts;
  if (!fonts?.ready) return;

  try {
    await Promise.race([
      fonts.ready,
      new Promise<void>((resolve) => {
        window.setTimeout(resolve, 1500);
      }),
    ]);
  } catch {
    // Ignore font loading failures and continue with the best available metrics.
  }
}

function SvgEditorCanvasInner<TValue extends SvgDocumentValue>(
  {
    value,
    initialDocument,
    onDocumentStateChange,
    fileName,
    heightClassName = "h-[calc(100vh-160px)] min-h-[640px]",
    headerRight,
    createDocumentFromValue,
    buildDocumentFromValue,
    resolveDocumentFromJson,
    toValue,
  }: Props<TValue>,
  ref: React.ForwardedRef<SvgEditorCanvasHandle<TValue>>,
) {
  const editorRef = useRef<Editor | null>(null);
  const latestDocumentRef = useRef<DocumentState>(
    initialDocument ?? createDocumentFromValue(value, fileName),
  );
  const latestValueRef = useRef<TValue>(value);
  if (!editorRef.current) {
    editorRef.current = createEditor();
  }

  const [importError, setImportError] = useState("");
  const sourceFingerprint = useMemo(
    () =>
      initialDocument
        ? `document:${JSON.stringify(initialDocument)}`
        : `value:${JSON.stringify(value)}`,
    [initialDocument, value],
  );

  useImperativeHandle(
    ref,
    () => ({
      getCurrentDocument() {
        const current =
          editorRef.current?.data.getState() ?? latestDocumentRef.current;
        latestDocumentRef.current = current;
        return current;
      },
      exportCurrentState() {
        const document =
          editorRef.current?.data.getState() ?? latestDocumentRef.current;
        const svg = buildExportSvg(document, DEFAULT_VIEW_STATE);
        const nextValue = toValue(document, svg, latestValueRef.current);
        latestDocumentRef.current = document;
        latestValueRef.current = nextValue;
        return {
          document,
          svg,
          value: nextValue,
        };
      },
    }),
    [toValue],
  );

  useEffect(() => {
    let cancelled = false;
    const editor = editorRef.current!;

    void (async () => {
      try {
        await waitForDocumentFontsReady();
        if (cancelled) return;

        const documentFromJson = parseDocumentJson(value.json);
        const nextDoc = initialDocument
          ? initialDocument
          : documentFromJson
            ? (resolveDocumentFromJson?.(documentFromJson, value, fileName) ??
              documentFromJson)
            : await (buildDocumentFromValue?.(value, fileName) ??
                buildDocumentFromSvgValue(
                  createDocumentFromValue(value, fileName),
                  value,
                ));

        if (cancelled) return;
        editor.data.setState(nextDoc);
        latestDocumentRef.current = nextDoc;
        latestValueRef.current = value;
        setImportError("");
      } catch (err) {
        if (cancelled) return;
        setImportError(err instanceof Error ? err.message : String(err));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    buildDocumentFromValue,
    createDocumentFromValue,
    fileName,
    initialDocument,
    resolveDocumentFromJson,
    sourceFingerprint,
    value,
  ]);

  return (
    <div className={`overflow-hidden bg-white ${heightClassName}`}>
      {importError ? (
        <div className="border-b border-rose-100 bg-rose-50 px-5 py-3 text-sm text-rose-700">
          导入失败：{importError}
        </div>
      ) : null}

      <div className="h-full">
        <EditorProvider editor={editorRef.current}>
          <EditorShell
            headerRight={headerRight}
            onDocumentStateChange={(document: DocumentState) => {
              latestDocumentRef.current = document;
              onDocumentStateChange?.(document);
            }}
          />
        </EditorProvider>
      </div>
    </div>
  );
}

const SvgEditorCanvas = forwardRef(SvgEditorCanvasInner) as <
  TValue extends SvgDocumentValue,
>(
  props: Props<TValue> & {
    ref?: React.ForwardedRef<SvgEditorCanvasHandle<TValue>>;
  },
) => React.ReactElement;

export default SvgEditorCanvas;
