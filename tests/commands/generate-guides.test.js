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

  execSync(
    'DB_DIR=tests/__data__/temp/database PUBLIC_DIR=tests/__data__/output node scripts/commands/generate-guides.js',
    { encoding: 'utf8' }
  )
})

afterEach(() => {
  fs.rmdirSync('tests/__data__/temp', { recursive: true })
})

it('can generate channels.json', () => {
  const output = content('tests/__data__/output/api/channels.json')
  const expected = content('tests/__data__/expected/api/channels.json')

  expect(output).toBe(expected)
})

it('can generate programs.json', () => {
  const output = content('tests/__data__/output/api/programs.json')
  const expected = content('tests/__data__/expected/api/programs.json')

  expect(output).toBe(expected)
})

it('can generate epg.xml', () => {
  const output = content('tests/__data__/output/guides/epg.xml')
  const expected = content('tests/__data__/expected/guides/epg.xml')

  expect(output).toBe(expected)
})

function content(filepath) {
  const data = fs.readFileSync(path.resolve(filepath), {
    encoding: 'utf8'
  })

  return JSON.stringify(data)
}
