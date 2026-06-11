import { projects } from '../src/mock/data';
const infer = new Set(projects.filter((p) => p.member_tasks.includes('추론')).map((p) => p.purpose));
const train = new Set(projects.filter((p) => p.member_tasks.includes('학습')).map((p) => p.purpose));
console.log('추론 용도(전체):', [...infer].join(', '));
console.log('학습 용도(전체):', [...train].join(', '));
