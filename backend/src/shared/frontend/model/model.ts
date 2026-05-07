import { KeyValue } from "./KeyValue";
import {
  制品规格书,
  沐茵丝假发成品稿,
  假发类型,
} from "../../db/Db沐茵丝假发成品稿";
import { Db胶丝比例 } from "../../db/Db胶丝比例";
import type { 高针图 } from "../../models/高针图";
import type { 染色档位 } from "../../db/Db沐茵丝假发成品稿";
import type { 手织图 } from "../../models/手织图";

// ==============================
// 胶丝比例 Frontend Types
// ==============================
export interface 胶丝比例ListItem {
  _id: string;
  发丝种类: string;
  线色?: string;
}

export interface 胶丝比例Frontend extends Omit<Db胶丝比例, "颜色图片参考"> {
  颜色图片参考?: string; // base64 encoded image string
}

// ==============================
// 沐茵丝假发成品稿 Frontend Types
// ==============================
export interface 沐茵丝假发成品稿ListItem {
  _id: string;
  样品编号: string;
  文件名称?: string;
  客户编号: string;
  品名: string;
  原材料: string;
  假发类型: 假发类型;
  CAP: string;
  tag?: "成品稿" | "草稿";
  规则摘要?: string[];
  颜色编号?: string;
  发丝种类?: string;
}

export interface 沐茵丝假发成品稿Frontend {
  _id: string;
  样品编号: string;
  tag?: "成品稿" | "草稿";
  文件名称?: string;
  制品规格书: 制品规格书Frontend;
  高针指示单: 高针指示单Frontend;
  手织指示单: 手织指示单Frontend;
}
export interface 制品规格书Frontend {
  /*---- 标题 ----*/
  title: {
    样品编号: string;
    客户编号: string;
    品名: string;
    订单: string;
    原料: string;
    颜色编号: string;
  };
  /*----   机器规格清单 ----*/
  机器规格清单: 制品规格书["机器规格清单"];
  /*----   人工规格清单 ----*/
  人工规格清单: 制品规格书["人工规格清单"];
  /*----   胶丝比例 ----*/
  胶丝比例: Db胶丝比例;
  /*----  制帽 ----*/
  制帽: {
    帽围: number;
    帽深: number;
    前后: number;
    唛头: string;
  };
  /* 通过D,M,L的所有档位重量累加得到 */
  当前重量: number;
  /*----   工程重量 ----*/
  工程重量: {
    整毛: { 加减: number; 数值: number };
    双针: { 加减: number; 数值: number };
    美容: { 加减: number; 数值: number };
    制帽: { 加减: number; 数值: number };
    高针: { 加减: number; 数值: number };
    手织: { 加减: number; 数值: number };
    剪驳: { 加减: number; 数值: number };
    发网: { 加减: number; 数值: number };
    完成: { 加减: number; 数值: number };
    /* {完成}±2g */
    重量: string;
  };
  /*----   工艺说明 ----*/
  工艺说明: 制品规格书["工艺说明"];
  /*----   图片 ----*/
  发型图片: string[];
  染色档位列表: 染色档位[];
}
export interface 高针指示单Frontend {
  /*---- 标题 ----*/
  title: {
    客户编号: string;
    重量: number;
    品名: string;
    尺寸: string;
    原料: string;
    CAP: string;
    样品编号: string;
  };
  高针图数据: 高针图;
  /*----   机器规格清单_高针图版本 ----
  每个档位对应一条记录
  */
  机器规格清单_高针图: {
    档位: string;
    毛长: number;
    长度: {
      D: number;
      M?: number;
      L?: number;
    };
    形态: string;
    管径: number;
    方向: string;
    备注: string;
  }[];
  注意事项: string;
  /*----   图片 ----*/
  发型图片: string[];
  染色档位列表: 染色档位[];
}
export interface 手织指示单Frontend {
  /*---- 标题 ----*/
  title: {
    样品编号: string;
    客户编号: string;
    尺寸: string;
    品名: string;
    CAP: string;
    重量: number;
    原材料: string;
    颜色编号: string;
  };
  /*
  ----   人工规格清单_手织图版本 ----
  每个档位对应一条记录
  */
  人工规格清单_手织图: {
    档位: string;
    整长: number;
    毛长: number;
    重量: {
      D: number;
      M?: number;
      L?: number;
    };
    位置?: string;
  }[];
  手织图: 手织图;
}
