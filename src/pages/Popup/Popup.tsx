import React, {
  useState,
  Dispatch,
  useEffect,
  ButtonHTMLAttributes,
  DetailedHTMLProps,
  ReactNode,
  ReactElement,
} from 'react';
import { ChakraProvider, extendTheme, FormControl, FormErrorMessage, FormLabel, Input } from '@chakra-ui/react';
import './Popup.css';
import { useBrowserStorageState } from '../../useBrowserStorageState';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faRefresh,
  faClipboard,
  faCheck,
  faList,
  faSignOut,
  IconDefinition,
  faPlus,
  faTrashAlt,
  faBan,
  faSearch,
  faExternalLink,
  faQuestionCircle,
} from '@fortawesome/free-solid-svg-icons';
// import { faFirefoxBrowser } from '@fortawesome/free-brands-svg-icons';
import { MessageType, sendMessageToTab } from '../../messages';
import {
  ErrorMessage,
  LoadingButton,
  Spinner,
  TitledComponent,
  Link,
} from '../../commonComponents';

import browser from 'webextension-polyfill';
import Fuse from 'fuse.js';
import isEqual from 'lodash.isequal';
import {
  PopupAction,
  PopupState,
  AuthenticatedAction,
  STATE_MACHINE_TRANSITIONS,
  AuthenticatedAndManagingAction,
} from './stateMachine';
import { EmayliasRecord, EmayliasAction, EmayliasState, UserProfile, ChangeEmayliasRequest } from '../../types';
import EmaylService from '../../eMaylService';
import DomainFavIconTag from '../../DomainFavIconTag';
import { checkForDomainError, DomainError } from '../../util/validation';
import { parseDomains } from '../../util/utils';
// import { isFirefox } from '../../browserUtils';

type TransitionCallback<T extends PopupAction> = (action: T) => void;

const theme = extendTheme({
  colors: {
    primary: {
      50: "#f7fff8",
      100: "#f3fff4",
      200: "#eefff0",
      300: "#e9ffeb",
      400: "#e5ffe7",
      500: "#e0ffe3",
      600: "#bed9c1",
      700: "#9db29f",
      800: "#7b8c7d",
      900: "#5a665b",
    }
  }
});

const emaylService = new EmaylService();
let userProfile: UserProfile | null = null;

const SignInInstructions = () => {
  const userguideUrl = browser.runtime.getURL('userguide.html');

  return (
    <TitledComponent
      title={chrome.i18n.getMessage("AppName")}
      subtitle={chrome.i18n.getMessage("SignInView_LogInButtonLabel")}
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
            {chrome.i18n.getMessage("GoToLoginButton")}
          </a>
        </div>
      </div>
    </TitledComponent>
  );
};

