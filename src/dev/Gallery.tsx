import Card from '../components/primitives/Card';
import UtilBadge from '../components/primitives/UtilBadge';
import TaskTypeBadge from '../components/primitives/TaskTypeBadge';
import ProgressBar from '../components/primitives/ProgressBar';
import StatHero from '../components/primitives/StatHero';
import { color, space, text } from '../tokens';
import { kpiByTask } from '../mock/data';

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: space.xl, padding: `${space.md}px 0` }}>
      <div style={{ width: 140, ...text.caption, color: color.textTertiary }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: space.lg, flexWrap: 'wrap' }}>
        {children}
      </div>
    </div>
  );
}

/** Phase-1 component gallery — proves the token pipeline end to end. */
export default function Gallery() {
  return (
    <div style={{ display: 'grid', gap: space.xl }}>
      <Card title="UtilBadge — 임계 색(good / warn / bad)">
        <Row label="값별 색상">
          <UtilBadge value={92.3} />
          <UtilBadge value={78.7} />
          <UtilBadge value={45.2} />
          <UtilBadge value={12.4} />
        </Row>
      </Card>

      <Card title="TaskTypeBadge — 과제 유형">
        <Row label="유형">
          <TaskTypeBadge kind="inference" />
          <TaskTypeBadge kind="training" />
          <TaskTypeBadge kind="core" />
        </Row>
      </Card>

      <Card title="StatHero + ProgressBar — 활용현황 미리보기">
        <div style={{ display: 'flex', gap: 40, alignItems: 'center' }}>
          <StatHero value={kpiByTask[0].project_count} label="추론 · Projects" />
          <div style={{ flex: 1, display: 'grid', gap: space.md }}>
            {[
              ['GPU UM', kpiByTask[0].avg_gpu_ut],
              ['GPU UA', kpiByTask[0].avg_gpu_ut_working ?? 0],
              ['Run UM', kpiByTask[0].avg_slot_ut],
            ].map(([k, v]) => (
              <div key={k as string} style={{ display: 'flex', alignItems: 'center', gap: space.lg }}>
                <span style={{ width: 64, ...text.caption, color: color.textSecondary }}>{k}</span>
                <ProgressBar value={v as number} />
                <span style={{ width: 48, textAlign: 'right', ...text.label }}>{v}%</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <Card title="Typography ramp">
        <div style={{ display: 'grid', gap: space.sm }}>
          {Object.entries(text).map(([name, st]) => (
            <div key={name} style={{ ...st, color: color.textPrimary }}>
              {name} — 다람쥐 헌 쳇바퀴에 타고파 0123
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
