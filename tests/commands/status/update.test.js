const { execSync } = require('child_process')
const fs = require('fs-extra')
const path = require('path')

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')

  const stdout = execSync(
    'CONFIGS_PATH=tests/__data__/input/sites/example.com.config.js DATA_DIR=tests/__data__/input/data npm run status:update -- --config=tests/__data__/input/status.json',
    { encoding: 'utf8' }
  )
})

it('can update status.md', () => {
  expect(content('tests/__data__/output/status.md')).toBe(
    content('tests/__data__/expected/_status.md')
  )
})

function content(filepath) {
  const data = fs.readFileSync(path.resolve(filepath), {
    encoding: 'utf8'
  })

  return JSON.stringify(data)
}
