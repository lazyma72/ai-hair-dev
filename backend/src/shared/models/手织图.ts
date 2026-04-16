export interface 手织图 {
  底图: {
    /** SVG 字符串（底图数据，不包含运行时 UI 叠加标记） */
    svg: string;
    区域名: string[];
    /** 每根线一个记录 */
    区域线条: {
      区域名: string;
      lineNodeIds: string[];
      lineLength: number;
      区域内位置占比: number;
    }[];
    档位标注: {
      区域名: string;
      lineNodeIds: string[];
      textNodeIds: string[];
    }[];

    /** 自定义文本节点（保留/新增需要的 text 节点） */
    文本节点: {
      [key: string]: {
        textNodeId: string;
        text?: string;
        created?: boolean;
        fontStyle?: { [key: string]: unknown };
      };
    };
  };

  自定义数据: {
    DML标注: {
      lineNodeId: string;
      标注DML: string;
      textNodeId: string;
    }[];
  };
}

export interface 手织图系统预置区域 {
  name: string;
  lineLength: number;
}

export const 手织图系统预置区域列表: 手织图系统预置区域[] = [
  { name: "尾巴", lineLength: 10 },
  { name: "松颈", lineLength: 20 },
  { name: "耳朵", lineLength: 30 },
  { name: "竖车", lineLength: 40 },
  { name: "横车", lineLength: 50 },
];
