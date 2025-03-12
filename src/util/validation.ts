export const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

// Each element of a domain name separated by [.] is called a “label”
// there must be at least 2 labels in the domain

// make sure there are 2 or more labels
// The maximum length of each label is 63 characters.
// Don't allow consecutive period/dots
// A full domain name can have a maximum of 253 characters.
// Alphanumeric characters and hyphens can be used in labels, but a
// domain name must not commence or end with a hyphen.
const domainRegex = /^(?!-)(?!.*-$)(?!.*?\.\.)(?!.*?\.-)(?!.*-\.)[a-zA-Z0-9-]{1,63}(\.[a-zA-Z0-9-]{1,63}){1,253}$/

export enum DomainError {
    None = 'none',
    ConsecutiveDots = "DomainError_ConsecutiveDots",
    AlreadyInUse = 'DomainError_AlreadyInUse',
    InvalidChars = "DomainError_InvalidChars",
    MaxDomainLen = "DomainError_MaxDomainLength",
    MaxLabelLen = "DomainError_MaxLabelLength",
    MinLastLabelLength = "DomainError_MinLastLabelLength",
    NotEnoughSections = "DomainError_NotEnoughSections",
    StartOrEndWithDotOrDash = "DomainError_StartOrEndWithDotOrDash",
}
  
export const checkForDomainError = (domain: string): DomainError => {
    // Each element of a domain name separated by [.] is called a “label”
    // there must be at least 2 labels in the domain
    const split = domain.split(".")
    if (split.length < 2) {
        return DomainError.NotEnoughSections
    }

    // The maximum length of each label is 63 characters.
    for (const lab of split) {
        if (lab.length > 63) {
            return DomainError.MaxLabelLen
        }
    }
    
    // Don't allow consecutive period/dots
    if (domain.includes("..")) {
        return DomainError.ConsecutiveDots
    }

    // A full domain name can have a maximum of 253 characters.
    if (domain.length > 253) {
        return DomainError.MaxDomainLen
    }

    const lastCh = domain[domain.length - 1]
    if (domain[0] == "." || domain[0] == "-" || lastCh == "." || lastCh == "-") {
        return DomainError.StartOrEndWithDotOrDash
    }
    
    // last label minimum size
    const lastLabelLen = split[split.length-1].length
    if (lastLabelLen < 2) {
        return DomainError.MinLastLabelLength
    }

    if (!domainRegex.test(domain)) {
        return DomainError.InvalidChars
    }

    return DomainError.None
}