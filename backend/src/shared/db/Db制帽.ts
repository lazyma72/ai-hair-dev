export interface Db制帽 {
  /* 制帽编号,P-025 */
  _id: string;
  /* 侧分雪花网 L */
  名称: string;
  /* 单位：cm */
  帽围: number;
  /* 单位：cm */
  帽深: number;
  /* 单位：cm */
  前后: number;
  /* 例如：侧分雪花网（0.12网） */
  帽网款式: string;
  /* 备注 */
  备注?: string;
  /* 图片 */
  imgList?: string[];
}
