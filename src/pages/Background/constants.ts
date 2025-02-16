import browser from 'webextension-polyfill';

export const CONTEXT_MENU_ITEM_ID = browser.runtime.id.concat(
  '/',
  'hme_generation_and_reservation'
);
