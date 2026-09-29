import reactHooks from 'eslint-plugin-react-hooks';

// 只開 React hooks 的兩條規則（hooks 呼叫位置、useEffect/useCallback 依賴陣列），
// 不套整包 recommended，避免為了風格規則大改既有程式碼。
export default [
  { ignores: ['**/dist/**'] },
  {
    files: ['**/*.{js,jsx,mjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
];
