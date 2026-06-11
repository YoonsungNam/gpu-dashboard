/* eslint-disable no-console -- dev-only data sanity harness */
import { projects, getKpiByTask, getRankByTask, getUtilTrend, DEFAULT_FILTERS, quotaByEnvGpu } from '../src/mock/data';
import { getTokenView } from '../src/mock/tokens';
import { fmtTokens } from '../src/lib/util';
import type { TaskType } from '../src/mock/types';

const f = DEFAULT_FILTERS;
const kpi = getKpiByTask(f);
const rank = getRankByTask(f);
console.log('과제 수:', kpi.map((k) => `${k.task}=${k.project_count}`).join(' · '), `(총 ${projects.length}개)`);
console.log('총 GPU 수량:', kpi.map((k) => `${k.task}=${k.gpu_total}`).join(' · '));
console.log('보유 총량:', quotaByEnvGpu.reduce((s, q) => s + q.gpu_count, 0), '/ 과제 quota 합(중복 제외):', projects.reduce((s, p) => s + p.quota, 0));
console.log('등급:', (['추론', '학습'] as TaskType[]).map((t) => `${t} 우수 ${rank[t].good_count} · 저활용 ${rank[t].alert_count}`).join(' / '));
console.log('평균:', kpi.map((k) => `${k.task} GPU ${k.avg_gpu_ut}% Slot ${k.avg_slot_ut}%`).join(' / '));
const tr = getUtilTrend(f)['추론'];
const wd = tr.filter((_, i) => i % 7 < 5).reduce((s, p) => s + p.gpu_ut, 0) / 20;
const we = tr.filter((_, i) => i % 7 >= 5).reduce((s, p) => s + p.gpu_ut, 0) / 8;
console.log('추론 추이: 주중 GPU', `${wd.toFixed(1)}%`, 'vs 주말', `${we.toFixed(1)}%`, `(비율 ${(we / wd).toFixed(2)})`);
const slotAvg = tr.reduce((s, p) => s + p.slot_ut, 0) / tr.length;
const gpuAvg = tr.reduce((s, p) => s + p.gpu_ut, 0) / tr.length;
console.log('추론 추이: Slot 평균', `${slotAvg.toFixed(1)}%`, 'vs GPU 평균', `${gpuAvg.toFixed(1)}%`);
const trT = getUtilTrend(f)['학습'];
console.log('학습 추이: Slot 평균', `${(trT.reduce((s, p) => s + p.slot_ut, 0) / trT.length).toFixed(1)}%`, 'vs GPU 평균', `${(trT.reduce((s, p) => s + p.gpu_ut, 0) / trT.length).toFixed(1)}%`);
const tv = getTokenView(f);
console.log('토큰: 그룹', tv.totals.group_count, '· 서비스', tv.totals.service_count, '· 일평균 합계', fmtTokens(tv.totals.avg_total), `(${tv.totals.avg_total.toLocaleString()})`);
