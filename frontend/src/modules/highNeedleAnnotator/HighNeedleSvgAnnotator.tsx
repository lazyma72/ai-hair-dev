import * as React from "react";
import HighNeedleSvgAnnotatorCanvas from "./HighNeedleSvgAnnotatorCanvas";
import HighNeedleSvgAnnotatorSidebar from "./HighNeedleSvgAnnotatorSidebar";
import type { 高针图 } from "./types";
import useHighNeedleSvgAnnotator from "./useHighNeedleSvgAnnotator";

type Props = {
  initialSvg: string;
  /** 通过 JSON 恢复/预览时可传入（会覆盖 initialSvg） */
  initialValue?: 高针图;
  /** 可覆盖默认的预置区域列表 */
  presets?: { name: string; lineLength: number }[];
  /** 线条选择器（CSS selector），用于从 SVG 中筛选可点选的线条元素 */
  lineSelector?: string;
  /** 档位文本写入节点（可选，不提供则只输出数据不写回 SVG） */
  slotTextNodeId?: string;
  enableDml?: boolean;
  enableDouble?: boolean;
  onChange?: (v: 高针图) => void;
};

export default function HighNeedleSvgAnnotator(props: Props) {
  const state = useHighNeedleSvgAnnotator(props);

  const activeTextNodeId =
    state.activeTextKey && state.value.底图.文本节点[state.activeTextKey]
      ? state.value.底图.文本节点[state.activeTextKey].textNodeId
      : "";

  return (
    <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
      <HighNeedleSvgAnnotatorSidebar {...state} />
      <HighNeedleSvgAnnotatorCanvas
        step={state.step}
        lineSelector={state.lineSelector}
        allLineIdSet={state.allLineIdSet}
        allTextIds={state.allTextIds}
        renderSvg={state.renderSvg}
        previewValue={state.previewValue}
        canvasEpoch={state.canvasEpoch}
        visibleMarkerById={state.visibleMarkerById}
        regionLabels={state.regionLabelItems}
        toggleSelect={state.toggleSelect}
        handleLineAction={state.handleLineAction}
        activeTextNodeId={activeTextNodeId}
        onTextActivate={state.ensureTextNodeKept}
        onTextPositionCommit={state.commitTextNodePosition}
      />
    </div>
  );
}
