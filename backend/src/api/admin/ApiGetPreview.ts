import { ApiCall } from "tsrpc";
import { ReqGetPreview, ResGetPreview } from "../../shared/protocols/admin/PtlGetPreview";

export default async function (call: ApiCall<ReqGetPreview, ResGetPreview>) {
    // TODO
    call.error('API Not Implemented');
}