module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  coverageThreshold: {
    global: {
      branches: 100,
      lines: 100,
      statements: 100
    }
  }
}
