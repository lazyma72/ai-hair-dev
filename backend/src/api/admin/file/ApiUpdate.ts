import { ApiCall } from "tsrpc";
import { ReqUpdate, ResUpdate } from "../../../shared/protocols/admin/file/PtlUpdate";
import { Global } from "../../../models/Global";
import { validateFileInput } from "./fileValidation";

export default async function (call: ApiCall<ReqUpdate, ResUpdate>) {
  const { id, file } = call.req;

  const validation = validateFileInput(file);
  if (!validation.ok) {
    return call.error(validation.message, { code: validation.code });
  }

  const customerCol = Global.getCollection("客户");
  const customer = await customerCol.findOne({ _id: file.客户编号 });
  if (!customer) {
    return call.error("客户编号不存在，请先在客户列表中创建", {
      code: "INVALID_CUSTOMER_NO",
    });
  }

  // 制帽编号必须存在于「制帽」集合
  const hatMakingId = file.制品规格书?.制帽?.编号;
  if (hatMakingId) {
    const hatMakingCol = Global.getCollection("制帽");
    const hatMaking = await hatMakingCol.findOne({ _id: hatMakingId });
    if (!hatMaking) {
      return call.error(`制帽编号「${hatMakingId}」不存在，请先在制帽列表中创建`, {
        code: "INVALID_HAT_MAKING_NO",
      });
    }
  }

  const col = Global.getCollection("沐茵丝假发成品稿");
  const existing = await col.findOne({ _id: id });
  if (!existing) {
    return call.error("找不到对应的成品稿", { code: "NOT_FOUND" });
  }

  if (id === file._id) {
    await col.replaceOne({ _id: id }, file);
    return call.succ({ id: file._id });
  }

  const duplicated = await col.findOne({ _id: file._id });
  if (duplicated) {
    return call.error("该样品编号已存在", { code: "DUPLICATE_ID" });
  }

  await col.insertOne(file);
  await col.deleteOne({ _id: id });
  call.succ({ id: file._id });
}
