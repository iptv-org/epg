import { execSync } from 'child_process'
import fs from 'fs-extra'
import { pathToFileURL } from 'node:url'

const ENV_VAR = 'cross-env SITES_DIR=tests/__data__/input/sites_update/sites ROOT_DIR=tests/__data__/output'

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
})

it('can update SITES.md', () => {
  const cmd = `${ENV_VAR} npm run sites:update`

  const stdout = execSync(cmd, { encoding: 'utf8' })
  if (process.env.DEBUG === 'true') console.log(cmd, stdout)

  expect(content('tests/__data__/output/SITES.md')).toEqual(
    content('tests/__data__/expected/sites_update/SITES.md')
  )
})

function content(filepath: string) {
  const data = fs.readFileSync(pathToFileURL(filepath), {
    encoding: 'utf8'
  })

  return JSON.stringify(data)
}
