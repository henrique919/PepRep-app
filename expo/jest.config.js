/**
 * Jest runs pure TypeScript under src/engine, src/db, src/ask, src/data,
 * src/store, src/onboarding, src/export, and src/backup — no React / RN / network.
 */
module.exports = {
  testEnvironment: "node",
  roots: [
    "<rootDir>/src/engine",
    "<rootDir>/src/db",
    "<rootDir>/src/ask",
    "<rootDir>/src/data",
    "<rootDir>/src/store",
    "<rootDir>/src/onboarding",
    "<rootDir>/src/export",
    "<rootDir>/src/backup",
  ],
  moduleFileExtensions: ["ts", "js"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: {
          target: "es2020",
          module: "commonjs",
          moduleResolution: "node",
          esModuleInterop: true,
          strict: true,
          types: ["jest"],
        },
      },
    ],
  },
};
