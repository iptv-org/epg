const { db, logger, api } = require('../../core')
const chalk = require('chalk')

async function main() {
    await api.channels.load()
    await api.guides.load()
    logger.info('loading database/programs.db...')
    await db.programs.load()
    let db_programs = await db.programs.find({})
    logger.info(`found ${db_programs.length} programs`)

    const stats = {
        files: 0,
        errors: 0
    }
    const errors = []
    let api_channels = await api.channels.all()

    api_channels.forEach(channel => {
        let programs = db_programs.filter(p => p.channel == channel.id)
        if (programs.length > 0) {
            if (!api.guides.find({ channel: channel.id })) {
                errors.push({ type: 'no_guide', xmltv_id: channel.id, ...channel })
                stats.errors++
            }
         }
    })

    if (errors.length) {
        console.table(errors, ['type', 'xmltv_id', 'name', 'country'])
        console.log()
        stats.files++
    }

    if (stats.errors > 0) {
        logger.error(chalk.red(`${stats.errors} error(s)`))
        process.exit(1)
    }
}

main()
