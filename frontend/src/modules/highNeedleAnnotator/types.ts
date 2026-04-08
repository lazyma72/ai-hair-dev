import type { 高针图 } from "../../shared/models/高针图";
import type { 高针图系统预置区域 } from "../../shared/models/高针图";

export type { 高针图系统预置区域 };
export type { 高针图 };

export type 标注步骤 = "区域" | "档位" | "DML" | "单双" | "自定义文本" | "完成";

export type DmlValue = "" | "D" | "M" | "L";

export function createEmpty高针图(svg: string): 高针图 {
  return {
    底图: {
      svg,
      区域名: [],
      区域线条: [],
      档位标注: [],
      文本节点: {},
    },
    自定义数据: {
      DML标注: [],
      单双标注: [],
    },
  };
}
