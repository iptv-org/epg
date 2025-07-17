const grab = process.env.SITE
  ? `npm run grab -- --site=${process.env.SITE} ${
      process.env.CLANG ? `--lang=${process.env.CLANG}` : ''
    } --output=public/guide.xml`
  : 'npm run grab -- --channels=channels.xml --output=public/guide.xml'

module.exports = {
  apps: [
    {
      name: 'serve',
      script: 'npx serve -- public',
      instances: 1,
      watch: false,
      autorestart: true
    },
    {
      name: 'grab',
      script: `npx chronos -e "${grab}" -p "${process.env.CRON_SCHEDULE}" -l`,
      instances: 1,
      watch: false,
      autorestart: true
    }
  ]
}
