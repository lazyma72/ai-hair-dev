import type { 沐茵丝假发成品稿 } from "../db/Db沐茵丝假发成品稿";

// 前端编辑态与数据库稿件解耦：
// - _id 始终使用 string（承载 ObjectId 的 hex 串，便于路由/接口）
// - 样品编号使用独立业务字段
export type FileDraftViewModel = Omit<沐茵丝假发成品稿, "_id"> & {
  _id: string;
};
