export interface Db制帽 {
  /* 制帽编号,P-025 */
  _id: string
  /* 侧分雪花网 L */
  名称: string
  /* 单位：cm */
  帽围: number
  /* 单位：cm */
  帽深: number
  /* 单位：cm */
  前后: number
  /* 图片路径，仅供展示图片 */
  高针图?: string
  手织图?: string
  /* 只能从中选择，可修改lineLength */
  高针图系统预置区域列表: {
    name: string
    lineLength: number
  }[]
  /* 只能从中选择，可修改lineLength */
  手织图系统预置区域列表: {
    name: string
    lineLength: number
  }[]
}
