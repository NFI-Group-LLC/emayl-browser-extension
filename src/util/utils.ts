import { IDomain } from "../types"

export function parseDomains(domains: string[]) : Array<IDomain> {
  return domains.map((domain) => {
    return {
      domain
    }
  })
}

export function formatDomains(domains: IDomain[]) : string[] {
  return domains.map(({ domain }) => domain)
}
