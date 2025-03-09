import browser from 'webextension-polyfill';
import EmaylClient from './eMaylClient';
import { PopupState } from './pages/Popup/stateMachine';

export type Autofill = {
  button: boolean;
  contextMenu: boolean;
};

export type Options = {
  autofill: Autofill;
};

export type Store = {
  popupState: PopupState;
  options: Options;
  clientState?: {
    setupUrl: ConstructorParameters<typeof EmaylClient>[0];
    webservices: ConstructorParameters<typeof EmaylClient>[1];
  };
};

export const DEFAULT_STORE = {
  popupState: PopupState.SignedOut,
  options: {
    autofill: {
      button: true,
      contextMenu: true,
    },
  },
  clientState: undefined,
};

export async function getBrowserStorageValue<K extends keyof Store>(
  key: K
): Promise<Store[K] | undefined> {
  const store: Partial<Store> = await browser.storage.local.get(key);
  return store[key];
}

export async function setBrowserStorageValue<K extends keyof Store>(
  key: K,
  value: Store[K]
): Promise<void> {
  if (value === undefined) {
    await browser.storage.local.remove(key);
  } else {
    await browser.storage.local.set({ [key]: value });
  }
}
