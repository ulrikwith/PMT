export default {
  testEnvironment: 'node',
  roots: ['<rootDir>/services', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.{js,ts}', '**/*.test.{js,ts}', '**/*.spec.{js,ts}'],
  collectCoverageFrom: ['services/**/*.{js,ts}', '!services/**/index.js', '!**/node_modules/**'],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50,
    },
  },
  verbose: true,
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.(t|j)sx?$': 'babel-jest',
  },
};
