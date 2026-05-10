import { execSync } from 'child_process'
import fs from 'fs-extra'
import { pathToFileURL } from 'node:url'

const ENV_VAR =
  'cross-env SITES_DIR=tests/__data__/input/guides_export/sites API_DIR=tests/__data__/output'

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
})

describe('guides:export', () => {
  it('can generate guides.json', () => {
    const cmd = `${ENV_VAR} npm run guides:export`
    const stdout = execSync(cmd, { encoding: 'utf8' })
    if (process.env.DEBUG === 'true') console.log(cmd, stdout)

    expect(content('tests/__data__/output/guides.json')).toEqual(
      content('tests/__data__/expected/guides_export/guides.json')
    )
  })
})

function content(filepath: string) {
  return fs.readFileSync(pathToFileURL(filepath), {
    encoding: 'utf8'
  })
}
