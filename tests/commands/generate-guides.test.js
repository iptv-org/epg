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
