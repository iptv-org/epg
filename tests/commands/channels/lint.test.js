const { execSync } = require('child_process')

it('will show a message if the file contains a syntax error', () => {
  try {
    const stdout = execSync(
      'npm run channels:lint -- tests/__data__/input/sites/lint.channels.xml',
      {
        encoding: 'utf8'
      }
    )
    console.log(stdout)
    process.exit(1)
  } catch (err) {
    expect(err.status).toBe(1)
    expect(err.stdout).toBe(
      `\n> channels:lint\n> node scripts/commands/channels/lint.js\n\n\ntests/__data__/input/sites/lint.channels.xml\n 4:0  Element 'channel': The attribute 'lang' is required but missing.\n\n1 error(s)\n`
    )
  }
})
