/**
 * Jest runs pure TypeScript under src/engine, src/db, src/ask, src/data,
 * src/store, src/onboarding, src/export, src/backup, and src/cloudBackup — no React / RN /
 * network. Only src/cloudBackup/config.ts and paths.ts are covered here — client.ts/api.ts
 * import @supabase/supabase-js + expo-secure-store and are exercised via typecheck, not Jest.
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
    "<rootDir>/src/cloudBackup",
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
          types: ["jest", "node"],
        },
      },
    ],
  },
};
