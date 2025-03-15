// SignInInstructions.tsx

import { Link } from '@chakra-ui/react';
import React from 'react';
import { TitledComponent } from '../../commonComponents';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExternalLink, faQuestionCircle } from '@fortawesome/free-solid-svg-icons';

export const SignInInstructions = () => {
    const userguideUrl = chrome.runtime.getURL('userguide.html');

  return (
    <TitledComponent
      title={chrome.i18n.getMessage("SignInView_LogInButtonLabel")}
    >
      <div className="space-y-4">
        <div className="text-sm space-y-2">
          <p>
            {chrome.i18n.getMessage("SignInInstructions1")}
            {' '}
            <Link
              href="https://emayl.app"
              className="font-semibold"
              aria-label={chrome.i18n.getMessage("GoToLoginSite")}
            >
              emayl.app
            </Link>
            .
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <a
            href={userguideUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full justify-center text-white bg-sky-400 hover:bg-sky-500 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg px-5 py-2.5 text-center mr-2 inline-flex items-center"
            aria-label={chrome.i18n.getMessage("UserGuideHelpButton")}
          >
            <FontAwesomeIcon icon={faQuestionCircle} className="mr-1" />
            Help
          </a>
          <a
            href="https://emayl.app"
            target="_blank"
            rel="noreferrer"
            className="w-full justify-center text-white bg-sky-400 hover:bg-sky-500 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg px-5 py-2.5 text-center mr-2 inline-flex items-center"
            aria-label={chrome.i18n.getMessage("GoToLoginSite")}
          >
            <FontAwesomeIcon icon={faExternalLink} className="mr-1" />
            {chrome.i18n.getMessage("GoToWebApp")}
          </a>
        </div>
      </div>
    </TitledComponent>
  );
};