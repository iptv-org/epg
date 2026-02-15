import { execSync } from 'child_process'
import { pathToFileURL } from 'node:url'
import fs from 'fs-extra'

const ENV_VAR = 'cross-env ROOT_DIR=tests/__data__/output'

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
  fs.copySync('tests/__data__/input/guides_update/workers.txt', 'tests/__data__/output/workers.txt')
})

it('can update GUIDES.md', () => {
  const cmd = `${ENV_VAR} npm run guides:update`

  const stdout = execSync(cmd, { encoding: 'utf8' })
  if (process.env.DEBUG === 'true') console.log(cmd, stdout)

  expect(content('tests/__data__/output/GUIDES.md')).toEqual(
    content('tests/__data__/expected/guides_update/GUIDES.md')
  )
})

function content(filepath: string) {
  const data = fs.readFileSync(pathToFileURL(filepath), {
    encoding: 'utf8'
  })

  return JSON.stringify(data)
}
