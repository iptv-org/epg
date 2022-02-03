const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

beforeEach(() => {
  fs.rmdirSync('tests/__data__/output', { recursive: true })
  fs.mkdirSync('tests/__data__/output')

  const stdout = execSync(
    'CHANNELS_PATH=tests/__data__/input/sites/*.channels.xml DATA_DIR=tests/__data__/input/data node scripts/commands/update-readme.js --config=tests/__data__/input/_readme.json',
    { encoding: 'utf8' }
  )
})

it('can update readme.md', () => {
  const output = content('tests/__data__/output/readme.md')
  const expected = content('tests/__data__/expected/readme.md')

  expect(output).toBe(expected)
})

function content(filepath) {
  const data = fs.readFileSync(path.resolve(filepath), {
    encoding: 'utf8'
  })

  return JSON.stringify(data)
}
