module.exports = {
  transform: { '^.+\\.(t|j)sx?$': ['@swc/jest'] },
  testMatch: ['<rootDir>/lib/**/*.test.ts', '<rootDir>/app/**/*.test.ts'],
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  }
}
