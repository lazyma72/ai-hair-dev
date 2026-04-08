export interface 手织图 {
  底图: {
    svg: string // SVG 原图字符串，不带标记，挡位,单双的底图数据
    区域名: string[]
    // 每根线一个记录
    区域线条: {
      区域名: string
      lineNodeIds: string[]
    }[]
    区域DML标注: {
      区域名: string
      textNodeIds: string[]
    }[]
    文本替换: {
      [key: string]: {
        textNodeId: string
        fontStyle?: {}
      }
    }
  }
}
