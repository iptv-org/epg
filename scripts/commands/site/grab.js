const { spawn } = require('child_process')
const { program } = require('commander')

program.argument('<site>', 'Name of the site to grab').parse(process.argv)

const site = program.args[0]

const command = spawn(
  'npx',
  [
    'epg-grabber',
    `--config=sites/${site}/${site}.config.js`,
    `--channels=sites/${site}/${site}*.channels.xml`,
    `--output=guides/{lang}/{site}.xml`
  ],
  { shell: process.platform == 'win32' }
)

command.stdout.on('data', data => {
  process.stdout.write(`${data}`)
})

command.stderr.on('data', data => {
  process.stdout.write(`${data}`)
})

command.on('error', error => {
  console.log(`error: ${error.message}`)
})
