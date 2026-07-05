const CRON = process.env.CRON_SCHEDULE || '0 4 * * *'

const grabAll = process.env.SITES
  ? `bash scripts/grab-with-history.sh legacy --sites=${process.env.SITES} ${
      process.env.CLANG ? `--lang=${process.env.CLANG}` : ''
    } --output=public/guide.xml`
  : 'bash scripts/grab-with-history.sh legacy --channels=public/channels.xml --output=public/guide.xml'

const regions = [
  { name: 'th',  channels: 'channels-th.xml',  output: 'th/guide.xml' },
  { name: 'no',  channels: 'channels-no.xml',  output: 'no/guide.xml' },
  { name: 'uk',  channels: 'channels-uk.xml',  output: 'uk/guide.xml' },
  { name: 'sg',  channels: 'channels-sg.xml',  output: 'sg/guide.xml' },
  { name: 'us',  channels: 'channels-us.xml',  output: 'us/guide.xml'  }
]

// Builds all regional channel files then runs every regional grab in sequence.
// Used as the single startup job so channel files are guaranteed to exist
// before any grab starts.
const buildAndGrabAll = [
  'node scripts/build-channels.js',
  ...regions.map(({ name, channels, output }) =>
    `bash scripts/grab-with-history.sh ${name} --channels=public/${channels} --output=public/${output}`
  ),
  grabAll
].join(' && ')

const apps = [
  {
    name: 'serve',
    script: 'npx serve public -l 3002',
    instances: 1,
    watch: false,
    autorestart: true
  },
  {
    name: 'caddy',
    script: 'caddy',
    args: 'run --config Caddyfile --adapter caddyfile',
    instances: 1,
    watch: false,
    autorestart: true
  },
  {
    name: 'web',
    script: 'node_modules/next/dist/bin/next',
    args: 'start -p 3001',
    cwd: './web',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    autorestart: true
  },
  // Legacy combined grab (keeps public/guide.xml up to date for existing integrations)
  {
    name: 'grab',
    script: `npx chronos -e "${grabAll}" -p "${CRON}" -l`,
    instances: 1,
    watch: false,
    autorestart: true
  },
  // Per-region scheduled grabs
  ...regions.map(({ name, channels, output }) => ({
    name: `grab-${name}`,
    script: `npx chronos -e "bash scripts/grab-with-history.sh ${name} --channels=public/${channels} --output=public/${output}" -p "${CRON}" -l`,
    instances: 1,
    watch: false,
    autorestart: true
  }))
]

if (process.env.RUN_AT_STARTUP === 'true') {
  apps.push({
    name: 'grab-at-startup',
    script: 'bash',
    args: ['-c', buildAndGrabAll],
    instances: 1,
    autorestart: false,
    watch: false,
    max_restarts: 1
  })
}

module.exports = { apps }
