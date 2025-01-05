import { execSync } from 'child_process'
import fs from 'fs-extra'
import path from 'path'
import os from 'os'

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
  fs.mkdirSync('tests/__data__/output/.sites')
  fs.copyFileSync(
    'tests/__data__/input/.sites/config.json',
    'tests/__data__/output/.sites/config.json'
  )
  fs.copyFileSync(
    'tests/__data__/input/.sites/template.md',
    'tests/__data__/output/.sites/template.md'
  )
})

it('can update SITES.md', () => {
  let ENV_VAR =
    'DOT_SITES_DIR=tests/__data__/output/.sites SITES_DIR=tests/__data__/input/sites-update/sites'
  if (os.platform() === 'win32') {
    ENV_VAR =
      'SET "DOT_SITES_DIR=tests/__data__/output/.sites" && SET "SITES_DIR=tests/__data__/input/sites-update/sites" &&'
  }

  const stdout = execSync(`${ENV_VAR} npm run sites:update`, { encoding: 'utf8' })
  if (process.env.DEBUG === 'true') console.log(stdout)

  expect(content('tests/__data__/output/sites.md')).toEqual(
    content('tests/__data__/expected/_sites.md')
  )

  expect(true).toBe(true)
})

function content(filepath: string) {
  const data = fs.readFileSync(path.resolve(filepath), {
    encoding: 'utf8'
  })

  return JSON.stringify(data)
}
