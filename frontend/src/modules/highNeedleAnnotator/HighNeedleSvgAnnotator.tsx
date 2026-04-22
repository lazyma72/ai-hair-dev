import HighNeedleSvgAnnotatorCanvas from "./HighNeedleSvgAnnotatorCanvas";
import HighNeedleSvgAnnotatorSidebar from "./HighNeedleSvgAnnotatorSidebar";
import type { 高针图 } from "./types";
import useHighNeedleSvgAnnotator from "./useHighNeedleSvgAnnotator";

type Props = {
  initialSvg: string;
  /** 通过 JSON 恢复/预览时可传入（会覆盖 initialSvg） */
  initialValue?: 高针图;
  /**
   * 传了 initialValue 时默认会进入“完成”。
   * - done：保持旧行为（预览模式）
   * - begin：从第一步开始（编辑模式）
   */
  startAt?: "begin" | "done";
  /** 可覆盖默认的预置区域列表 */
  presets?: { name: string; lineLength: number }[];
  /** 线条选择器（CSS selector），用于从 SVG 中筛选可点选的线条元素 */
  lineSelector?: string;
  /** 档位文本写入节点（可选，不提供则只输出数据不写回 SVG） */
  slotTextNodeId?: string;
  enableDml?: boolean;
  enableDouble?: boolean;
  onChange?: (v: 高针图) => void;
  showPreview?: boolean;
};

export default function HighNeedleSvgAnnotator(props: Props) {
  const state = useHighNeedleSvgAnnotator(props);
  const showPreview = props.showPreview ?? true;

  const activeTextNodeId =
    state.activeTextKey && state.value.底图.文本节点[state.activeTextKey]
      ? state.value.底图.文本节点[state.activeTextKey].textNodeId
      : "";

  return (
    <div className="h-full min-h-0">
      <div className="grid h-[calc(100%-2.5rem)] min-h-0 gap-4 overflow-hidden lg:grid-cols-[340px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
        <HighNeedleSvgAnnotatorSidebar {...state} />
        <HighNeedleSvgAnnotatorCanvas
          step={state.step}
          lineSelector={state.lineSelector}
          allLineIdSet={state.allLineIdSet}
          allTextIds={state.allTextIds}
          renderSvg={state.renderSvg}
          previewValue={state.previewValue}
          canvasEpoch={state.canvasEpoch}
          preferredDmlPosByLineId={state.preferredDmlPosByLineId}
          preferredRegionPosByLineId={state.preferredRegionPosByLineId}
          preferredLevelPosByLineId={state.preferredLevelPosByLineId}
          preferredDoublePosByLineId={state.preferredDoublePosByLineId}
          pendingLevelMarkerPosByLineId={state.pendingLevelMarkerPosByLineId}
          draftMarkerPosByLineId={state.draftMarkerPosByLineId}
          dmlMarkerPosByLineId={state.dmlMarkerPosByLineId}
          pendingDmlMarkerPosByLineId={state.pendingDmlMarkerPosByLineId}
          visibleMarkerById={state.visibleMarkerById}
          markerTextIdSet={state.markerTextIdSet}
          draggableMarkerTextIdSet={state.draggableMarkerTextIdSet}
          regionLabels={state.regionLabelItems}
          toggleSelect={state.toggleSelect}
          handleLineAction={state.handleLineAction}
          applyDmlBrushSelection={state.applyDmlBrushSelection}
          getDmlBrushPreview={state.getDmlBrushPreview}
          hasActiveDmlRuleSelection={Boolean(state.activeDmlRuleId)}
          activeDmlRuleLineIdSet={state.activeDmlRuleLineIdSet}
          handleLineDmlCycleOverride={state.handleLineDmlCycleOverride}
          ensureRegionMarkerTextNode={state.ensureRegionMarkerTextNode}
          ensureDmlMarkerTextNode={state.ensureDmlMarkerTextNode}
          layerToggles={state.layerToggles}
          setLayerToggles={state.setLayerToggles}
          activeTextNodeId={activeTextNodeId}
          activeTextKey={state.activeTextKey}
          setActiveTextKey={state.setActiveTextKey}
          onTextActivate={state.ensureTextNodeKept}
          onTextFontSizeChange={state.updateTextNodeFontSize}
          onTextPositionCommit={state.commitTextNodePosition}
          onTextRemove={state.removeTextNode}
          showPreview={showPreview}
        />
      </div>
    </div>
  );
}
