module.exports = {
  displayName: 'server',
  preset: '../../jest.preset.js',
  coverageDirectory: '../../coverage/apps/server',
  testMatch: ['**/*.spec.ts', '**/*.e2e-spec.ts'],
  setupFiles: ['<rootDir>/jest.setup.ts'],
};
