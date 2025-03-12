// types.ts

export type AttrDomain = {
  domain: string
};

export type EmayliasRecord = {
  attrDomains: AttrDomain[];
  comment: string;
  emaylias: string;
  forwardingAddress: string;
  label: string;
  lastModifiedDt: string;
  objectId: string;
  provisionDt: string;
  state: EmayliasState;
};

export enum EmayliasState {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DELETED = 'DELETED'
}

export enum EmayliasAction {
  ACTIVATE = 'activate', // set the state to ACTIVE; valid only for an emaylias currently in INACTIVE state
  INACTIVATE = 'inactivate', // set the state to INACTIVE; valid on for an emaylias currently in ACTIVE state
  DELETE = 'delete', // set the state to DELETED; valid on for an emaylias currently in INACTIVE state
  UNDELETE = 'undelete' // for an emaylias in DELETED state, sets the new state to INACTIVE
}

export interface IDomain {
  domain: string
}

export interface ChangeEmayliasRequest
{
  emaylias: string
  label: string
  attrDomains: IDomain[]
  comment?: string
  state?: EmayliasState
  forwardingEmailAddress: string
}

export type EmayliasListResult = {
  emayliasList: EmayliasRecord[];
  selectedForwardTo: string;
  forwardToEmails: string[];
};

interface MFAOptions {
  methodEnabled: boolean
  defaultMethod: boolean
}

export interface MFAConfig {
  emailMfa: MFAOptions
  smsMfa: MFAOptions
  totpMfa: MFAOptions
}

export interface UserProfile {
  emailAddress: string
  familyName: string
  givenName: string
  isoCountry: string
  mfaConfig: MFAConfig | null
  subscriberId: string
  wsUri: string
  forwardingAddresses: IForwardingAddress[] | null
  deleteOn: string | null
}

export interface ICookie {
  subscriberId: string
  emailAddress: string
  accessToken: string
  identityToken: string
  refreshToken: string
  wsUri: string
}

export enum ForwardingAddressState {
  PENDING_VALIDATION = "PENDING_VALIDATION",
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  DELETED = 'DELETED' // don't show in UI
}

export interface IForwardingAddress {
  forwardingAddressId: string
  emailAddress: string
  comment?: string
  state: ForwardingAddressState
}
