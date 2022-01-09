const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

beforeEach(() => {
  fs.rmdirSync('tests/__data__/output', { recursive: true })
  fs.mkdirSync('tests/__data__/output')
})

it('can create valid matrix', () => {
  const result = execSync(
    'DB_DIR=tests/__data__/input/database node scripts/commands/create-matrix.js',
    {
      encoding: 'utf8'
    }
  )

  expect(result).toBe('::set-output name=matrix::{"cluster_id":[1]}\n')
})
