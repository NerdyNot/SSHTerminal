import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite 설정
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      // 필요한 경우 외부 모듈을 명시적으로 지정
      external: [],
    },
    outDir: './public', // 빌드된 파일들이 저장될 경로
  },
})
