import React, { useState, useEffect } from 'react';
import './Options.css';
import { useBrowserStorageState } from '../../useBrowserStorageState';
import {
  Spinner,
  LoadingButton,
  ErrorMessage,
  TitledComponent,
} from '../../commonComponents';
import startCase from 'lodash.startcase';
import isEqual from 'lodash.isequal';
import { DEFAULT_STORE } from '../../storage';
import EmaylClient from '../../eMaylClient';
import { PremiumMailSettings } from '../../PremiumMailSettings';

const SelectFwdToForm = () => {
  const [selectedFwdToEmail, setSelectedFwdToEmail] = useState<string>();
  const [fwdToEmails, setFwdToEmails] = useState<string[]>();
  const [isFetching, setIsFetching] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [listHmeError, setListHmeError] = useState<string>();
  const [updateFwdToError, setUpdateFwdToError] = useState<string>();
  const [clientState, setClientState, isClientStateLoading] =
    useBrowserStorageState('clientState', undefined);

  useEffect(() => {
    const fetchHmeList = async () => {
      setListHmeError(undefined);
      setIsFetching(true);

      if (clientState?.setupUrl === undefined) {
        setListHmeError(chrome.i18n.getMessage("OptionsError_ForwardAddrLogin"));
        setIsFetching(false);
        return;
      }

      const client = new EmaylClient(clientState.setupUrl);
      const isClientAuthenticated = await client.isAuthenticated();
      if (!isClientAuthenticated) {
        setListHmeError(chrome.i18n.getMessage("OptionsError_ForwardAddrLogin"));
        setIsFetching(false);
        return;
      }

      try {
        const pms = new PremiumMailSettings(client);
        const result = await pms.getList();
        setFwdToEmails((prevState) =>
          isEqual(prevState, result.forwardToEmails)
            ? prevState
            : result.forwardToEmails
        );
        setSelectedFwdToEmail(result.selectedForwardTo);
      } catch (e) {
        setListHmeError(e.toString());
      } finally {
        setIsFetching(false);
      }
    };

    !isClientStateLoading && fetchHmeList();
  }, [setClientState, clientState?.setupUrl, isClientStateLoading]);

  const onSelectedFwdToSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setIsSubmitting(true);
    if (clientState === undefined) {
      // Entering this branch of the control flow should not be possible
      // as the client state is validated prior to rendering the form that
      // triggered this event handler.
      console.error('onSelectedFwdToSubmit: clientState is undefined');
      setUpdateFwdToError(chrome.i18n.getMessage("OptionsError_ForwardAddrLogin"));
    } else if (selectedFwdToEmail) {
      try {
        const client = new EmaylClient(
          clientState.setupUrl,
          clientState.webservices
        );
        const pms = new PremiumMailSettings(client);
        await pms.updateForwardTo(selectedFwdToEmail);
      } catch (e) {
        setUpdateFwdToError(e.toString());
      }
    } else {
      setUpdateFwdToError('No Forward To address has been selected.');
    }
    setIsSubmitting(false);
  };

  if (isFetching) {
    return <Spinner />;
  }

  if (listHmeError !== undefined) {
    return <ErrorMessage>{listHmeError}</ErrorMessage>;
  }

  return (
    <form className="space-y-3" onSubmit={onSelectedFwdToSubmit}>
      {fwdToEmails?.map((fwdToEmail, key) => (
        <div className="flex items-center mb-3" key={key}>
          <input
            onChange={() => setSelectedFwdToEmail(fwdToEmail)}
            checked={fwdToEmail === selectedFwdToEmail}
            id={`radio-${key}`}
            type="radio"
            disabled={isSubmitting}
            name={`fwdto-radio-${key}`}
            className="cursor-pointer w-4 h-4 accent-gray-900 hover:accent-gray-500"
          />
          <label
            htmlFor={`radio-${key}`}
            className="cursor-pointer ml-2 text-gray-900"
          >
            {fwdToEmail}
          </label>
        </div>
      ))}
      <LoadingButton loading={isSubmitting}>
        {chrome.i18n.getMessage("OptionsSettings_ForwardSave")}
      </LoadingButton>
      {updateFwdToError && <ErrorMessage>{updateFwdToError}</ErrorMessage>}
    </form>
  );
};

const AutofillForm = () => {
  const [options, setOptions] = useBrowserStorageState(
    'options',
    DEFAULT_STORE.options
  );

  return (
    <form className="space-y-3">
      {Object.entries(options.autofill).map(([key, value]) => (
        <div className="flex items-center mb-3" key={key}>
          <input
            onChange={() =>
              setOptions({
                ...options,
                autofill: { ...options.autofill, [key]: !value },
              })
            }
            checked={value}
            id={`checkbox-${key}`}
            type="checkbox"
            name={`checkbox-${key}`}
            className="cursor-pointer w-4 h-4 accent-gray-900 hover:accent-gray-500"
          />
          <label
            htmlFor={`checkbox-${key}`}
            className="cursor-pointer ml-2 text-gray-900"
          >
            {startCase(key)}
          </label>
        </div>
      ))}
    </form>
  );
};

const Options = () => {
  return (
    <div className="w-9/12 m-auto my-3">
      <TitledComponent
        title={chrome.i18n.getMessage("AppName")}
        subtitle={chrome.i18n.getMessage("OptionsSettingsSection")}
      >
        <div>
          <h3 className="font-bold text-lg mb-3">
            {chrome.i18n.getMessage("OptionsSettings_ForwardingToAddress")}
          </h3>
          <SelectFwdToForm />
        </div>
        <div>
          <h3 className="font-bold text-lg mb-3">
            {chrome.i18n.getMessage("OptionsSettings_Autofill")}
          </h3>
          <AutofillForm />
        </div>
      </TitledComponent>
    </div>
  );
};

export default Options;
