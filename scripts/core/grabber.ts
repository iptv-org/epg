import { EPGGrabber, GrabCallbackData, EPGGrabberMock, SiteConfig, Channel } from 'epg-grabber'
import { Logger, Collection } from '@freearhey/core'
import { Queue } from './'
import { GrabOptions } from '../commands/epg/grab'
import { TaskQueue, PromisyClass } from 'cwait'

type GrabberProps = {
  logger: Logger
  queue: Queue
  options: GrabOptions
}

export class Grabber {
  logger: Logger
  queue: Queue
  options: GrabOptions

  constructor({ logger, queue, options }: GrabberProps) {
    this.logger = logger
    this.queue = queue
    this.options = options
    this.grabber = process.env.NODE_ENV === 'test' ? new EPGGrabberMock() : new EPGGrabber()
  }

  async grab(): Promise<{ channels: Collection; programs: Collection }> {
    const taskQueue = new TaskQueue(Promise as PromisyClass, this.options.maxConnections)

    const total = this.queue.size()

    const channels = new Collection()
    let programs = new Collection()
    let i = 1

    await Promise.all(
      this.queue.items().map(
        taskQueue.wrap(
          async (queueItem: { channel: Channel; config: SiteConfig; date: string }) => {
            const { channel, config, date } = queueItem

            channels.add(channel)

            if (this.options.timeout !== undefined) {
              const timeout = parseInt(this.options.timeout)
              config.request = { ...config.request, ...{ timeout } }
            }

            if (this.options.delay !== undefined) {
              const delay = parseInt(this.options.delay)
              config.delay = delay
            }

            const _programs = await this.grabber.grab(
              channel,
              date,
              config,
              (data: GrabCallbackData, error: Error | null) => {
                const { programs, date } = data

                this.logger.info(
                  `  [${i}/${total}] ${channel.site} (${channel.lang}) - ${
                    channel.xmltv_id
                  } - ${date.format('MMM D, YYYY')} (${programs.length} programs)`
                )
                if (i < total) i++

                if (error) {
                  this.logger.info(`    ERR: ${error.message}`)
                }
              }
            )

            programs = programs.concat(new Collection(_programs))
          }
        )
      )
    )

    return { channels, programs }
  }
}
