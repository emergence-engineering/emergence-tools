/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  modulePathIgnorePatterns: ["<rootDir>/dist/"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      { tsconfig: "tsconfig.test.json" },
    ],
  },
};
