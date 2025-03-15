import { faClipboard, faCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import { sendMessageToTab, MessageType } from '../../messages';

export const EmayliasCreatedToast = (props: { email: string; }) => {
  const onCopyToClipboardClick = async () => {
    await navigator.clipboard.writeText(props.email);
  };

  const onAutofillClick = async () => {
    await sendMessageToTab(MessageType.Autofill, props.email);
  };

  const btnClassName = 'focus:outline-none text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 block w-full';

  return (
    <div
      className="space-y-2 p-2 text-sm text-green-700 bg-green-100 rounded-lg"
      role="alert"
    >
      <p>
        <strong>{props.email}</strong> {chrome.i18n.getMessage("EmayliasCreated")}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          className={btnClassName}
          onClick={onCopyToClipboardClick}
        >
          <FontAwesomeIcon icon={faClipboard} className="mr-1" />
          {chrome.i18n.getMessage("CopyToClipboard")}
        </button>
        <button
          type="button"
          className={btnClassName}
          onClick={onAutofillClick}
        >
          <FontAwesomeIcon icon={faCheck} className="mr-1" />
          {chrome.i18n.getMessage("Autofill")}
        </button>
      </div>
    </div>
  );
};
