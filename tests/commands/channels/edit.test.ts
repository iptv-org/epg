import { execSync } from 'child_process'
import fs from 'fs-extra'

const ENV_VAR = 'cross-env DATA_DIR=tests/__data__/input/__data__'

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
  fs.copySync(
    'tests/__data__/input/channels_edit/example.com.channels.xml',
    'tests/__data__/output/channels.xml'
  )
})

describe('channels:edit', () => {
  it('shows list of options for a channel', () => {
    const cmd = `${ENV_VAR} npm run channels:edit --- tests/__data__/output/channels.xml`
    try {
      const stdout = execSync(cmd, { encoding: 'utf8' })
      if (process.env.DEBUG === 'true') console.log(cmd, stdout)
      checkStdout(stdout)
    } catch (error: unknown) {
      // NOTE: for Windows only
      if (process.env.DEBUG === 'true') console.log(cmd, error)
      if (error && typeof error === 'object' && 'stdout' in error) {
        checkStdout(error.stdout as string)
      }
    }
  })
})

function checkStdout(stdout: string) {
  expect(stdout).toContain('CNNInternational.us (CNN International, CNN, CNN Int)')
  expect(stdout).toContain('Type...')
  expect(stdout).toContain('Skip')
  expect(stdout).toContain("File 'tests/__data__/output/channels.xml' successfully saved")
}
