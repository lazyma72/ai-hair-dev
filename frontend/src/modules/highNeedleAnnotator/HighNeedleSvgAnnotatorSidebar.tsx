import * as React from "react";
import CustomTextStagePanel from "./CustomTextStagePanel";
import DoneStagePanel from "./DoneStagePanel";
import LevelStagePanel from "./LevelStagePanel";
import MarkStagePanel from "./MarkStagePanel";
import type { DmlAutoConfig } from "./dmlAuto";
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
  progress: number;
  stepTips: string;

  value: any;

  regionPresetValue: string;
  setRegionPresetValue: (v: string) => void;
  regionDraft: { name: string; lineLength: number };
  setRegionDraft: (updater: any) => void;

  levelNo: number;
  draftSelected: string[];
  setDraftSelected: (v: string[]) => void;

  stepToIndex: (s: StepKey) => number;
  setStep: (s: StepKey) => void;

  confirmExit: () => void;
  requestCanvasReset: () => void;

  finishRegion: (options?: { gotoNextStage?: boolean }) => void;
  clearRegionStage: () => void;

  finishLevel: () => void;
  clearLevelStage: () => void;

  clearDmlStage: () => void;
  clearDoubleStage: () => void;

  dmlAutoConfigs: DmlAutoConfig[];
  addDmlAutoConfig: () => void;
  updateDmlAutoConfig: (
    configId: string,
    patch: Partial<
      Pick<DmlAutoConfig, "regionName" | "pattern" | "rangeStart" | "rangeEnd">
    >,
  ) => void;
  removeDmlAutoConfig: (configId: string) => void;
  resetDmlAutoConfigs: () => void;

  goNextStep: () => void;

  activeTextKey: string;
  setActiveTextKey: (v: string) => void;
  newTextDraft: {
    text: string;
    fill: string;
    fontWeight: string;
    fontSize: number;
  };
  setNewTextDraft: (updater: any) => void;

  createTextNode: () => void;
  updateTextNodeText: (key: string, text: string) => void;
  updateTextNodeStyle: (key: string, patch: Record<string, unknown>) => void;
  removeTextNode: (key: string) => void;
  clearCustomText: () => void;
};

export default function HighNeedleSvgAnnotatorSidebar(props: Props) {
  const {
    presets,
    enableDml,
    enableDouble,
    step,
    progress,
    stepTips,
    value,
    confirmExit,
    setStep,
    setDraftSelected,
    stepToIndex,

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

    dmlAutoConfigs,
    addDmlAutoConfig,
    updateDmlAutoConfig,
    removeDmlAutoConfig,
    resetDmlAutoConfigs,

    goNextStep,
    requestCanvasReset,

    activeTextKey,
    setActiveTextKey,
    newTextDraft,
    setNewTextDraft,
    createTextNode,
    updateTextNodeText,
    updateTextNodeStyle,
    removeTextNode,
    clearCustomText,
  } = props;

  const textNodeEntries = Object.entries(value.底图?.文本节点 ?? {}) as Array<
    [string, TextNodeRecord]
  >;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-900">
            高针图 SVG 标注
          </div>
          <div className="mt-1 text-xs text-slate-500">{stepTips}</div>
        </div>
        <button
          type="button"
          className="rounded bg-slate-100 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-200"
          onClick={confirmExit}
        >
          重新开始
        </button>
      </div>

      <HighNeedleStepTabs
        step={step}
        progress={progress}
        enableDml={enableDml}
        enableDouble={enableDouble}
        stepToIndex={stepToIndex}
        onSelect={(next) => {
          setStep(next);
          setDraftSelected([]);
        }}
      />

      {step === "区域" ? (
        <RegionStagePanel
          presets={presets}
          regionPresetValue={regionPresetValue}
          setRegionPresetValue={setRegionPresetValue}
          regionDraft={regionDraft}
          setRegionDraft={setRegionDraft}
          draftSelected={draftSelected}
          savedLineCount={value.底图.区域线条.length}
          requestCanvasReset={requestCanvasReset}
          setDraftSelected={setDraftSelected}
          finishRegion={finishRegion}
          clearRegionStage={clearRegionStage}
          goNextStep={goNextStep}
        />
      ) : null}

      {step === "档位" ? (
        <LevelStagePanel
          levelNo={levelNo}
          draftSelected={draftSelected}
          savedLevelCount={value.底图.档位标注.length}
          requestCanvasReset={requestCanvasReset}
          setDraftSelected={setDraftSelected}
          finishLevel={finishLevel}
          clearLevelStage={clearLevelStage}
          goNextStep={goNextStep}
        />
      ) : null}

      {step === "DML" || step === "单双" ? (
        <MarkStagePanel
          step={step}
          clearDmlStage={clearDmlStage}
          clearDoubleStage={clearDoubleStage}
          goNextStep={goNextStep}
          regionNames={value.底图?.区域名 ?? []}
          dmlAutoConfigs={dmlAutoConfigs}
          addDmlAutoConfig={addDmlAutoConfig}
          updateDmlAutoConfig={updateDmlAutoConfig}
          removeDmlAutoConfig={removeDmlAutoConfig}
          resetDmlAutoConfigs={resetDmlAutoConfigs}
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
          updateTextNodeStyle={updateTextNodeStyle}
          removeTextNode={removeTextNode}
          clearCustomText={clearCustomText}
          goNextStep={goNextStep}
        />
      ) : null}

      {step === "完成" ? (
        <DoneStagePanel value={value} clearRegionStage={clearRegionStage} />
      ) : null}
    </div>
  );
}
