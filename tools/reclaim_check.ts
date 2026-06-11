import { projects, getProjectUnits, getRankByTask, DEFAULT_FILTERS } from '../src/mock/data';
import { gradeOf } from '../src/lib/gradePolicy';
import { projectUtil } from '../src/mock/data';
import type { TaskType } from '../src/mock/types';

// 용도별 저활용 샘플 1개씩: 게이지 라벨/목표가 정책 경계와 일치하는지
const EXPECT: Record<string, [string, number][]> = {
  '생산시스템 연계': [['GPU Util 기준', 5], ['Slot Util 기준', 75]],
  '일반업무': [['GPU Util WH 기준', 30], ['Slot Util 기준', 75]],
  '서비스테스트': [['GPU Util WH 기준', 30], ['Slot Util 기준', 75]],
  '모델 학습': [['GPU Util 기준', 30], ['Slot Util 기준', 75]],
  '모델 개발': [['GPU Util 기준', 5], ['Slot Util 기준', 75]],
};
let fail = 0;
for (const task of ['추론', '학습'] as TaskType[]) {
  const pool = projects.filter((p) => p.member_tasks.includes(task));
  for (const purpose of new Set(pool.map((p) => p.purpose))) {
    const sample = pool.find(
      (p) => p.purpose === purpose && gradeOf(task, p.purpose, projectUtil(p, task, DEFAULT_FILTERS)) === '저활용',
    );
    if (!sample) { console.log(task, purpose, '— 저활용 샘플 없음 (skip)'); continue; }
    const re = getProjectUnits(sample.project_id, task, DEFAULT_FILTERS).info.reclaim_estimate!;
    const got = re.map((x) => [x.label, x.basis.target_pct]);
    const want = EXPECT[purpose];
    const ok = JSON.stringify(got) === JSON.stringify(want);
    if (!ok) fail++;
    console.log(ok ? 'OK ' : 'FAIL', task, purpose, '→', got.map(([l, t]) => `${l} 목표 ${t}%`).join(' · '));
  }
}
// 회수 수량 일관성: 게이지 모수 == 과제 quota
const sample = projects[0];
const re0 = getProjectUnits(sample.project_id, sample.member_tasks[0], DEFAULT_FILTERS).info.reclaim_estimate!;
console.log('모수==quota:', re0.every((x) => x.basis.total_count === sample.quota) ? 'OK' : 'FAIL');
console.log(fail === 0 ? '✓ 전체 통과' : `✗ ${fail}건 불일치`);
