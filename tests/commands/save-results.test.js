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
  const output = content('tests/__data__/output/database/programs.db')

  expect(Object.keys(output[0]).sort()).toEqual([
    '_id',
    'category',
    'channel',
    'country',
    'description',
    'gid',
    'icon',
    'lang',
    'site',
    'start',
    'stop',
    'title'
  ])
})

function content(filepath) {
  const data = fs.readFileSync(path.resolve(filepath), {
    encoding: 'utf8'
  })

  return data
    .split('\n')
    .filter(l => l)
    .map(l => {
      return JSON.parse(l)
    })
}
