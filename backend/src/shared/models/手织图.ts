export interface 手织图{
        底图: {
          svg: string; // SVG 原图字符串，不带标记和挡位的底图数据
          可定制项: {
            lineId: string; // 线条唯一ID
            尺数: number; // 例如: 13
          }[]; 
        };

}