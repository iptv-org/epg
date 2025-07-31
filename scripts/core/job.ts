import { Logger } from '@freearhey/core'
import { Queue, Grabber, GuideManager } from '.'
import { GrabOptions } from '../commands/epg/grab'

interface JobProps {
  options: GrabOptions
  logger: Logger
  queue: Queue
}

export class Job {
  options: GrabOptions
  logger: Logger
  grabber: Grabber

  constructor({ queue, logger, options }: JobProps) {
    this.options = options
    this.logger = logger
    this.grabber = new Grabber({ logger, queue, options })
  }

  async run() {
    const { channels, programs } = await this.grabber.grab()

    const manager = new GuideManager({
      channels,
      programs,
      options: this.options,
      logger: this.logger
    })

    await manager.createGuides()
  }
}
