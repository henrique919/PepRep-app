/**
 * Jest runs pure TypeScript under src/engine, src/db, src/ask, src/data, and
 * src/store — no React, no React Native, no live network.
 */
module.exports = {
  testEnvironment: "node",
  roots: [
    "<rootDir>/src/engine",
    "<rootDir>/src/db",
    "<rootDir>/src/ask",
    "<rootDir>/src/data",
    "<rootDir>/src/store",
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
