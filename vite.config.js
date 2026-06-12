import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        open: false,
        // dev에서 실 API(VITE_USE_MOCK=false) 사용 시 사내 backend로 프록시
        // (HANDOFF §4-4 — 사내 frontend/vite.config.js와 동일 규칙; prod는 nginx).
        proxy: {
            '/board/api': { target: 'http://localhost:8000', changeOrigin: true },
        },
    },
});
