/** @type {import('jest').Config} */
const config = {
  testEnvironment: "jsdom",

  transform: {
    "^.+\\.(ts|tsx)$": ["@swc/jest"],
  },

  testMatch: [
    "**/__tests__/**/*.(test|spec).(ts|tsx)",
    "**/?(*.)+(test|spec).(ts|tsx)"
  ],

  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1"
  },

  setupFilesAfterEnv: ["<rootDir>/setupTests.ts"],

  collectCoverage: true,
  coverageReporters: ["lcov", "text-summary"],
  coverageDirectory: "coverage"
};

export default config;
