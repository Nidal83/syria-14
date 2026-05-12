import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
  // Ignore build output and the auto-generated Supabase types
  {
    ignores: ['dist', 'build', 'coverage', 'src/integrations/supabase/types.ts'],
  },

  // Base + TypeScript recommended
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.es2022 },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,

      // Warn instead of error so dev velocity isn't blocked, but CI sees them.
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // Turn unused-vars back ON (Lovable had it off).
      // Allow underscore-prefixed args/vars to opt out — useful for unused callback params.
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // `any` is a smell — warn but don't block. Phase 1 will eliminate the remaining ones.
      '@typescript-eslint/no-explicit-any': 'warn',

      // Common foot-guns
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'warn',
      'prefer-const': 'warn',
      eqeqeq: ['warn', 'smart'],
    },
  },

  // Node-context config files
  {
    files: ['*.config.{js,ts}', 'vite.config.ts', 'vitest.config.ts'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },

  // Disable ESLint stylistic rules that Prettier owns. KEEP THIS LAST.
  prettierConfig,
);
