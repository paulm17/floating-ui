// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import globals from 'globals';
import eslint from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';
import prettierRecommended from 'eslint-plugin-prettier/recommended';

export default tseslint.config({
  ignores: ['**/dist/'],
}, eslint.configs.recommended, react.configs.flat.recommended, tseslint.configs.recommended, reactHooks.configs['recommended-latest'], {
  languageOptions: {
    globals: {
      ...globals.node,
      ...globals.browser,
      ...globals.es2021,
    },
    parserOptions: {
      ecmaVersion: 'latest',
    },
  },
  rules: {
    'no-undef': 'off',
    'no-unused-expressions': 'off',
    '@typescript-eslint/no-unused-expressions': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/ban-types': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
        ignoreRestSiblings: true,
      },
    ],
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    'react-hooks/exhaustive-deps': [
      'error',
      {
        additionalHooks: 'useModernLayoutEffect',
      },
    ],
    '@typescript-eslint/consistent-type-imports': [
      'error',
      {
        prefer: 'type-imports',
      },
    ],
  },
  settings: {
    react: {
      version: '18',
    },
  },
}, {
  files: ['packages/vue/**/*.{js,ts}'],
  rules: {
    'react-hooks/rules-of-hooks': 'off',
    'react-hooks/exhaustive-deps': 'off',
  },
}, prettierRecommended, storybook.configs["flat/recommended"]);
