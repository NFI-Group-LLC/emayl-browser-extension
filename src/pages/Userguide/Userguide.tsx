import React, { InputHTMLAttributes, useState } from 'react';
import { TitledComponent, Link } from '../../commonComponents';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  // faInfoCircle,
  faCheckCircle,
  // faWarning,
} from '@fortawesome/free-solid-svg-icons';
// import { isFirefox } from '../../browserUtils';

// const Notice = (props: {
//   title: string;
//   children: React.ReactNode;
//   isAlert?: boolean;
// }) => {
//   const { title, children, isAlert = false } = props;

//   const colourPalette = isAlert
//     ? 'bg-yellow-50 border-yellow-400 text-yellow-600'
//     : 'text-gray-600 bg-gray-50';

//   return (
//     <div
//       className={`flex p-3 text-sm border rounded-lg ${colourPalette}`}
//       role={isAlert ? 'alert' : 'info'}
//     >
//       <FontAwesomeIcon
//         icon={isAlert ? faWarning : faInfoCircle}
//         className="mr-2 mt-1"
//       />
//       <span className="sr-only">Info</span>
//       <div className="space-y-1">
//         <p className="font-semibold">{title}</p>
//         {children}
//       </div>
//     </div>
//   );
// };

const SignInInstructions = () => {
  return (
    <div className="space-y-4">
      <div>
        <p>
          To setup this extension, you need to sign in to your eMayl account.
        </p>
        <p className='mt-4'>
          Once you&apos;re signed-in to your account you&apos;re set to go. Open
          the extension pop-up (
          <img
            src="https://emayl.app/_next/image?url=%2Femayl-logo.png&w=16&q=75"
            alt={chrome.i18n.getMessage("AppNameLogoAria")}
            className="inline-block mr-2"
          />
          icon) to generate a new{' '}
          <span className="font-semibold">
            {chrome.i18n.getMessage("Emaylias")}
          </span>.
        </p>
      </div>
    </div>
  );
};

const AutofillableDemoInput = (props: {
  inputAttributes: InputHTMLAttributes<HTMLInputElement>;
  label: string;
}) => {
  const [autofillableInputValue, setAutoFillableInputValue] =
    useState<string>();

  return (
    <div className="space-y-2">
      <label
        htmlFor={props.inputAttributes.id}
        className="block font-semibold text-gray-600"
      >
        {props.label}{' '}
        {autofillableInputValue?.endsWith('@icloud.com') && (
          <FontAwesomeIcon
            icon={faCheckCircle}
            className="ml-1 mt-1 text-green-500"
          />
        )}
      </label>
      <input
        className="block w-full rounded-md relative px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-sky-400 focus:border-sky-400 focus:z-10 sm:text-sm"
        defaultValue={autofillableInputValue}
        onInput={(e) =>
          setAutoFillableInputValue((e.target as HTMLInputElement).value)
        }
        {...props.inputAttributes}
      />
    </div>
  );
};

const UsageInstructions = () => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p>
          In the extension pop-up (
          <img
            src="https://emayl.app/_next/image?url=%2Femayl-logo.png&w=16&q=75"
            alt={chrome.i18n.getMessage("AppNameLogoAria")}
            className="inline-block mr-2"
          />
          icon) you can find a
          MacOS-System-Settings-like UI that enables you to generate new
          eMaylias and manage existing ones.
        </p>
        <p>
          <span className="font-semibold">
            In most cases though, you don&apos;t need to interact with the
            pop-up UI
          </span>
          . The extension will automatically detect email input fields and
          prompt you to autofill new addresses! Alternatively, you can
          right-click on any text input field and select the menu item of the
          extension.
        </p>
      </div>
      <div className="space-y-2">
        <p>Try it yourself:</p>
        <div className="w-full max-w-md p-3 border rounded-lg bg-gray-50">
          <form className="space-y-2">
            <AutofillableDemoInput
              label="Autofill via button"
              inputAttributes={{
                id: 'autofill-by-button',
                name: 'email',
                type: 'email',
                placeholder: 'Click (focus) on this field',
              }}
            />
            <AutofillableDemoInput
              label="Autofill via right-click context menu"
              inputAttributes={{
                id: 'autofill-by-right-click',
                type: 'text',
                placeholder:
                  'Right click on this field and select the menu item of the extension',
              }}
            />
          </form>
        </div>
      </div>
      <div>
        If you find the autofill-via-button feature intrusive, you can disable
        it in the <Link href="./options.html">extension Options</Link>.
      </div>
      <div>
        Don&apos;t forget to delete the eMaylias you created above
        for the purposes of trying this out:
        <ol className="list-decimal list-inside">
          <li>Open the extension pop-up (
            <img
              src="https://emayl.app/_next/image?url=%2Femayl-logo.png&w=16&q=75"
              alt={chrome.i18n.getMessage("AppNameLogoAria")}
              className="inline-block mr-2"
            />
            icon)
          </li>
          <li>Navigate to the &quot;Manage emails&quot; view</li>
          <li>Select, deactivate, and delete the relevant addresses</li>
        </ol>
      </div>
    </div>
  );
};

const Userguide = () => {
  return (
    <div className="w-9/12 m-auto mt-3 mb-24">
      <TitledComponent
        title={chrome.i18n.getMessage("AppName")}
        subtitle={chrome.i18n.getMessage("HelpSubtitle")}
      >
        <div>
          <h3 className="font-bold text-lg mb-3">
            {chrome.i18n.getMessage("HelpSignInHeader")}
          </h3>
          <SignInInstructions />
        </div>
        <div>
          <h3 className="font-bold text-lg mb-3">How to use?</h3>
          <UsageInstructions />
        </div>
      </TitledComponent>
    </div>
  );
};

export default Userguide;
