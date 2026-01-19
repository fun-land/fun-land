const tseslint = require('@typescript-eslint/eslint-plugin');
const tsparser = require('@typescript-eslint/parser');
const jest = require('eslint-plugin-jest');

module.exports = [
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      jest,
    },
    rules: {
      ...tseslint.configs["recommended-type-checked"].rules,
      ...jest.configs["flat/recommended"].rules,
      "object-shorthand": 2,
      "@typescript-eslint/no-unused-vars": [
        2,
        {
          varsIgnorePattern: "^_",
          argsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      complexity: [1, 5],
    },
  },
  {
    // Relaxed rules for test files
    files: ["**/*.test.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-unnecessary-type-assertion": "off",
      complexity: "off",
    },
  },
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "coverage/**",
      "examples/**/*.ts",
      "**/*.js",
      "!eslint.config.js",
    ],
  },
];
