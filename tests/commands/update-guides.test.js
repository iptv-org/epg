const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

beforeEach(() => {
  fs.rmdirSync('tests/__data__/output', { recursive: true })
  fs.mkdirSync('tests/__data__/output')
  fs.mkdirSync('tests/__data__/temp/database', { recursive: true })
  fs.copyFileSync('tests/__data__/input/database/queue.db', 'tests/__data__/temp/database/queue.db')
  fs.copyFileSync(
    'tests/__data__/input/database/programs.db',
    'tests/__data__/temp/database/programs.db'
  )

  const stdout = execSync(
    'DB_DIR=tests/__data__/temp/database DATA_DIR=tests/__data__/input/data PUBLIC_DIR=tests/__data__/output LOGS_DIR=tests/__data__/output/logs node scripts/commands/update-guides.js',
    { encoding: 'utf8' }
  )
})

afterEach(() => {
  fs.rmdirSync('tests/__data__/temp', { recursive: true })
})

it('can generate /guides', () => {
  const output1 = content('tests/__data__/output/guides/fr/chaines-tv.orange.fr.epg.xml')
  const expected1 = content('tests/__data__/expected/guides/fr/chaines-tv.orange.fr.epg.xml')

  expect(output1).toBe(expected1)

  const output2 = content('tests/__data__/output/guides/zw/dstv.com.epg.xml')
  const expected2 = content('tests/__data__/expected/guides/zw/dstv.com.epg.xml')

  expect(output2).toBe(expected2)
})

it('can create guides.log', () => {
  const output = content('tests/__data__/output/logs/guides.log')
  const expected = content('tests/__data__/expected/logs/guides.log')

  expect(output).toBe(expected)
})

it('can create errors.log', () => {
  const output = content('tests/__data__/output/logs/errors.log')
  const expected = content('tests/__data__/expected/logs/errors.log')

  expect(output).toBe(expected)
})

function content(filepath) {
  const data = fs.readFileSync(path.resolve(filepath), {
    encoding: 'utf8'
  })

  return JSON.stringify(data)
}
