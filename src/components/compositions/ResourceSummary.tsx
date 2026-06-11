import { color, text } from '../../tokens';
import { num } from '../../lib/util';
import type { TaskType } from '../../mock/types';
import { TaskIcon } from '../../icons/FigureIcons';

/**
 * GPU 활용 현황 상단 Summary (2026-06-11 design, node 7164:6328 'ServiceCount'):
 * [task icon + '추론 과제' 400/14 #2F363C] 52(600/24 #3C444B) 개(400/16 #565E66)
 * (우수 2 · 저활용 4)(400/14 #565E66) | 총 GPU 수량 N 개 (H100 기준) |
 * 평균 GPU Util N % | 평균 Slot Util N % — 1×12 #2F363C divider sticks.
 * All values are filter-aware (passed in from the page selectors).
 */
export interface ResourceSummaryData {
  task: TaskType;
  projectCount: number;
  goodCount: number;
  alertCount: number;
  totalQuota: number;
  avgGpuUt: number;
  avgSlotUt: number;
}

function Divider() {
  return <span style={{ width: 1, height: 12, background: '#2F363C', margin: '0 10px', flexShrink: 0 }} />;
}

function Value({ v, unit, sub }: { v: string; unit?: string; sub?: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: 3 }}>
      <span style={{ fontSize: 24, lineHeight: '28px', fontWeight: 600, color: color.textTitle }}>{v}</span>
      {unit && <span style={{ fontSize: 16, lineHeight: '20px', fontWeight: 400, color: color.textSecondary }}>{unit}</span>}
      {sub && <span style={{ ...text.body, color: color.textSecondary, marginLeft: 3 }}>{sub}</span>}
    </span>
  );
}

function Label({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginRight: 10 }}>
      {icon}
      <span style={{ ...text.body, color: color.textPrimary }}>{children}</span>
    </span>
  );
}

export default function ResourceSummary({ data }: { data: ResourceSummaryData }) {
  const kind = data.task === '학습' ? 'training' : 'inference';
  return (
    <div style={{ display: 'flex', alignItems: 'center', height: 28, minWidth: 0, flexWrap: 'wrap' }}>
      <Label icon={<TaskIcon kind={kind} size={20} />}>{data.task} 과제</Label>
      <Value
        v={num(data.projectCount)}
        unit="개"
        sub={`(우수 ${num(data.goodCount)} · 저활용 ${num(data.alertCount)})`}
      />
      <Divider />
      <Label>총 GPU 수량</Label>
      {/* (H100 기준) 환산 표기는 학습 탭만 — 추론 탭은 제거 (2026-06-11 피드백). */}
      <Value v={num(data.totalQuota)} unit="개" sub={data.task === '학습' ? '(H100 기준)' : undefined} />
      <Divider />
      <Label>평균 GPU Util</Label>
      <Value v={String(Math.round(data.avgGpuUt))} unit="%" />
      <Divider />
      <Label>평균 Slot Util</Label>
      <Value v={String(Math.round(data.avgSlotUt))} unit="%" />
    </div>
  );
}
