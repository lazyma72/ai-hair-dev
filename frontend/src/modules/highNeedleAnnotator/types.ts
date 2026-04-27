import type { 高针图 } from "../../shared/models/高针图";
import type { 高针图系统预置区域 } from "../../shared/models/高针图";
import type { 手织图 } from "../../shared/models/手织图";
import type { 手织图系统预置区域 } from "../../shared/models/手织图";
import { 空DML规则命令列表, type DML值 } from "../../shared/models/DML规则";

export type { 高针图系统预置区域 };
export type { 高针图 };
export type { 手织图系统预置区域 };
export type { 手织图 };

export type 标注步骤 = "区域" | "档位" | "DML" | "单双" | "自定义文本" | "完成";

export type DmlValue = "" | DML值;

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
      DML规则命令列表: 空DML规则命令列表(),
      单双标注: [],
    },
  };
}

export function createEmpty手织图(svg: string): 手织图 {
  return {
    svg,
    类型: { type: "特殊" },
  };
}
