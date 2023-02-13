const { execSync } = require('child_process')
const fs = require('fs-extra')
const path = require('path')
const glob = require('glob')

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
  fs.copyFileSync(
    'tests/__data__/input/database/update-guides/programs.db',
    'tests/__data__/output/programs.db'
  )
  fs.copyFileSync(
    'tests/__data__/input/database/update-guides/queue.db',
    'tests/__data__/output/queue.db'
  )
})

it('can generate /guides', () => {
  const stdout = execSync(
    'DB_DIR=tests/__data__/output LOGS_DIR=tests/__data__/output/logs DATA_DIR=tests/__data__/input/data PUBLIC_DIR=tests/__data__/output CURR_DATE=2022-10-20 npm run guides:update',
    { encoding: 'utf8' }
  )

  const uncompressed = glob
    .sync('tests/__data__/expected/guides/**/*.xml')
    .map(f => f.replace('tests/__data__/expected/', ''))

  uncompressed.forEach(filepath => {
    expect(content(`output/${filepath}`), filepath).toBe(content(`expected/${filepath}`))
  })

  const compressed = glob
    .sync('tests/__data__/expected/guides/**/*.xml.gz')
    .map(f => f.replace('tests/__data__/expected/', ''))

  compressed.forEach(filepath => {
    expect(content(`output/${filepath}`), filepath).toBe(content(`expected/${filepath}`))
  })

  expect(content('output/logs/guides/update.log')).toEqual(
    content('expected/logs/guides/update.log')
  )
})

function content(filepath) {
  return fs.readFileSync(`tests/__data__/${filepath}`, {
    encoding: 'utf8'
  })
}
