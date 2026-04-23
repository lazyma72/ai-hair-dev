import type { DmlValue } from "./types";
import type { DML规则命令 } from "../../shared/models/DML规则";
import CustomTextStagePanel from "./CustomTextStagePanel";
import DoneStagePanel from "./DoneStagePanel";
import LevelStagePanel from "./LevelStagePanel";
import MarkStagePanel from "./MarkStagePanel";
import RegionStagePanel from "./RegionStagePanel";
import HighNeedleStepTabs from "./HighNeedleStepTabs";

type StepKey = "区域" | "档位" | "DML" | "单双" | "自定义文本" | "完成";

type TextNodeRecord = {
  textNodeId: string;
  text?: string;
  fontStyle?: Record<string, unknown>;
  created?: boolean;
};

type Props = {
  presets: { name: string; lineLength: number }[];
  enableDml?: boolean;
  enableDouble?: boolean;

  step: StepKey;
  stepTips: string;

  value: any;
  allLineIds?: string[];
  missingLevelLineIds?: string[];
  canEditRegion?: boolean;
  canEditDml?: boolean;
  canEditDouble?: boolean;

  regionPresetValue: string;
  setRegionPresetValue: (v: string) => void;
  regionDraft: { name: string; lineLength: number };
  setRegionDraft: (updater: any) => void;

  levelNo: number;
  draftSelected: string[];
  setDraftSelected: (v: string[]) => void;

  setStep: (s: StepKey) => void;

  confirmExit: () => void;
  requestCanvasReset: () => void;

  finishRegion: (options?: { gotoNextStage?: boolean }) => void;
  clearRegionStage: () => void;

  finishLevel: () => void;
  clearLevelStage: () => void;

  clearDmlStage: () => void;
  clearDoubleStage: () => void;

  dmlRuleCommands: DML规则命令[];
  dmlLevelNames: string[];
  dmlSpecialCount: number;
  addDmlRegionRule: () => void;
  updateDmlRegionRule: (
    ruleId: string,
    patch: {
      区域?: string;
      开始位置?: number;
      结束位置?: number;
      规律?: string;
      segmentIndex?: number;
    },
  ) => void;
  addDmlLevelRule: () => void;
  updateDmlLevelRule: (
    ruleId: string,
    patch: {
      档位名称?: string;
      开始位置?: number;
      结束位置?: number;
      规律?: string;
      segmentIndex?: number;
    },
  ) => void;
  addDmlSpecialRule: () => void;
  removeDmlRule: (ruleId: string) => void;
  activeDmlRuleId: string;
  activeDmlRuleType: "区域百分比" | "按档位标记" | "特殊标记" | "";
  activeSpecialDmlValue: DmlValue;
  selectDmlRule: (
    ruleId: string,
    ruleType: "区域百分比" | "按档位标记",
  ) => void;
  selectSpecialDmlRule: (value: string) => void;
  setActiveSpecialDmlValue: (value: DmlValue) => void;
  clearActiveDmlRule: () => void;

  completeTextStage: () => void;

  activeTextKey: string;
  setActiveTextKey: (v: string) => void;
  newTextDraft: {
    text: string;
  };
  setNewTextDraft: (updater: any) => void;

  createTextNode: () => void;
  updateTextNodeText: (key: string, text: string) => void;
  removeTextNode: (key: string) => void;
  clearCustomText: () => void;
};

type RegionLineEntry = {
  区域名: string;
  lineNodeId: string;
  sort: number;
};

function getRegionLineSort(item: RegionLineEntry, fallback: number): number {
  const sort = typeof item.sort === "number" ? item.sort : Number(item.sort);
  if (!Number.isFinite(sort) || sort < 1) return fallback + 1;
  return Math.floor(sort);
}

function normalizeRegionItems(
  items: RegionLineEntry[],
): Array<{ 区域名: string; lineNodeId: string; sort: number }> {
  return items
    .map((item, itemIndex) => ({
      区域名: String(item.区域名 ?? "").trim(),
      lineNodeId: String(item.lineNodeId ?? "").trim(),
      sort: getRegionLineSort(item, itemIndex),
    }))
    .filter((item) => item.lineNodeId)
    .sort((left, right) => left.sort - right.sort);
}

