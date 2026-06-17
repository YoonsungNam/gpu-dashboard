import { num } from '../../lib/util';
import type { TaskType } from '../../mock/types';
import { TaskIcon } from '../../icons/FigureIcons';
import SummaryCard, { type SummaryCell } from './SummaryCard';

/**
 * GPU 활용 현황 상단 Summary (2026-06-16 design, node 7198:8982):
 * 단일 카드 4셀 — [task icon + '{task} 과제' / count개 / 우수 N · 저활용 M] |
 * [총 GPU 수량 / N개 / (H100 기준, 학습만)] | [평균 GPU Util / N%] | [평균 Slot Util / N%].
 * 모든 값은 필터 연동 파생값(페이지 셀렉터에서 주입).
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

export default function ResourceSummary({ data }: { data: ResourceSummaryData }) {
  const kind = data.task === '학습' ? 'training' : 'inference';
  const cells: SummaryCell[] = [
    {
      label: `${data.task} 과제`,
      icon: <TaskIcon kind={kind} size={20} />,
      value: num(data.projectCount),
      unit: '개',
      sub: `우수 ${num(data.goodCount)} · 저활용 ${num(data.alertCount)}`,
    },
    {
      label: '총 GPU 수량',
      value: num(data.totalQuota),
      unit: '개',
      // (H100 기준) 환산 표기는 학습 탭만 — 추론 탭은 제거 (사용자 결정 유지).
      sub: data.task === '학습' ? 'H100 기준' : undefined,
    },
    { label: '평균 GPU Util', value: data.avgGpuUt.toFixed(1), unit: '%' },
    { label: '평균 Slot Util', value: data.avgSlotUt.toFixed(1), unit: '%' },
  ];
  return <SummaryCard cells={cells} />;
}
