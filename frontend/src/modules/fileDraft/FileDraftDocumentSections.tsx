import * as React from "react";
import { Modal } from "antd";
import FileUploadButton from "../../components/FileUploadButton";
import type { DbCustomer } from "../../shared/db/DbCustomer";
import type { FileDraftViewModel } from "../../shared/fileDraft/model";
import type {
  制品规格书Frontend,
  胶丝比例Frontend,
  手织指示单Frontend,
  高针指示单Frontend,
} from "../../shared/frontend/model/model";
import Section from "../../components/Section";
import FileDraftDataSections from "./FileDraftDataSections";
import HandWovenSection from "../../pages/admin/add-file/sections/HandWovenSection";
import HandWovenBlock from "./HandWovenBlock";
import HighNeedleBlock from "./HighNeedleBlock";

type HatMakingOption = {
  _id: string;
  名称?: string;
  帽围: number;
  帽深: number;
  前后: number;
};

type CommonProps = {
  value: FileDraftViewModel;
  hatMakingList?: HatMakingOption[];
  高针数据: 高针指示单Frontend | null;
  手织数据: 手织指示单Frontend | null;
};

type ReadonlyProps = CommonProps & {
  mode: "readonly";
  制品规格书详情: 制品规格书Frontend;
};

type EditProps = CommonProps & {
  mode: "edit";
  enableSplitDmlSizing?: boolean;
  onChange: React.Dispatch<React.SetStateAction<FileDraftViewModel>>;
  onOpenHighNeedleSvgEditor?: () => void;
  onOpenHandWovenSvgEditor?: () => void;
  customerList: DbCustomer[];
  当前胶丝比例详情?: 胶丝比例Frontend | null;
  发丝种类选项?: string[];
  颜色编号选项?: string[];
  全部档位名?: string[];
  allowTestData?: boolean;
  onFillTestData?: () => void;
  onImportExcelData?: (file: File) => void | Promise<void>;
};

type Props = ReadonlyProps | EditProps;

export default function FileDraftDocumentSections(props: Props) {
  const [excelImportOpen, setExcelImportOpen] = React.useState(false);
  const [excelFile, setExcelFile] = React.useState<File | null>(null);
  const [importingExcel, setImportingExcel] = React.useState(false);

  async function handleConfirmImportExcel() {
    if (props.mode !== "edit" || !excelFile || !props.onImportExcelData) {
      return;
    }
    setImportingExcel(true);
    try {
      await props.onImportExcelData(excelFile);
      setExcelImportOpen(false);
      setExcelFile(null);
    } finally {
      setImportingExcel(false);
    }
  }

  return (
    <div className="space-y-6">
      <Modal
        title="从 Excel 导入数据"
        open={excelImportOpen}
        onCancel={() => {
          if (importingExcel) return;
          setExcelImportOpen(false);
          setExcelFile(null);
        }}
        onOk={() => void handleConfirmImportExcel()}
        okText="导入"
        cancelText="取消"
        okButtonProps={{
          disabled: !excelFile,
          loading: importingExcel,
        }}
      >
        <div className="space-y-3">
          <div className="text-sm text-slate-600">
            请选择一个 Excel 文件。当前为占位实现，导入后会暂时使用测试数据填充逻辑。
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <FileUploadButton
              text="选择 Excel 文件"
              accept=".xlsx,.xls,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
              onSelect={(file) => setExcelFile(file)}
            />
            <div className="text-sm text-slate-500">
              {excelFile ? excelFile.name : "未选择文件"}
            </div>
          </div>
        </div>
      </Modal>

      <Section title="制品规格书">
        <div className="p-5">
          {props.mode === "edit" && props.allowTestData ? (
            <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                className="rounded border border-amber-300 bg-white px-3 py-1 text-sm font-medium text-amber-700 hover:bg-amber-50"
                onClick={() => setExcelImportOpen(true)}
              >
                从 Excel 导入数据
              </button>
              <button
                type="button"
                className="rounded bg-amber-500 px-3 py-1 text-sm font-medium text-white hover:bg-amber-400"
                onClick={props.onFillTestData}
              >
                一键填充测试数据
              </button>
            </div>
          ) : null}

          <FileDraftDataSections
            mode={props.mode}
            value={props.value}
            制品规格书详情={
              props.mode === "readonly" ? props.制品规格书详情 : undefined
            }
            enableSplitDmlSizing={
              props.mode === "edit" ? props.enableSplitDmlSizing : undefined
            }
            onChange={props.mode === "edit" ? props.onChange : undefined}
            customerList={props.mode === "edit" ? props.customerList : undefined}
            hatMakingList={props.hatMakingList}
            当前胶丝比例详情={
              props.mode === "edit" ? props.当前胶丝比例详情 : undefined
            }
            发丝种类选项={props.mode === "edit" ? props.发丝种类选项 : undefined}
            颜色编号选项={props.mode === "edit" ? props.颜色编号选项 : undefined}
            全部档位名={props.mode === "edit" ? props.全部档位名 : undefined}
          />
        </div>
      </Section>

      {props.mode === "edit" ? (
        <HighNeedleBlock
          mode="edit"
          value={props.value.高针指示单}
          onChange={(v) =>
            props.onChange((prev) => ({ ...prev, 高针指示单: v }))
          }
          onOpenSvgEditor={props.onOpenHighNeedleSvgEditor}
          previewData={props.高针数据}
        />
      ) : props.高针数据 ? (
        <HighNeedleBlock
          mode="readonly"
          value={{
            注意事项: props.高针数据.注意事项,
            高针图: props.高针数据.高针图数据,
          }}
          previewData={props.高针数据}
        />
      ) : null}

      {props.mode === "edit" ? (
        <HandWovenSection
          value={props.value.手织指示单}
          onChange={(v) =>
            props.onChange((prev) => ({ ...prev, 手织指示单: v }))
          }
          onOpenSvgEditor={props.onOpenHandWovenSvgEditor}
          previewData={props.手织数据}
        />
      ) : props.手织数据 ? (
        <HandWovenBlock mode="readonly" value={props.value.手织指示单} />
      ) : null}
    </div>
  );
}
