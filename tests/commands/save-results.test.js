const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

beforeEach(() => {
  fs.rmdirSync('tests/__data__/output', { recursive: true })
  fs.mkdirSync('tests/__data__/output')

  execSync(
    'DB_DIR=tests/__data__/output/database LOGS_DIR=tests/__data__/input/logs node scripts/commands/save-results.js',
    { encoding: 'utf8' }
  )
})

it('can save results to database', () => {
  const output = fs.readFileSync(path.resolve('tests/__data__/output/database/programs.db'), {
    encoding: 'utf8'
  })
  const lines = output.split('\n')
  const parsed = JSON.parse(lines[0])

  expect(Object.keys(parsed).sort()).toEqual([
    '_id',
    'category',
    'channel',
    'country',
    'description',
    'icon',
    'lang',
    'site',
    'start',
    'stop',
    'title'
  ])
})
