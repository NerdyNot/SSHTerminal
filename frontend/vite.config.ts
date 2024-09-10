import { defineConfig } from 'vite'

export default defineConfig({
  root: './',                          // 프로젝트의 루트 디렉터리
  build: {
    outDir: '../dist',                 // 번들이 생성될 디렉터리
    emptyOutDir: true,                 // 번들 생성 시 디렉터리 비우기
  },
  server: {
    port: 3000,                        // 개발 서버 포트
  },
})
