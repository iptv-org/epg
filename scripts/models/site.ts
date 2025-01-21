import { Collection } from '@freearhey/core'
import { Issue } from './'

enum StatusCode {
  DOWN = 'down',
  WARNING = 'warning',
  OK = 'ok'
}

type Status = {
  code: StatusCode
  emoji: string
}

type SiteProps = {
  domain: string
  totalChannels?: number
  markedChannels?: number
  issues: Collection
}

export class Site {
  domain: string
  totalChannels: number
  markedChannels: number
  issues: Collection

  constructor({ domain, totalChannels = 0, markedChannels = 0, issues }: SiteProps) {
    this.domain = domain
    this.totalChannels = totalChannels
    this.markedChannels = markedChannels
    this.issues = issues
  }

  getStatus(): Status {
    const issuesWithStatusDown = this.issues.filter((issue: Issue) =>
      issue.labels.find(label => label === 'status:down')
    )
    if (issuesWithStatusDown.notEmpty())
      return {
        code: StatusCode.DOWN,
        emoji: '🔴'
      }

    const issuesWithStatusWarning = this.issues.filter((issue: Issue) =>
      issue.labels.find(label => label === 'status:warning')
    )
    if (issuesWithStatusWarning.notEmpty())
      return {
        code: StatusCode.WARNING,
        emoji: '🟡'
      }

    return {
      code: StatusCode.OK,
      emoji: '🟢'
    }
  }

  getIssues(): Collection {
    return this.issues.map((issue: Issue) => issue.getURL())
  }
}
