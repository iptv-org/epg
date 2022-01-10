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
    'DB_DIR=tests/__data__/temp/database GUIDES_DIR=tests/__data__/output/guides node scripts/commands/update-guides.js',
    { encoding: 'utf8' }
  )
})

afterEach(() => {
  fs.rmdirSync('tests/__data__/temp', { recursive: true })
})

it('can generate epg.xml', () => {
  const output = content('tests/__data__/output/guides/epg.xml')
  const expected = content('tests/__data__/expected/guides/epg.xml')

  expect(output).toBe(expected)
})

it('can generate /countries guides', () => {
  const output1 = content('tests/__data__/output/guides/countries/us.epg.xml')
  const expected1 = content('tests/__data__/expected/guides/countries/us.epg.xml')

  expect(output1).toBe(expected1)

  const output2 = content('tests/__data__/output/guides/countries/za.epg.xml')
  const expected2 = content('tests/__data__/expected/guides/countries/za.epg.xml')

  expect(output2).toBe(expected2)
})

function content(filepath) {
  const data = fs.readFileSync(path.resolve(filepath), {
    encoding: 'utf8'
  })

  return JSON.stringify(data)
}
