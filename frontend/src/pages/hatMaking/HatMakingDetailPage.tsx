import { useNavigate, useParams } from "react-router-dom";
import { callApi } from "../../api/callApi";
import PageShell from "../../components/PageShell";
import Row from "../../components/Row";
import Section from "../../components/Section";
import StatusView from "../../components/StatusView";
import { useApi } from "../../hooks/useApi";
import { frontConfig } from "../../frontConfig";
import type { Db制帽 } from "../../shared/db/Db制帽";

type HatMakingItem = Db制帽;

function resolveImageUrl(src: string): string {
  const trimmed = src.trim();
  if (!trimmed) return "";

  const fromPath = trimmed.match(/^(\/upload\/.*)$/i);
  if (fromPath) {
    return new URL(fromPath[1], frontConfig.prodServer).toString();
  }

  try {
    const parsed = new URL(trimmed);
    if (/^\/upload\//i.test(parsed.pathname)) {
      return new URL(parsed.pathname, frontConfig.prodServer).toString();
    }
    return parsed.toString();
  } catch {
    return trimmed;
  }
}

export default function HatMakingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, loading, error } = useApi<{ 制帽: HatMakingItem }>(
    () =>
      callApi(
        "admin/hatMaking/GetDetail" as never,
        { id: id! } as never,
      ) as Promise<
        | { isSucc: true; res: { 制帽: HatMakingItem } }
        | { isSucc: false; err: { message: string } }
      >,
  );

  const hatMaking: HatMakingItem | null = data?.制帽 ?? null;

  return (
    <PageShell
      title={hatMaking ? `制帽：${hatMaking._id}` : "制帽详情"}
      onBack={() => navigate(-1)}
    >
      <StatusView loading={loading} error={error}>
        {hatMaking ? (
          <div className="space-y-4">
            <Section title="基本信息">
              <div className="divide-y divide-slate-100">
                <Row label="制帽编号" value={hatMaking._id} />
                <Row label="名称" value={hatMaking.名称} />
                <Row label="帽围" value={`${hatMaking.帽围} cm`} />
                <Row label="帽深" value={`${hatMaking.帽深} cm`} />
                <Row label="前后" value={`${hatMaking.前后} cm`} />
              </div>
            </Section>

            <Section title="图片">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded border border-slate-200 p-3">
                  <div className="mb-2 text-sm font-medium text-slate-700">
                    高针图
                  </div>
                  {hatMaking.高针图 ? (
                    <img
                      src={resolveImageUrl(hatMaking.高针图)}
                      alt="高针图"
                      className="max-h-64 w-full rounded border border-slate-100 object-contain"
                    />
                  ) : (
                    <div className="text-sm text-slate-400">未配置</div>
                  )}
                </div>
                <div className="rounded border border-slate-200 p-3">
                  <div className="mb-2 text-sm font-medium text-slate-700">
                    手织图
                  </div>
                  {hatMaking.手织图 ? (
                    <img
                      src={resolveImageUrl(hatMaking.手织图)}
                      alt="手织图"
                      className="max-h-64 w-full rounded border border-slate-100 object-contain"
                    />
                  ) : (
                    <div className="text-sm text-slate-400">未配置</div>
                  )}
                </div>
              </div>
            </Section>

            <Section title="高针图系统预置区域列表">
              <div className="overflow-x-auto rounded border border-slate-200">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="border border-slate-200 px-3 py-2 text-left">
                        区域名
                      </th>
                      <th className="border border-slate-200 px-3 py-2 text-left">
                        长度
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {hatMaking.高针图系统预置区域列表.map((item) => (
                      <tr key={item.name} className="bg-white">
                        <td className="border border-slate-200 px-3 py-2">
                          {item.name}
                        </td>
                        <td className="border border-slate-200 px-3 py-2">
                          {item.lineLength}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>

            <Section title="手织图系统预置区域列表">
              <div className="overflow-x-auto rounded border border-slate-200">
                <table className="w-full border-collapse text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="border border-slate-200 px-3 py-2 text-left">
                        区域名
                      </th>
                      <th className="border border-slate-200 px-3 py-2 text-left">
                        长度
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {hatMaking.手织图系统预置区域列表.map((item) => (
                      <tr key={item.name} className="bg-white">
                        <td className="border border-slate-200 px-3 py-2">
                          {item.name}
                        </td>
                        <td className="border border-slate-200 px-3 py-2">
                          {item.lineLength}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          </div>
        ) : null}
      </StatusView>
    </PageShell>
  );
}
