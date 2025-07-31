import { Dictionary } from '@freearhey/core'
import { OWNER, REPO } from '../constants'

interface IssueProps {
  number: number
  labels: string[]
  data: Dictionary
}

export class Issue {
  number: number
  labels: string[]
  data: Dictionary

  constructor({ number, labels, data }: IssueProps) {
    this.number = number
    this.labels = labels
    this.data = data
  }

  getURL() {
    return `https://github.com/${OWNER}/${REPO}/issues/${this.number}`
  }
}
