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
                <Row label="帽网款式" value={hatMaking.帽网款式} />
                <Row label="备注" value={hatMaking.备注 || "-"} />
              </div>
            </Section>

            <Section title="图片">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {(hatMaking.imgList ?? []).length > 0 ? (
                  hatMaking.imgList!.map((img, index) => (
                    <div
                      key={`${img}-${index}`}
                      className="rounded border border-slate-200 p-3"
                    >
                      <img
                        src={resolveImageUrl(img)}
                        alt={`制帽图片${index + 1}`}
                        className="max-h-64 w-full rounded border border-slate-100 object-contain"
                      />
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-slate-400">未配置</div>
                )}
              </div>
            </Section>
          </div>
        ) : null}
      </StatusView>
    </PageShell>
  );
}
