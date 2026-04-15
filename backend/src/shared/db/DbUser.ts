import { ObjectId } from "mongodb";

export interface DbUser {
  _id: ObjectId;
  name: string;
  username: string;
  /* 密码, 加密存储 */
  password: string;
  /* 目前都是管理员 */
  role: "admin";
  updateTime: Date;
  createTime: Date;
}
