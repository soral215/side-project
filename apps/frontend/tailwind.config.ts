import type { Config } from 'tailwindcss';
import { designSystemTheme } from '@side-project/design-system/tailwind.config';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    // 디자인 시스템 소스도 스캔하여 사용된 클래스 생성
    '../../packages/design-system/src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      ...designSystemTheme,
      // 프론트엔드 전용 확장도 여기에 추가 가능
    },
  },
  plugins: [],
};
export default config;