const ReservationResult = (props: { email: string }) => {
  const onCopyToClipboardClick = async () => {
    await navigator.clipboard.writeText(props.email);
  };

  const onAutofillClick = async () => {
    await sendMessageToTab(MessageType.Autofill, props.email);
  };

  const btnClassName =
    'focus:outline-none text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 block w-full';

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

const FooterButton = (
  props: { label: string; icon: IconDefinition } & DetailedHTMLProps<
    ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  >
) => {
  return (
    <button
      className="text-sky-400 hover:text-sky-500 focus:outline-sky-400"
      {...props}
    >
      <FontAwesomeIcon icon={props.icon} className="mr-1" />
      {props.label}
    </button>
  );
};

async function performDeauthSideEffects(): Promise<void> {
  // await browser.contextMenus
  //   .update(CONTEXT_MENU_ITEM_ID, {
  //     title: chrome.i18n.getMessage("SignedOut_SignInInstructions"),
  //     enabled: false,
  //   })
  //   .catch(console.debug);
}

const SignOutButton = (props: {
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
      icon={faSignOut}
    />
  );
};

const EmayliasEditComponent = (props: {
  callback: TransitionCallback<AuthenticatedAction>;
  emayliasService: EmaylService;
}) => {
  const [emails, setEmails] = useState<string[] | null>(null);
  const [emayliasError, setEmayliasError] = useState<string>();

  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);

  const [isRetrievingEmails, setIsRetrievingEmails] = useState<boolean>();
  const [isUseSubmitting, setIsUseSubmitting] = useState(false);
  const [tabHost, setTabHost] = useState('');
  const [fwdToEmail, setFwdToEmail] = useState<string>();
  const [savedEmaylias, setSavedEmaylias] = useState<EmayliasRecord | null>(null)

  const [note, setNote] = useState<string>();
  const [label, setLabel] = useState<string>("");
  const [labelError, setLabelError] = useState<string | null>(null)

  const [domains, setDomains] = useState<string[]>([])
  const [domain, setDomain] = useState<string>("")
  const [domainError, setDomainError] = useState<DomainError>(DomainError.None)

  // useEffect(() => {
  //   const fetchData = async () => {
  //     setHmeError(undefined);
  //     try {
  //       const result = await emaylService.getList();
  //       console.log(`fetchList returned ${result.length} emaylias`)
  //       // setFwdToEmail(result.selectedForwardTo);

  //       userProfile = await emaylService.getProfile()
  //       console.log("userProfile = ", userProfile)

  //     } catch (e) {
  //       setHmeError(e.toString());
  //     }
  //   };

  //   fetchData();
  // }, [props.emayliasService]);

  useEffect(() => {
    const fetchEmails = async () => {
      setEmayliasError(undefined);
      setIsRetrievingEmails(true);
      try {
        const generatedEmails = await emaylService.generateEmails();
        setEmails(generatedEmails);
        setSelectedEmail(generatedEmails[0])

        if (!userProfile) {
          userProfile = await emaylService.getProfile()
        }
        setFwdToEmail(userProfile.emailAddress)
      } catch (e) {
        setEmayliasError(e.toString());
      } finally {
        setIsRetrievingEmails(false);
      }
    };

    fetchEmails();
  }, [props.emayliasService]);

  useEffect(() => {
    const getTabHost = async () => {
      const [tab] = await browser.tabs.query({
        active: true,
        lastFocusedWindow: true,
      });
      const tabUrl = tab?.url;
      if (tabUrl !== undefined) {
        const { hostname } = new URL(tabUrl);
        setTabHost(hostname);
        setLabel(tab.title ?? hostname);
        setDomains([hostname])
      }
    };

    getTabHost().catch(console.error);
  }, []);

  const onEmailRefreshClick = async () => {
    // cycle through the retrieved emails
    if (emails?.length && selectedEmail) {
      const index = emails.indexOf(selectedEmail)
      const email = emails[ index < emails.length - 1 ? index + 1 : 0]
      setSelectedEmail(email)
    }
  };

  const onUseSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsUseSubmitting(true);

    const domErr: DomainError = validateDomain(domain, domains);
    const isLabelErr: boolean = (label.length <= 3)

    if (emails?.length) {
      // validate label
      if (isLabelErr) {
        setLabelError(chrome.i18n.getMessage("LabelValidationMinLength"));
      } else {
        setLabelError(null)
      }

      // validate domains
      if (domain.length && domErr != DomainError.None) {
        setDomainError(domErr)
      } else {
        setDomainError(DomainError.None)
      }

      if (!isLabelErr && (!domain.length || domErr == DomainError.None) && selectedEmail && userProfile) {
        try {
          const changeRecord: ChangeEmayliasRequest = { 
            emaylias: selectedEmail,
            label,
            comment: note,
            forwardingEmailAddress: userProfile.emailAddress,
            attrDomains: parseDomains(domains),
            state: EmayliasState.ACTIVE
          }
      
          // create a new emaylias
          const emayliasSaved = await emaylService.createEmaylias(changeRecord);
          console.log("emaylias created:", emayliasSaved)
          setSavedEmaylias(emayliasSaved)

          // copy the new email address to the clipboard
          if (typeof window !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(emayliasSaved.emaylias)
          }

          // on success, clear label, domain and notes
          setLabel("");
          setDomain("")
          setDomains([])
          setNote("")

          // toast({
          //   description: i18n.t("EmayliasModalView_SuccessNew", { label: values.label }),
          //   status: 'success'
          // })

          // // give the list a chance to add the new record before setting the record to scroll to
          // setTimeout(() => setEmayliasRecord(createResponse), 500)
        } catch (e) {
          console.log("error trying to create eMaylias:", e.toString())
        }    
      }
    }
    setIsUseSubmitting(false);
  };

  const isReservationFormDisabled = isRetrievingEmails || !emails || !emails.length;

  const reservationFormInputClassName =
    'appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:border-sky-400 focus:z-10 sm:text-sm';

  const hostFromDomainTag = (tag: string): string => {
    let host = tag
    try {
      const url = new URL(tag)
      host = url.hostname
    } catch {
      // if not parsed, check for and remove ending slash
      host = tag.endsWith('/') ? tag.substring(0, tag.length - 1) : tag
    }

    // check for and remove starting "www."
    host = host.startsWith("www.") ? host.substring(4) : host

    // convert to lowercase
    return host.toLocaleLowerCase()
  }
  
  const validateDomain = (tag: string, tags: string[]): DomainError => {
    const host = hostFromDomainTag(tag)
    return tags.includes(host) ? DomainError.AlreadyInUse : checkForDomainError(host)
  }
  
  const handleAddDomain = (domain: string) => {
    const host = hostFromDomainTag(domain)
    const domErr = validateDomain(host, domains)
    setDomainError(domErr)
    if (domErr == DomainError.None) {
      setDomains([...domains, host])
      setDomain("");
    }
  }

  const renderDomains = (): ReactNode => {
    return (
      <div className="border-slate-200 rounded-lg border p-1 pr-4">
        <FormLabel
          fontSize='xs'
          fontWeight="semibold"
          color="gray.600"
          backgroundColor='white'
          ml="2"
          mt="-3"
          px="1.5"
          position="absolute"
          zIndex='overlay'
        >
          {chrome.i18n.getMessage("DomainsLabel")}
        </FormLabel>
        <div className='mt-2'>
        {domains.map((domain: string) => {
          return <DomainFavIconTag
            key={domain}
            domain={domain}
            emaylService={emaylService}
            searchText={null}
            showBackground
            onDelete={() => setDomains(domains.filter((dom: string) => dom != domain))}
            imageOnly={false}
          />
        })}
        </div>
        <FormControl id="domain" mb="4" isInvalid={domainError != DomainError.None}>
          <Input
            type="text"
            value={domain}
            autoComplete='off'
            autoCorrect='off'
            placeholder={chrome.i18n.getMessage("DomainsPlaceholder")}
            className='mx-2 mt-2 pl-1 w-64'
            onChange={(e) => {
              setDomain(e.currentTarget.value)
              setDomainError(DomainError.None)
            }}
            onKeyDown={(e) => {
              // validate and add domain if user hits enter and input not empty
              if (e.key == 'Enter' && e.currentTarget.value.length > 0) {
                handleAddDomain(domain)
                e.preventDefault()
                e.stopPropagation()
              }
            }}
          />
          {domainError && domainError.length && (
            <FormErrorMessage className='ml-4'>
              {chrome.i18n.getMessage(domainError)}
            </FormErrorMessage>
          )}
        </FormControl>
      </div>
    )
  }    

  return (
    <TitledComponent
      title={chrome.i18n.getMessage("AppName")}
      subtitle={chrome.i18n.getMessage("CreateScreenSubtitle", tabHost)}
    >
      <div className="text-center space-y-1">
        <div>
          <span className="text-lg">
            <button className="mr-2" onClick={onEmailRefreshClick}>
              <FontAwesomeIcon
                className="text-sky-400 hover:text-sky-500 align-text-bottom"
                icon={faRefresh}
                spin={isRetrievingEmails}
              />
            </button>
            {emails?.length && selectedEmail}
          </span>
          {fwdToEmail !== undefined && (
            <p className="text-gray-400">
              {chrome.i18n.getMessage("ForwardTo", [fwdToEmail])}
            </p>
          )}
        </div>
        {emayliasError && <ErrorMessage>{emayliasError}</ErrorMessage>}
      </div>
      {emails?.length && selectedEmail && (
        <div className="space-y-3">
          <form
            className={`space-y-3 ${
              isReservationFormDisabled ? 'opacity-70' : ''
            }`}
            onSubmit={onUseSubmit}
          >
            <FormControl
              id="label"
              mb="4"
              isInvalid={labelError != null}
            >
              <FormLabel
                fontSize='xs'
                fontWeight="semibold"
                color="gray.600"
                backgroundColor='white'
                ml="2"
                mt="-3"
                px="1.5"
                position="absolute"
                zIndex='overlay'
              >
                {chrome.i18n.getMessage("Label")}
              </FormLabel>
              <Input
                type="text"
                value={label || ''}
                autoComplete='off'
                autoCorrect='off'
                onChange={(e) => {
                  setLabel(e.target.value)
                  setLabelError(null)
                }}
                className={reservationFormInputClassName}
                disabled={isReservationFormDisabled}
              />
              {labelError && labelError.length && (
                <FormErrorMessage className='ml-4'>
                  {labelError}
                </FormErrorMessage>
              )}
            </FormControl>
            {renderDomains()}
            <div>
              <FormLabel
                fontSize='xs'
                fontWeight="semibold"
                color="gray.600"
                backgroundColor='white'
                ml="2"
                mt="-3"
                px="1.5"
                position="absolute"
                zIndex='overlay'
              >
                {chrome.i18n.getMessage("NotesLabel")}
              </FormLabel>
              <textarea
                id="note"
                rows={1}
                className={reservationFormInputClassName}
                placeholder={chrome.i18n.getMessage("NotesPlaceholder")}
                value={note || ''}
                onChange={(e) => setNote(e.target.value)}
                disabled={isReservationFormDisabled}
              ></textarea>
            </div>
            <LoadingButton
              loading={isUseSubmitting}
              disabled={isReservationFormDisabled}
            >
              {chrome.i18n.getMessage("EmaylView_SubmitLabel")}
            </LoadingButton>
            {emayliasError && <ErrorMessage>{emayliasError}</ErrorMessage>}
          </form>
          {savedEmaylias && <ReservationResult email={savedEmaylias.emaylias} />}
        </div>
      )}
      <div className="grid grid-cols-2">
        <div>
          <FooterButton
            onClick={() => props.callback('MANAGE')}
            icon={faList}
            label={chrome.i18n.getMessage("ManageEmails")}
          />
        </div>
        <div className="text-right">
          <SignOutButton {...props} />
        </div>
      </div>
    </TitledComponent>
  );
};

