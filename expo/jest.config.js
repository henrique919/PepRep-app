/**
 * Jest runs ONLY pure TypeScript (src/engine + the pure db mappers) — no
 * React, no React Native, no I/O, so a plain node environment suffices.
 */
module.exports = {
  testEnvironment: "node",
  roots: ["<rootDir>/src/engine", "<rootDir>/src/db"],
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
