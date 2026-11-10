import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['node_modules/**', 'coverage/**'] },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
    rules: {
      // `const { password, ...safe } = row` is the idiomatic way to omit a
      // field, so a destructured-and-unused sibling is not an error.
      'no-unused-vars': [
        'error',
        { argsIgnorePattern: '^(_|next$|req$|res$)', ignoreRestSiblings: true },
      ],
      eqeqeq: ['error', 'always'],
      'no-console': 'off',
      'prefer-const': 'error',
    },
  },
];
