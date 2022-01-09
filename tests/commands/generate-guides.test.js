const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

beforeEach(() => {
  fs.rmdirSync('tests/__data__/output', { recursive: true })
  fs.mkdirSync('tests/__data__/output')
  fs.mkdirSync('tests/__data__/output/api')
})

it('can generate channels.json', () => {
  const result = execSync(
    'PUBLIC_DIR=tests/__data__/output DB_DIR=tests/__data__/input/database node scripts/commands/generate-guides.js',
    { encoding: 'utf8' }
  )
  const json = fs.readFileSync(path.resolve('tests/__data__/output/api/channels.json'), {
    encoding: 'utf8'
  })
  const parsed = JSON.parse(json)
  expect(parsed[0]).toMatchObject({
    id: 'AndorraTV.ad',
    name: ['Andorra TV'],
    logo: null,
    country: 'AD'
  })
})

it('can generate programs.json', () => {
  const result = execSync(
    'PUBLIC_DIR=tests/__data__/output DB_DIR=tests/__data__/input/database node scripts/commands/generate-guides.js',
    { encoding: 'utf8' }
  )
  const json = fs.readFileSync(path.resolve('tests/__data__/output/api/programs.json'), {
    encoding: 'utf8'
  })
  const parsed = JSON.parse(json)
  const program = parsed['AndorraTV.ad'][0]
  expect(Object.keys(program).sort()).toEqual([
    'categories',
    'channel',
    'description',
    'image',
    'start',
    'stop',
    'title'
  ])
  expect(Array.isArray(program.title)).toBe(true)
  expect(Array.isArray(program.description)).toBe(true)
  expect(Array.isArray(program.categories)).toBe(true)
  expect(program.image === null || typeof program.image === 'string').toBe(true)
})
