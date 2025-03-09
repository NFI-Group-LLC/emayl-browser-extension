// types.ts

export type Emaylias = {
  id: string;
  domain: string;
  forwardToEmail: string;
  email: string;
  isActive: boolean;
  label: string;
  note: string;
  createTimestamp: number;
  recipientMailId: string;
};

export type EmayliasListResult = {
  emayliasList: Emaylias[];
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

export interface IUser {
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
