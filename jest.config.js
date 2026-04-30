/** @type {import('jest').Config} */
const config = {
  testEnvironment: "jsdom",

  transform: {
    "^.+\\.(ts|tsx)$": ["@swc/jest"],
  },

  // ... muud seaded ...

  collectCoverage: true,
  collectCoverageFrom: [
    "app/**/*.{ts,tsx}",
    "components/**/*.{ts,tsx}",
    "lib/**/*.{ts,tsx}",
    "!**/node_modules/**",
    "!**/*.d.ts",
    "!app/layout.tsx", // Tavaliselt ignoreeritakse layouti, kui seal loogikat pole
  ],
  
  coverageReporters: ["lcov", "text-summary"],
  coverageDirectory: "coverage",
};

export default config;