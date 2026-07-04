module.exports = {
  transform: { '^.+\\.(t|j)sx?$': ['@swc/jest'] },
  testMatch: ['<rootDir>/lib/**/*.test.ts'],
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  }
}
