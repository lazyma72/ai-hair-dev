/**
 * RatioDetailPage — 胶丝比例详情页
 *
 * 展示一个颜色编号下 D / M / L 三组配比数据。
 * 每组用独立的配比表格展示。
 *
 * 如何改？
 *   - 增加图片展示：在最下方加 <img src={data.颜色图片参考} />
 *   - 修改比例展示格式：修改 columns 中 render 函数
 */
import { useNavigate, useParams } from "react-router-dom";
import { callApi } from "../../api/callApi";
import { type Column } from "../../components/DataTable";
import DataTable from "../../components/DataTable";
import PageShell from "../../components/PageShell";
import Row from "../../components/Row";
import Section from "../../components/Section";
import StatusView from "../../components/StatusView";
import { useApi } from "../../hooks/useApi";
import type { 胶丝比例Frontend } from "../../shared/frontend/model/model";
import type { KLS胶丝比例 } from "../../shared/db/Db胶丝比例";

const 配比列: Column<KLS胶丝比例>[] = [
  {
    key: "发丝种类",
    title: "发丝种类",
    render: (r) => <span className="font-medium">{r.发丝种类}</span>,
  },
  {
    key: "色号",
    title: "色号",
    render: (r) => r.色号,
  },
  {
    key: "比例",
    title: "比例 %",
    render: (r) => (
      <div className="flex items-center gap-2">
        <div
          className="h-1.5 rounded bg-slate-900"
          style={{ width: `${Math.min(r.比例, 100)}%`, minWidth: 4 }}
        />
        <span>{r.比例}%</span>
      </div>
    ),
  },
];

export default function RatioDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data, loading, error } = useApi(() =>
    callApi("admin/ratio/GetDetail", { id: id! }),
  );

  const ratio: 胶丝比例Frontend | null = data?.胶丝比例 ?? null;

  return (
    <PageShell
      title={ratio ? `颜色：${ratio._id}` : "胶丝比例详情"}
      onBack={() => navigate(-1)}
    >
      <StatusView loading={loading} error={error}>
        {ratio && (
          <div className="space-y-5">
            {/* 基本信息 */}
            <Section title="基本信息">
              <div className="divide-y divide-slate-100">
                <Row label="颜色编号" value={ratio._id} />
                <Row label="线色" value={ratio.线色 ?? "—"} />
                <Row label="备注" value={ratio.备注 ?? "—"} />
              </div>
            </Section>

            {/* 颜色图片 */}
            {ratio.颜色图片参考 && (
              <Section title="颜色图片参考">
                <div className="p-4">
                  <img
                    src={`data:image/jpeg;base64,${ratio.颜色图片参考}`}
                    alt="颜色参考"
                    className="max-h-48 rounded object-contain"
                  />
                </div>
              </Section>
            )}

            {/* D 配比 */}
            <Section title="D 色配比">
              <DataTable
                columns={配比列}
                rows={ratio.D}
                rowKey={(r) => r.色号 + r.发丝种类}
              />
            </Section>

            {/* M 配比（可选） */}
            {ratio.M && ratio.M.length > 0 && (
              <Section title="M 色配比">
                <DataTable
                  columns={配比列}
                  rows={ratio.M}
                  rowKey={(r) => r.色号 + r.发丝种类}
                />
              </Section>
            )}

            {/* L 配比（可选） */}
            {ratio.L && ratio.L.length > 0 && (
              <Section title="L 色配比">
                <DataTable
                  columns={配比列}
                  rows={ratio.L}
                  rowKey={(r) => r.色号 + r.发丝种类}
                />
              </Section>
            )}
          </div>
        )}
      </StatusView>
    </PageShell>
  );
}
