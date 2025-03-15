import { faClipboard, faCheck, faBan, faRefresh, faTrashAlt } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useState, useEffect } from 'react';
import { ErrorMessage, LoadingButton } from '../../commonComponents';
import EmaylService from '../../eMaylService';
import { sendMessageToTab, MessageType } from '../../messages';
import { EmayliasRecord, EmayliasState, EmayliasAction } from '../../types';
import { emaylService } from './Popup';

export const AliasEntryDetails = (props: {
  emaylias: EmayliasRecord;
  emayliasService: EmaylService;
  activationCallback: () => void;
  deletionCallback: () => void;
}) => {
  const [isActivateSubmitting, setIsActivateSubmitting] = useState(false);
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);

  const [error, setError] = useState<string>();

  // Reset the error and the loaders when a new HME prop is passed to this component
  useEffect(() => {
    setError(undefined);
    setIsActivateSubmitting(false);
    setIsDeleteSubmitting(false);
  }, [props.emaylias]);

  const onActivationClick = async () => {
    setIsActivateSubmitting(true);
    try {
      if (props.emaylias.state == EmayliasState.ACTIVE) {
        await emaylService.changeEmayliasState(props.emaylias.objectId, EmayliasAction.INACTIVATE);
      } else {
        await emaylService.changeEmayliasState(props.emaylias.objectId, EmayliasAction.ACTIVATE);
      }
      props.activationCallback();
    } catch (e) {
      setError(e.toString());
    } finally {
      setIsActivateSubmitting(false);
    }
  };

  const onDeletionClick = async () => {
    setIsDeleteSubmitting(true);
    try {
      await emaylService.changeEmayliasState(props.emaylias.objectId, EmayliasAction.DELETE);
      props.deletionCallback();
    } catch (e) {
      setError(e.toString());
    } finally {
      setIsDeleteSubmitting(false);
    }
  };

  const onCopyClick = async () => {
    await navigator.clipboard.writeText(props.emaylias.emaylias);
  };

  const onAutofillClick = async () => {
    await sendMessageToTab(MessageType.Autofill, props.emaylias.emaylias);
  };

  const btnClassName = 'w-full justify-center text-white focus:ring-4 focus:outline-none font-medium rounded-lg px-2 py-3 text-center inline-flex items-center';
  const labelClassName = 'font-semibold text-sm';
  let valueClassName = 'text-sm break-words ';
  if (props.emaylias.state == EmayliasState.ACTIVE) {
    valueClassName += 'text-black';
  } else {
    valueClassName += 'text-gray-300';
  }

  return (
    <div className="space-y-2">
      <div>
        <p className={labelClassName}>{chrome.i18n.getMessage("Emaylias")}</p>
        <p title={props.emaylias.emaylias} className={valueClassName}>
          {props.emaylias.emaylias}
        </p>
      </div>
      <div>
        <p className={labelClassName}>{chrome.i18n.getMessage("Label")}</p>
        <p title={props.emaylias.label} className={valueClassName}>
          {props.emaylias.label}
        </p>
      </div>
      <div>
        <p className={labelClassName}>{chrome.i18n.getMessage("ForwardingTo")}</p>
        <p title={props.emaylias.forwardingAddress} className={valueClassName}>
          {props.emaylias.forwardingAddress}
        </p>
      </div>
      <div>
        <p className={labelClassName}>{chrome.i18n.getMessage("CreatedAt")}</p>
        <p className={valueClassName}>
          {new Date(props.emaylias.provisionDt?.replace(/Z$/, '') as string).toLocaleString()}
        </p>
      </div>
      <div>
        <p className={labelClassName}>{chrome.i18n.getMessage("LastModifiedAt")}</p>
        <p className={valueClassName}>
          {new Date(props.emaylias.lastModifiedDt?.replace(/Z$/, '') as string).toLocaleString()}
        </p>
      </div>
      {props.emaylias.comment && (
        <div>
          <p className={labelClassName}>{chrome.i18n.getMessage("NotesLabel")}</p>
          <p title={props.emaylias.comment} className={valueClassName}>
            {props.emaylias.comment}
          </p>
        </div>
      )}
      {error && <ErrorMessage>{error}</ErrorMessage>}
      <div className="grid grid-cols-3 gap-2">
        <button
          title={chrome.i18n.getMessage("CopyEmail")}
          className={`${btnClassName} bg-sky-400 hover:bg-sky-500 focus:ring-blue-300`}
          onClick={onCopyClick}
        >
          <FontAwesomeIcon icon={faClipboard} />
        </button>
        <button
          title={chrome.i18n.getMessage("Autofill")}
          className={`${btnClassName} bg-sky-400 hover:bg-sky-500 focus:ring-blue-300`}
          onClick={onAutofillClick}
        >
          <FontAwesomeIcon icon={faCheck} />
        </button>
        <LoadingButton
          title={(props.emaylias.state == EmayliasState.ACTIVE) ? chrome.i18n.getMessage("Deactivate") : chrome.i18n.getMessage("Reactivate")}
          className={`${btnClassName} ${(props.emaylias.state == EmayliasState.ACTIVE)
              ? 'bg-red-500 hover:bg-red-600 focus:ring-red-300'
              : 'bg-sky-400 hover:bg-sky-500 focus:ring-blue-300'}`}
          onClick={onActivationClick}
          loading={isActivateSubmitting}
        >
          <FontAwesomeIcon icon={props.emaylias.state == EmayliasState.ACTIVE ? faBan : faRefresh} />
        </LoadingButton>
        {(props.emaylias.state == EmayliasState.INACTIVE) && (
          <LoadingButton
            title={chrome.i18n.getMessage("Delete")}
            className={`${btnClassName} bg-red-500 hover:bg-red-600 focus:ring-red-300 col-span-3`}
            onClick={onDeletionClick}
            loading={isDeleteSubmitting}
          >
            <FontAwesomeIcon icon={faTrashAlt} className="mr-1" />
            {chrome.i18n.getMessage("Delete")}
          </LoadingButton>
        )}
      </div>
    </div>
  );
};
