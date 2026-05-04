import { execSync } from 'child_process'
import { pathToFileURL } from 'node:url'
import fs from 'fs-extra'

const ENV_VAR =
  'cross-env CURR_DATE=2022-10-04 ROOT_DIR=tests/__data__/output DATA_DIR=tests/__data__/output/'

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
  fs.copySync('tests/__data__/input/workers_load/workers.txt', 'tests/__data__/output/workers.txt')
})

describe('workers:load', () => {
  it('can create workers.json', () => {
    const cmd = `${ENV_VAR} npm run workers:load`

    const stdout = execSync(cmd, { encoding: 'utf8' })
    if (process.env.DEBUG === 'true') console.log(cmd, stdout)

    expect(content('tests/__data__/output/workers.json')).toEqual(
      content('tests/__data__/expected/workers_load/workers.json')
    )
  })
})

function content(filepath: string) {
  const data = fs.readFileSync(pathToFileURL(filepath), {
    encoding: 'utf8'
  })

  return JSON.stringify(data)
}
