/**
 * Jest runs pure TypeScript under src/engine, src/db, src/ask, and src/data —
 * no React, no React Native, no live network.
 */
module.exports = {
  testEnvironment: "node",
  roots: [
    "<rootDir>/src/engine",
    "<rootDir>/src/db",
    "<rootDir>/src/ask",
    "<rootDir>/src/data",
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
