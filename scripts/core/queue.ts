import { Collection, Dictionary } from '@freearhey/core'
import { QueueItem } from '../types/queue'

export class Queue {
  #items: Dictionary<QueueItem> = new Dictionary<QueueItem>()

  add(key: string, data: QueueItem) {
    this.#items.set(key, data)
  }

  has(key: string): boolean {
    return this.#items.has(key)
  }

  getItems(): Collection<QueueItem> {
    return new Collection<QueueItem>(Object.values(this.#items.data()))
  }
}
