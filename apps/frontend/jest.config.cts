module.exports = {
  displayName: 'frontend',
  preset: 'jest-preset-angular',
  coverageDirectory: '../../coverage/apps/frontend',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  testMatch: ['**/*.spec.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!.*\\.mjs$|@angular/common/locales/.*\\.js$|marked/)',
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/index.ts',
    '!src/**/*.interface.ts',
    '!src/main.ts',
    '!src/environments/**',
  ],
  moduleNameMapper: {
    '^@smartdoc-analyst/api-interfaces$': '<rootDir>/../../libs/api-interfaces/src/index.ts',
  },
};
