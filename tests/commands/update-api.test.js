const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

beforeEach(() => {
  fs.rmdirSync('tests/__data__/output', { recursive: true })
  fs.mkdirSync('tests/__data__/output')

  const stdout = execSync(
    'CHANNELS_PATH=tests/__data__/input/sites/**.channels.xml OUTPUT_DIR=tests/__data__/output/api node scripts/commands/update-api.js',
    { encoding: 'utf8' }
  )
})

it('can generate guides.json', () => {
  const output = content('tests/__data__/output/api/guides.json')
  const expected = content('tests/__data__/expected/api/guides.json')

  expect(output).toBe(expected)
})

function content(filepath) {
  const data = fs.readFileSync(path.resolve(filepath), {
    encoding: 'utf8'
  })

  return JSON.stringify(data)
}
