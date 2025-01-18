import { execSync } from 'child_process'
import os from 'os'

type ExecError = {
  status: number
  stdout: string
}

let ENV_VAR = 'DATA_DIR=tests/__data__/input/temp/data'
if (os.platform() === 'win32') {
  ENV_VAR = 'SET "DATA_DIR=tests/__data__/input/temp/data" &&'
}

describe('channels:validate', () => {
  it('will show a message if the file contains a duplicate', () => {
    try {
      const cmd = `${ENV_VAR} npm run channels:validate --- tests/__data__/input/channels-validate/duplicate.channels.xml`
      const stdout = execSync(cmd, { encoding: 'utf8' })
      if (process.env.DEBUG === 'true') console.log(cmd, stdout)
      process.exit(1)
    } catch (error) {
      expect((error as ExecError).status).toBe(1)
      expect((error as ExecError).stdout).toContain(`
┌─────────┬─────────────┬──────┬────────────────┬─────────┬─────────┐
│ (index) │ type        │ lang │ xmltv_id       │ site_id │ name    │
├─────────┼─────────────┼──────┼────────────────┼─────────┼─────────┤
│ 0       │ 'duplicate' │ 'en' │ 'BravoEast.us' │ '140'   │ 'Bravo' │
└─────────┴─────────────┴──────┴────────────────┴─────────┴─────────┘

1 error(s) in 1 file(s)
`)
    }
  })

  it('will show a message if the file contains a channel with wrong xmltv_id', () => {
    try {
      const cmd = `${ENV_VAR} npm run channels:validate --- tests/__data__/input/channels-validate/wrong_xmltv_id.channels.xml`
      const stdout = execSync(cmd, { encoding: 'utf8' })
      if (process.env.DEBUG === 'true') console.log(cmd, stdout)
      process.exit(1)
    } catch (error) {
      expect((error as ExecError).status).toBe(1)
      expect((error as ExecError).stdout).toContain(`
┌─────────┬──────────────────┬──────┬────────────────────┬─────────┬─────────────────────┐
│ (index) │ type             │ lang │ xmltv_id           │ site_id │ name                │
├─────────┼──────────────────┼──────┼────────────────────┼─────────┼─────────────────────┤
│ 0       │ 'wrong_xmltv_id' │ 'en' │ 'CNNInternational' │ '140'   │ 'CNN International' │
└─────────┴──────────────────┴──────┴────────────────────┴─────────┴─────────────────────┘

1 error(s) in 1 file(s)
`)
    }
  })
})
