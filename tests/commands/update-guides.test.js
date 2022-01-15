const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

beforeEach(() => {
  fs.rmdirSync('tests/__data__/output', { recursive: true })
  fs.mkdirSync('tests/__data__/output')
  fs.mkdirSync('tests/__data__/temp/database', { recursive: true })
  fs.copyFileSync(
    'tests/__data__/input/database/channels.db',
    'tests/__data__/temp/database/channels.db'
  )
  fs.copyFileSync(
    'tests/__data__/input/database/programs.db',
    'tests/__data__/temp/database/programs.db'
  )

  execSync(
    'DB_DIR=tests/__data__/temp/database PUBLIC_DIR=tests/__data__/output LOGS_DIR=tests/__data__/output/logs node scripts/commands/update-guides.js',
    { encoding: 'utf8' }
  )
})

afterEach(() => {
  fs.rmdirSync('tests/__data__/temp', { recursive: true })
})

it('can generate /guides', () => {
  const output1 = content('tests/__data__/output/guides/us/magticom.ge.epg.xml')
  const expected1 = content('tests/__data__/expected/guides/us/magticom.ge.epg.xml')

  expect(output1).toBe(expected1)

  const output2 = content('tests/__data__/output/guides/za/dstv.com.epg.xml')
  const expected2 = content('tests/__data__/expected/guides/za/dstv.com.epg.xml')

  expect(output2).toBe(expected2)

  const output3 = content('tests/__data__/output/logs/update-guides.log')
  const expected3 = content('tests/__data__/expected/logs/update-guides.log')

  expect(output3).toBe(expected3)
})

function content(filepath) {
  const data = fs.readFileSync(path.resolve(filepath), {
    encoding: 'utf8'
  })

  return JSON.stringify(data)
}
