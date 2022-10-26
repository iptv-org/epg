const { execSync } = require('child_process')
const fs = require('fs-extra')
const path = require('path')

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')

  const stdout = execSync(
    'LOGS_DIR=tests/__data__/input/logs OUTPUT_DIR=tests/__data__/output/api npm run api:update',
    { encoding: 'utf8' }
  )
})

it('can generate guides.json', () => {
  expect(content('tests/__data__/output/api/guides.json')).toBe(
    content('tests/__data__/expected/api/guides.json')
  )
})

function content(filepath) {
  const data = fs.readFileSync(path.resolve(filepath), {
    encoding: 'utf8'
  })

  return JSON.stringify(data)
}
