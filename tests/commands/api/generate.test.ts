import { execSync } from 'child_process'
import fs from 'fs-extra'
import { pathToFileURL } from 'node:url'

const ENV_VAR = 'cross-env SITES_DIR=tests/__data__/input/api_generate/sites API_DIR=tests/__data__/output'

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
})

describe('api:generate', () => {
  it('can generate guides.json', () => {
    const cmd = `${ENV_VAR} npm run api:generate`
    const stdout = execSync(cmd, { encoding: 'utf8' })
    if (process.env.DEBUG === 'true') console.log(cmd, stdout)

    expect(content('tests/__data__/output/guides.json')).toEqual(
      content('tests/__data__/expected/api_generate/guides.json')
    )
  })
})

function content(filepath: string) {
  return fs.readFileSync(pathToFileURL(filepath), {
    encoding: 'utf8'
  })
}
