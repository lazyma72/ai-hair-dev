import { useNavigate, useParams } from "react-router-dom";
import { callApi } from "../../api/callApi";
import PageShell from "../../components/PageShell";
import Row from "../../components/Row";
import Section from "../../components/Section";
import StatusView from "../../components/StatusView";
import { useApi } from "../../hooks/useApi";

type HatMakingItem = {
  _id: string;
  名称: string;
  帽围: number;
  帽深: number;
  前后: number;
};

export default function HatMakingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, loading, error } = useApi<{ 制帽: HatMakingItem }>(() =>
    callApi("admin/hatMaking/GetDetail" as never, { id: id! } as never) as Promise<
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
          <Section title="基本信息">
            <div className="divide-y divide-slate-100">
              <Row label="制帽编号" value={hatMaking._id} />
              <Row label="名称" value={hatMaking.名称} />
              <Row label="帽围" value={`${hatMaking.帽围} cm`} />
              <Row label="帽深" value={`${hatMaking.帽深} cm`} />
              <Row label="前后" value={`${hatMaking.前后} cm`} />
            </div>
          </Section>
        ) : null}
      </StatusView>
    </PageShell>
  );
}