const AliasEntryDetails = (props: {
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

  const btnClassName =
    'w-full justify-center text-white focus:ring-4 focus:outline-none font-medium rounded-lg px-2 py-3 text-center inline-flex items-center';
  const labelClassName = 'font-semibold text-sm';
  let valueClassName = 'text-sm break-words ';
  if (props.emaylias.state == EmayliasState.ACTIVE) {
    valueClassName += 'text-black'
  } else {
    valueClassName += 'text-gray-300'
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
          className={`${btnClassName} ${
            (props.emaylias.state == EmayliasState.ACTIVE)
              ? 'bg-red-500 hover:bg-red-600 focus:ring-red-300'
              : 'bg-sky-400 hover:bg-sky-500 focus:ring-blue-300'
          }`}
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

const searchHmeEmails = (
  searchPrompt: string,
  emayliasList: EmayliasRecord[]
): EmayliasRecord[] | undefined => {
  if (!searchPrompt) {
    return undefined;
  }

  const searchEngine = new Fuse(emayliasList, {
    keys: ['label', 'comment', 'emaylias'],
    threshold: 0.4,
  });
  const searchResults = searchEngine.search(searchPrompt);
  return searchResults.map((result) => result.item);
};

const EmayliasManager = (props: {
  callback: TransitionCallback<AuthenticatedAndManagingAction>;
  emayliasService: EmaylService;
}) => {
  const [fetchedList, setFetchedList] = useState<EmayliasRecord[]>();
  const [emailsError, setEmailsError] = useState<string>();
  const [isFetching, setIsFetching] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchPrompt, setSearchPrompt] = useState<string>();

  useEffect(() => {
    const fetchData = async () => {
      setEmailsError(undefined);
      setIsFetching(true);
      try {
        const emayliasList: EmayliasRecord[] = await emaylService.getList();
        console.log(`EmayliasManager returned ${emayliasList.length} emaylias`)
        setFetchedList(
          emayliasList.sort((a, b) => b.provisionDt < a.provisionDt ? -1 : 1)
        );

        userProfile = await emaylService.getProfile()
        console.log("userProfile = ", userProfile)
      } catch (e) {
        setEmailsError(e.toString());
      } finally {
        setIsFetching(false);
      }
    };

    fetchData();
  }, [props.emayliasService]);

  const activationCallbackFactory = (emaylias: EmayliasRecord) => () => {
    const newEmaylias = { 
      ...emaylias, 
      state: emaylias.state == EmayliasState.ACTIVE ? EmayliasState.INACTIVE : EmayliasState.ACTIVE
    };
    setFetchedList((prevFetchedList) =>
      prevFetchedList?.map((item) =>
        isEqual(item, emaylias) ? newEmaylias : item
      )
    );
  };

  const deletionCallbackFactory = (emaylias: EmayliasRecord) => () => {
    setFetchedList((prevFetchedList) =>
      prevFetchedList?.filter((item) => !isEqual(item, emaylias))
    );
  };

  const aliasEntryListGrid = (fetchedHmeEmails: EmayliasRecord[]) => {
    const emayliasList =
      searchHmeEmails(searchPrompt || '', fetchedHmeEmails) || fetchedHmeEmails;

    if (selectedIndex >= emayliasList.length) {
      setSelectedIndex(emayliasList.length - 1);
    }

    const selectedHmeEmail = emayliasList[selectedIndex];

    const searchBox = (
      <div className="relative p-2 rounded-tl-md bg-gray-100">
        <div className="absolute inset-y-0 flex items-center pl-3 pointer-events-none">
          <FontAwesomeIcon className="text-gray-400" icon={faSearch} />
        </div>
        <input
          type="search"
          className="pl-9 p-2 w-full rounded placeholder-gray-400 border border-gray-200 focus:outline-none focus:border-sky-400"
          placeholder={chrome.i18n.getMessage("SearchPlaceholder")}
          aria-label={chrome.i18n.getMessage("SearchAriaLabel")}
          onChange={(e) => {
            setSearchPrompt(e.target.value);
            setSelectedIndex(0);
          }}
        />
      </div>
    );

    const btnBaseClassName =
      'p-2 w-full text-left border-b last:border-b-0 cursor-pointer truncate focus:outline-sky-400';
    const btnClassName = `${btnBaseClassName} hover:bg-gray-100`;
    const selectedBtnClassName = `${btnBaseClassName} text-white bg-sky-400 font-medium`;
  
    const labelList = emayliasList.map((emaylias, idx) => (
      <button
        key={idx}
        aria-current={selectedIndex === idx}
        type="button"
        className={idx === selectedIndex ? selectedBtnClassName : btnClassName}
        onClick={() => setSelectedIndex(idx)}
      >
        {/* show domains, if any, associated with this emaylias */}
        <span className='mr-1'>
          {emaylias.attrDomains.map((attrDomain) =>
            <DomainFavIconTag
              key={attrDomain.domain}
              domain={attrDomain.domain}
              emaylService={emaylService}
              searchText=""
              showBackground={false}
              onDelete={null}
              imageOnly
            />
          )}
        </span>

        {(emaylias.state == EmayliasState.ACTIVE) ? (
          emaylias.label
        ) : (
          <span className='text-gray-300'>
            {emaylias.label}
          </span>
        )}
      </button>
    ));

    const noSearchResult = (
      <div className="p-3 break-words text-center text-gray-400">
        {chrome.i18n.getMessage("SearchNoResults", searchPrompt)}
      </div>
    );

    return (
      <div className="grid grid-cols-2" style={{ height: 398 }}>
        <div className="overflow-y-auto text-sm rounded-l-md border border-gray-200 h-full">
          <div className="sticky top-0 border-b">{searchBox}</div>
          {emayliasList.length === 0 && searchPrompt ? noSearchResult : labelList}
        </div>
        <div className="overflow-y-auto p-2 rounded-r-md border border-l-0 border-gray-200">
          {selectedHmeEmail && (
            <AliasEntryDetails
              emayliasService={props.emayliasService}
              emaylias={selectedHmeEmail}
              activationCallback={activationCallbackFactory(selectedHmeEmail)}
              deletionCallback={deletionCallbackFactory(selectedHmeEmail)}
            />
          )}
        </div>
      </div>
    );
  };

  const emptyState = (
    <div className="text-center text-lg text-gray-400">
      {chrome.i18n.getMessage("NoEntries")}
    </div>
  );

  const resolveMainChildComponent = (): ReactNode => {
    if (isFetching) {
      return <Spinner />;
    }

    if (emailsError) {
      return <ErrorMessage>{emailsError}</ErrorMessage>;
    }

    if (!fetchedList || fetchedList.length === 0) {
      return emptyState;
    }

    return aliasEntryListGrid(fetchedList);
  };

  return (
    <TitledComponent
      title={chrome.i18n.getMessage("AppName")}
      subtitle={chrome.i18n.getMessage("AppTagLine")}
    >
      {resolveMainChildComponent()}
      <div className="grid grid-cols-2">
        <div>
          <FooterButton
            onClick={() => props.callback('GENERATE')}
            icon={faPlus}
            label={chrome.i18n.getMessage("GenerateNewEntry")}
          />
        </div>
        <div className="text-right">
          <SignOutButton {...props} />
        </div>
      </div>
    </TitledComponent>
  );
};

const transitionToNextStateElement = (
  state: PopupState,
  setState: Dispatch<PopupState>,
): ReactElement => {
  switch (state) {
    case PopupState.SignedOut: {
      return <SignInInstructions />;
    }
    case PopupState.Authenticated: {
      return (
        <EmayliasEditComponent
          callback={(action: AuthenticatedAction) => setState(STATE_MACHINE_TRANSITIONS[state][action])}
          emayliasService={emaylService}
        />
      );
    }
    case PopupState.AuthenticatedAndManaging: {
      return (
        <EmayliasManager
          callback={(action: AuthenticatedAndManagingAction) => setState(STATE_MACHINE_TRANSITIONS[state][action])}
          emayliasService={emaylService}
        />
      );
    }
    default: {
      const exhaustivenessCheck: never = state;
      throw new Error(`Unhandled PopupState case: ${exhaustivenessCheck}`);
    }
  }
};

const Popup = () => {
  const [state, setState, isStateLoading] = useBrowserStorageState(
    'popupState',
    PopupState.SignedOut
  );

  const [clientAuthStateSynced, setClientAuthStateSynced] = useState(false);

  useEffect(() => {
    const syncClientAuthState = async () => {
      const isAuthenticated = await emaylService.isAuthenticated();
      if (isAuthenticated) {
        setState((prevState) =>
          prevState === PopupState.SignedOut
            ? PopupState.Authenticated
            : prevState
        );
      } else {
        setState(PopupState.SignedOut);
        performDeauthSideEffects();
      }

      setClientAuthStateSynced(true);
    };

    // TODO: check what to do here:
    // !isClientStateLoading && 
    !clientAuthStateSynced && syncClientAuthState();
  }, [
    setState,
    clientAuthStateSynced,
  ]);

  return (
    <ChakraProvider theme={theme}>
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {isStateLoading || !clientAuthStateSynced ? (
            <Spinner />
          ) : (
            transitionToNextStateElement(state, setState)
          )}
        </div>
      </div>
    </ChakraProvider>
  );
};

export default Popup;
