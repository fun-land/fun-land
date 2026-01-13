module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json']
  },
  plugins: ['jest'],
  extends: [
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:jest/recommended',
    'plugin:prettier/recommended' // Enables eslint-plugin-prettier and eslint-config-prettier. This will display prettier errors as ESLint errors. Make sure this is always the last configuration in the extends array.
  ],
  rules: {
    'object-shorthand': 2,
    'prettier/prettier': [
      1,
      {
        endOfLine: 'auto'
      }
    ],
    '@typescript-eslint/explicit-function-return-type': [
      2,
      {allowTypedFunctionExpressions: true, allowHigherOrderFunctions: true}
    ],
    complexity: [1, 5] // KISS
  }
}
