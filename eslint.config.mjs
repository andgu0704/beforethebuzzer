import expoConfig from 'eslint-config-expo/flat.js';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

const engineForbiddenImports = [
  {
    group: ['react', 'react-*', 'react-native', 'react-native-*', 'expo', 'expo-*', '@expo/*'],
    message: 'The engine must stay pure TypeScript.',
  },
  {
    group: ['@/ui/*', '@/state/*', '@/features/*', '@/platform/*', '@/content/*', '@/i18n/*'],
    message: 'The engine may not depend on outer layers; content is injected.',
  },
];

export default tseslint.config(
  { ignores: ['node_modules', '.expo', 'dist', 'docs', 'eslint.config.mjs'] },
  ...expoConfig,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      'no-warning-comments': [
        'error',
        { terms: ['todo', 'fixme', 'xxx', 'hack'], location: 'anywhere' },
      ],
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      '@typescript-eslint/no-unnecessary-condition': [
        'error',
        { allowConstantLoopConditions: true },
      ],
      'import/no-unresolved': 'off',
    },
  },
  {
    files: ['src/engine/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: engineForbiddenImports }],
      'no-restricted-globals': [
        'error',
        'Date',
        'setTimeout',
        'setInterval',
        'console',
        'window',
        'document',
      ],
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: 'Use a named RNG stream.' },
      ],
    },
  },
  {
    files: ['src/content/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'react',
                'react-*',
                'expo',
                'expo-*',
                '@/ui/*',
                '@/state/*',
                '@/features/*',
                '@/platform/*',
              ],
              message: 'Content is plain typed data.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.test.ts'],
    rules: { '@typescript-eslint/no-non-null-assertion': 'off' },
  },
  prettier,
);
