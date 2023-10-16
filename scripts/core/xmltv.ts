import { DateTime, Collection } from '@freearhey/core'
import { generateXMLTV } from 'epg-grabber'

type XMLTVProps = {
  channels: Collection
  programs: Collection
  date: DateTime
}

export class XMLTV {
  channels: Collection
  programs: Collection
  date: DateTime

  constructor({ channels, programs, date }: XMLTVProps) {
    this.channels = channels
    this.programs = programs
    this.date = date
  }

  toString() {
    return generateXMLTV({
      channels: this.channels.all(),
      programs: this.programs.all(),
      date: this.date.toJSON()
    })
  }
}
