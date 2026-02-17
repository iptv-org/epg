import { Collection } from '@freearhey/core'
import { Issue } from './'

enum StatusCode {
  DOWN = 'down',
  WARNING = 'warning',
  OK = 'ok'
}

export interface Status {
  code: StatusCode
  emoji: string
}

export interface SiteData {
  domain: string
  totalChannels?: number
  markedChannels?: number
  issues: Collection<Issue>
}

export class Site {
  domain: string
  totalChannels: number
  markedChannels: number
  issues: Collection<Issue>

  constructor(data: SiteData) {
    this.domain = data.domain
    this.totalChannels = data.totalChannels || 0
    this.markedChannels = data.markedChannels || 0
    this.issues = data.issues
  }

  getStatus(): Status {
    const issuesWithStatusDown = this.issues.filter((issue: Issue) =>
      issue.labels.find(label => label === 'status:down')
    )
    if (issuesWithStatusDown.isNotEmpty())
      return {
        code: StatusCode.DOWN,
        emoji: '🔴'
      }

    const issuesWithStatusWarning = this.issues.filter((issue: Issue) =>
      issue.labels.find(label => label === 'status:warning')
    )
    if (issuesWithStatusWarning.isNotEmpty())
      return {
        code: StatusCode.WARNING,
        emoji: '🟡'
      }

    return {
      code: StatusCode.OK,
      emoji: '🟢'
    }
  }

  getIssueUrls(): Collection<string> {
    return this.issues.map((issue: Issue) => issue.getURL())
  }
}
