import { EPGGrabber, GrabCallbackData, EPGGrabberMock, SiteConfig, Channel } from 'epg-grabber'
import { Logger, Collection } from '@freearhey/core'
import { Queue, ProxyParser } from './'
import { GrabOptions } from '../commands/epg/grab'
import { TaskQueue, PromisyClass } from 'cwait'
import { SocksProxyAgent } from 'socks-proxy-agent'

type GrabberProps = {
  logger: Logger
  queue: Queue
  options: GrabOptions
}

export class Grabber {
  logger: Logger
  queue: Queue
  options: GrabOptions
  grabber: EPGGrabber | EPGGrabberMock

  constructor({ logger, queue, options }: GrabberProps) {
    this.logger = logger
    this.queue = queue
    this.options = options
    this.grabber = process.env.NODE_ENV === 'test' ? new EPGGrabberMock() : new EPGGrabber()
  }

  async grab(): Promise<{ channels: Collection; programs: Collection }> {
    const proxyParser = new ProxyParser()
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

            if (this.options.proxy !== undefined) {
              const proxy = proxyParser.parse(this.options.proxy)

              if (
                proxy.protocol &&
                ['socks', 'socks5', 'socks5h', 'socks4', 'socks4a'].includes(String(proxy.protocol))
              ) {
                const socksProxyAgent = new SocksProxyAgent(this.options.proxy)

                config.request = {
                  ...config.request,
                  ...{ httpAgent: socksProxyAgent, httpsAgent: socksProxyAgent }
                }
              } else {
                config.request = { ...config.request, ...{ proxy } }
              }
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
