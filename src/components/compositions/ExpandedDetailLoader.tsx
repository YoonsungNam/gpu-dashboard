import { getProjectUnits, useData, type GlobalFilters } from '../../data';
import type { TaskType } from '../../mock/types';
import { color, text } from '../../tokens';
import ExpandedTaskDetail from './ExpandedTaskDetail';

/**
 * 펼침 상세의 데이터 로더 — facade가 비동기(실 API 모드)라 행을 펼칠 때
 * getProjectUnits를 fetch하고, 로드 후 기존 ExpandedTaskDetail에 그대로 넘긴다
 * (컴포넌트 prop 형태 유지 — HANDOFF §4-3). mock 모드는 즉시 resolve라
 * placeholder가 한 프레임도 보이지 않는 수준이다.
 */
export default function ExpandedDetailLoader({
  projectId,
  task,
  filters,
  isStrategic,
  showReclaim,
  bg = '#F6F8FA',
  dense = false,
}: {
  projectId: string;
  task: TaskType;
  filters: GlobalFilters;
  isStrategic?: boolean;
  showReclaim?: boolean;
  bg?: string;
  dense?: boolean;
}) {
  const { data, error } = useData(
    () => getProjectUnits(projectId, task, filters),
    [projectId, task, filters],
  );

  if (!data) {
    return (
      <div style={{ padding: '16px 20px', background: bg, ...text.caption, color: color.textTertiary }}>
        {error ? '상세 정보를 불러오지 못했습니다' : '불러오는 중…'}
      </div>
    );
  }
  return (
    <ExpandedTaskDetail
      data={data}
      taskType={task}
      isStrategic={isStrategic}
      showReclaim={showReclaim}
      bg={bg}
      dense={dense}
    />
  );
}
