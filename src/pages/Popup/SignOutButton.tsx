import { faSignOut } from '@fortawesome/free-solid-svg-icons';
import React from 'react';
import EmaylService from '../../eMaylService';
import { FooterButton } from './FooterButton';
import { TransitionCallback, performDeauthSideEffects } from './Popup';

export const SignOutButton = (props: {
  callback: TransitionCallback<'SIGN_OUT'>;
  emayliasService: EmaylService;
}) => {
  return (
    <FooterButton
      className="text-sky-400 hover:text-sky-500 focus:outline-sky-400"
      onClick={async () => {
        await props.emayliasService.signOut();
        performDeauthSideEffects();
        props.callback('SIGN_OUT');
      }}
      label={chrome.i18n.getMessage("SignoutButtonLabel")}
      icon={faSignOut} />
  );
};
