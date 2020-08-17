module.exports = {
    'root': true,
    'parser': '@typescript-eslint/parser',
    parserOptions: {
      tsconfigRootDir: __dirname,
      project: ['./tsconfig.json']
    },
    'plugins': [
      'jest'
    ],
    extends: [
      'standard-with-typescript',
      'plugin:@typescript-eslint/recommended-requiring-type-checking',
      'plugin:jest/recommended',
      "prettier/@typescript-eslint", // Uses eslint-config-prettier to disable ESLint rules from @typescript-eslint/eslint-plugin that would conflict with prettier
      "plugin:prettier/recommended" // Enables eslint-plugin-prettier and eslint-config-prettier. This will display prettier errors as ESLint errors. Make sure this is always the last configuration in the extends array.
    
    ],
    'rules': {
      'object-shorthand': 2,
      '@typescript-eslint/explicit-function-return-type': [2, { allowTypedFunctionExpressions: true, allowHigherOrderFunctions: true }],
      'complexity': [1, 5] // KISS
    }
  }
  