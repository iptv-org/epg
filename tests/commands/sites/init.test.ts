import { execSync } from 'child_process'
import fs from 'fs-extra'
import { pathToFileURL } from 'node:url'

const ENV_VAR = 'cross-env SITES_DIR=tests/__data__/output/sites'

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
  fs.mkdirSync('tests/__data__/output/sites')
})

it('can create new site config from template', () => {
  const cmd = `${ENV_VAR} npm run sites:init --- example.com`

  const stdout = execSync(cmd, { encoding: 'utf8' })
  if (process.env.DEBUG === 'true') console.log(cmd, stdout)

  expect(exists('tests/__data__/output/sites/example.com')).toBe(true)
  expect(exists('tests/__data__/output/sites/example.com/example.com.test.js')).toBe(true)
  expect(exists('tests/__data__/output/sites/example.com/example.com.config.js')).toBe(true)
  expect(exists('tests/__data__/output/sites/example.com/readme.md')).toBe(true)
  expect(content('tests/__data__/output/sites/example.com/example.com.test.js')).toEqual(
    content('tests/__data__/expected/sites_init/example.com.test.js')
  )
  expect(content('tests/__data__/output/sites/example.com/example.com.config.js')).toEqual(
    content('tests/__data__/expected/sites_init/example.com.config.js')
  )
  expect(content('tests/__data__/output/sites/example.com/readme.md')).toEqual(
    content('tests/__data__/expected/sites_init/readme.md')
  )
})

function content(filepath: string) {
  return fs.readFileSync(pathToFileURL(filepath), {
    encoding: 'utf8'
  })
}

function exists(filepath: string) {
  return fs.existsSync(pathToFileURL(filepath))
}