export default function HighNeedleSvgAnnotatorSidebar(props: Props) {
  const {
    presets,
    enableDml,
    enableDouble,
    step,
    stepTips,
    value,
    missingLevelLineIds,
    canEditRegion,
    canEditDml,
    canEditDouble,
    confirmExit,
    setStep,
    setDraftSelected,

    allLineIds,

    regionPresetValue,
    setRegionPresetValue,
    regionDraft,
    setRegionDraft,
    finishRegion,
    clearRegionStage,

    levelNo,
    draftSelected,
    finishLevel,
    clearLevelStage,

    clearDmlStage,
    clearDoubleStage,

    dmlRuleCommands,
    dmlLevelNames,
    dmlSpecialCount,
    addDmlRegionRule,
    updateDmlRegionRule,
    addDmlLevelRule,
    updateDmlLevelRule,
    addDmlSpecialRule,
    removeDmlRule,
    activeDmlRuleId,
    activeDmlRuleType,
    activeSpecialDmlValue,
    selectDmlRule,
    selectSpecialDmlRule,
    setActiveSpecialDmlValue,
    clearActiveDmlRule,
    requestCanvasReset,

    activeTextKey,
    setActiveTextKey,
    newTextDraft,
    setNewTextDraft,
    createTextNode,
    updateTextNodeText,
    removeTextNode,
    clearCustomText,
    completeTextStage,
  } = props;

  const textNodeEntries = Object.entries(value.底图?.文本节点 ?? {}) as Array<
    [string, TextNodeRecord]
  >;
  const regionItems = normalizeRegionItems(
    (value.底图?.区域线条 ?? []) as RegionLineEntry[],
  );
  const levelItems = (value.底图?.档位标注 ?? []) as Array<{
    区域名: string;
    lineNodeIds: string[];
  }>;
  const regionCountByName: Record<string, number> = {};
  regionItems.forEach((item) => {
    regionCountByName[item.区域名] =
      (regionCountByName[item.区域名] ?? 0) + 1;
  });

  const lineToLevelInfo = new Map<string, { 档位名称: string }>();
  (value.底图?.档位标注 ?? []).forEach(
    (item: { 区域名: string; lineNodeIds: string[] }) => {
      item.lineNodeIds.forEach((id) => {
        lineToLevelInfo.set(id, { 档位名称: item.区域名 });
      });
    },
  );

  const regionOrderedLines = new Map<string, string[]>();
  const levelOrderedLines = new Map<string, string[]>();
  regionItems.forEach((item) => {
    const list = regionOrderedLines.get(item.区域名) ?? [];
    list.push(item.lineNodeId);
    regionOrderedLines.set(item.区域名, list);
  });
  (value.底图?.档位标注 ?? []).forEach(
    (item: { 区域名: string; lineNodeIds: string[] }) => {
      levelOrderedLines.set(item.区域名, item.lineNodeIds.filter(Boolean));
    },
  );

  const lineToRegionInfo = new Map<
    string,
    { 区域名: string; globalIndex: number; total: number }
  >();
  regionOrderedLines.forEach((ids, regionName) => {
    ids.forEach((id, idx) => {
      lineToRegionInfo.set(id, {
        区域名: regionName,
        globalIndex: idx,
        total: ids.length,
      });
    });
  });
  const savedRegions = Object.entries(regionCountByName).map(
    ([name, lineCount]) => ({ name, lineCount }),
  );
  const savedLevels = levelItems.map((item) => ({
    name: item.区域名,
    lineCount: item.lineNodeIds.length,
  }));

  return (
    <div className="h-full min-h-0 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-900">
            高针图 SVG 标注
          </div>
          <div className="mt-1 text-xs text-slate-500">{stepTips}</div>
        </div>
        <button
          type="button"
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-red-500"
          onClick={confirmExit}
        >
          重新开始
        </button>
      </div>

      <HighNeedleStepTabs
        step={step}
        enableDml={enableDml}
        enableDouble={enableDouble}
        onSelect={(next) => {
          setStep(next);
          setDraftSelected([]);
        }}
      />

      {step !== "区域" && (missingLevelLineIds?.length ?? 0) > 0 ? (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          档位未补齐：还有 {missingLevelLineIds?.length ?? 0}{" "}
          条区域线未标注档位。DML/单双/文本清理会被阻止写入。
        </div>
      ) : null}

      {step === "区域" && canEditRegion === false ? (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          区域已锁定：当前存在档位或
          DML/单双数据。若需重做区域，请使用“清空区域阶段”。
        </div>
      ) : null}

      {step === "DML" && canEditDml === false ? (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          DML 只允许在档位补齐后编辑。
        </div>
      ) : null}

      {step === "单双" && canEditDouble === false ? (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          单双只允许在档位补齐后编辑。
        </div>
      ) : null}

      {step === "区域" ? (
        <RegionStagePanel
          presets={presets}
          regionPresetValue={regionPresetValue}
          setRegionPresetValue={setRegionPresetValue}
          regionDraft={regionDraft}
          setRegionDraft={setRegionDraft}
          draftSelected={draftSelected}
          savedLineCount={value.底图.区域线条.length}
          savedRegions={savedRegions}
          requestCanvasReset={requestCanvasReset}
          setDraftSelected={setDraftSelected}
          finishRegion={finishRegion}
          clearRegionStage={clearRegionStage}
        />
      ) : null}

      {step === "档位" ? (
        <LevelStagePanel
          levelNo={levelNo}
          draftSelected={draftSelected}
          savedLevelCount={value.底图.档位标注.length}
          savedLevels={savedLevels}
          requestCanvasReset={requestCanvasReset}
          setDraftSelected={setDraftSelected}
          finishLevel={finishLevel}
          clearLevelStage={clearLevelStage}
        />
      ) : null}

      {step === "DML" || step === "单双" ? (
        <MarkStagePanel
          step={step}
          clearDmlStage={clearDmlStage}
          clearDoubleStage={clearDoubleStage}
          dmlRuleCommands={dmlRuleCommands}
          regionNames={value.底图?.区域名 ?? []}
          levelNames={dmlLevelNames}
          dmlSpecialCount={dmlSpecialCount}
          addDmlRegionRule={addDmlRegionRule}
          updateDmlRegionRule={updateDmlRegionRule}
          lineToRegionInfo={lineToRegionInfo}
          lineToLevelInfo={lineToLevelInfo}
          regionOrderedLines={regionOrderedLines}
          levelOrderedLines={levelOrderedLines}
          addDmlLevelRule={addDmlLevelRule}
          updateDmlLevelRule={updateDmlLevelRule}
          addDmlSpecialRule={addDmlSpecialRule}
          removeDmlRule={removeDmlRule}
          activeDmlRuleId={activeDmlRuleId}
          activeDmlRuleType={activeDmlRuleType || undefined}
          activeSpecialDmlValue={activeSpecialDmlValue}
          selectDmlRule={selectDmlRule}
          selectSpecialDmlRule={selectSpecialDmlRule}
          setActiveSpecialDmlValue={setActiveSpecialDmlValue}
          clearActiveDmlRule={clearActiveDmlRule}
        />
      ) : null}

      {step === "自定义文本" ? (
        <CustomTextStagePanel
          textNodeEntries={textNodeEntries}
          activeTextKey={activeTextKey}
          setActiveTextKey={setActiveTextKey}
          newTextDraft={newTextDraft}
          setNewTextDraft={setNewTextDraft}
          createTextNode={createTextNode}
          updateTextNodeText={updateTextNodeText}
          removeTextNode={removeTextNode}
          clearCustomText={clearCustomText}
          completeTextStage={completeTextStage}
        />
      ) : null}

      {step === "完成" ? (
        <DoneStagePanel value={value} clearRegionStage={clearRegionStage} />
      ) : null}
    </div>
  );
}
