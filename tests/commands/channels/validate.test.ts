import { execSync } from 'child_process'

interface ExecError {
  status: number
  stdout: string
}

const ENV_VAR = 'cross-env DATA_DIR=tests/__data__/input/__data__'

describe('channels:validate', () => {
  it('will show a message if the file contains a duplicate', () => {
    try {
      const cmd = `${ENV_VAR} npm run channels:validate --- tests/__data__/input/channels_validate/duplicate.channels.xml`
      const stdout = execSync(cmd, { encoding: 'utf8' })
      if (process.env.DEBUG === 'true') console.log(cmd, stdout)
      process.exit(1)
    } catch (error) {
      expect((error as ExecError).status).toBe(1)
      expect((error as ExecError).stdout).toContain(`
┌─────────┬─────────────┬──────┬─────────────────┬─────────┬─────────┐
│ (index) │ type        │ lang │ xmltv_id        │ site_id │ name    │
├─────────┼─────────────┼──────┼─────────────────┼─────────┼─────────┤
│ 0       │ 'duplicate' │ 'en' │ 'Bravo.us@East' │ '140'   │ 'Bravo' │
└─────────┴─────────────┴──────┴─────────────────┴─────────┴─────────┘

1 problems (1 errors, 0 warnings) in 1 file(s)
`)
    }
  })

  it('will show a message if the file contains a channel with wrong channel id', () => {
    const cmd = `${ENV_VAR} npm run channels:validate --- tests/__data__/input/channels_validate/wrong_channel_id.channels.xml`
    const stdout = execSync(cmd, { encoding: 'utf8' })
    expect(stdout).toContain(`
┌─────────┬────────────────────┬──────┬────────────────────┬─────────┬─────────────────────┐
│ (index) │ type               │ lang │ xmltv_id           │ site_id │ name                │
├─────────┼────────────────────┼──────┼────────────────────┼─────────┼─────────────────────┤
│ 0       │ 'wrong_channel_id' │ 'en' │ 'CNNInternational' │ '140'   │ 'CNN International' │
└─────────┴────────────────────┴──────┴────────────────────┴─────────┴─────────────────────┘

1 problems (0 errors, 1 warnings) in 1 file(s)
`)
  })

  it('will show a message if the file contains a channel with wrong feed id', () => {
    const cmd = `${ENV_VAR} npm run channels:validate --- tests/__data__/input/channels_validate/wrong_feed_id.channels.xml`
    const stdout = execSync(cmd, { encoding: 'utf8' })
    expect(stdout).toContain(`
┌─────────┬─────────────────┬──────┬─────────────────┬─────────┬─────────┐
│ (index) │ type            │ lang │ xmltv_id        │ site_id │ name    │
├─────────┼─────────────────┼──────┼─────────────────┼─────────┼─────────┤
│ 0       │ 'wrong_feed_id' │ 'en' │ 'Bravo.us@West' │ '150'   │ 'Bravo' │
└─────────┴─────────────────┴──────┴─────────────────┴─────────┴─────────┘

1 problems (0 errors, 1 warnings) in 1 file(s)
`)
  })
})
