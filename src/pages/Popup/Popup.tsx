import React, {
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { ChakraProvider, extendTheme, FormControl, FormErrorMessage, FormLabel, Input } from '@chakra-ui/react';
import './Popup.css';
import { useBrowserStorageState } from '../../useBrowserStorageState';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRefresh, faList, faPlus, faSearch } from '@fortawesome/free-solid-svg-icons';
// import { faFirefoxBrowser } from '@fortawesome/free-brands-svg-icons';
import { ErrorMessage, LoadingButton, Spinner, TitledComponent } from '../../commonComponents';

import browser from 'webextension-polyfill';
import {
  PopupAction,
  PopupState,
  AuthenticatedAction,
  STATE_MACHINE_TRANSITIONS,
  AuthenticatedAndManagingAction,
} from './stateMachine';
import { EmayliasRecord, EmayliasState, UserProfile, ChangeEmayliasRequest } from '../../types';
import EmaylService from '../../eMaylService';
import DomainFavIconTag from '../../DomainFavIconTag';
import { checkForDomainError, DomainError } from '../../util/validation';
import { parseDomains } from '../../util/utils';
import { SignInInstructions } from './SignInInstructions';
import { EmayliasCreatedToast } from './EmayliasCreatedToast';
import { FooterButton } from './FooterButton';
import { SignOutButton } from './SignOutButton';
import { AliasEntryDetails } from './AliasEntryDetails';
// import { isFirefox } from '../../browserUtils';

export type TransitionCallback<T extends PopupAction> = (action: T) => void;

export const emaylService = new EmaylService();
let userProfile: UserProfile | null = null;

export async function performDeauthSideEffects(): Promise<void> {
  // await browser.contextMenus
  //   .update(CONTEXT_MENU_ITEM_ID, {
  //     title: chrome.i18n.getMessage("SignedOut_SignInInstructions"),
  //     enabled: false,
  //   })
  //   .catch(console.debug);
}

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
      const [tab] = await browser.tabs.query({ active: true, lastFocusedWindow: true });
      if (tab?.url) {
        let { hostname } = new URL(tab?.url);
        if (hostname.startsWith("www.")) {
          hostname = hostname.replace("www.", "")
        }
        setTabHost(hostname);
        setLabel(/* tab.title ??*/ hostname);
        setDomains([hostname])
        setNote(tab.url)
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
            comment: note ?? "",
            forwardingEmailAddress: userProfile.emailAddress,
            attrDomains: parseDomains(domains),
            state: EmayliasState.ACTIVE
          }
      
          // create a new emaylias
          const emayliasSaved = await emaylService.createEmaylias(changeRecord);
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
      title={chrome.i18n.getMessage("CreateScreenSubtitle", tabHost)}
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
            <b>
              {emails?.length && selectedEmail}
            </b>
          </span>
          {fwdToEmail !== undefined && (
            <p className="text-gray-600 text-sm mt-0.5">
              {chrome.i18n.getMessage("ForwardTo")}
              <b className='ml-1 font-semibold'>
                {fwdToEmail}
              </b>
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
          {savedEmaylias && <EmayliasCreatedToast email={savedEmaylias.emaylias} />}
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

const searchEntries = (
  searchPrompt: string,
  emayliasList: EmayliasRecord[]
): EmayliasRecord[] | undefined => {
  if (!searchPrompt) {
    return undefined;
  }

  const searchUpper = searchPrompt.toLocaleUpperCase()
  return emayliasList.filter(rec => {
    return rec.label.toUpperCase().includes(searchUpper) ||
           rec.comment?.toUpperCase().includes(searchUpper) ||
           rec.emaylias.toUpperCase().includes(searchUpper) ||
           rec.attrDomains?.find(attr => { return attr.domain.toLocaleUpperCase().includes(searchUpper)}) ||
           (rec.forwardingAddress != null) && rec.forwardingAddress.toLocaleUpperCase().includes(searchUpper)
  })
};

const EmayliasManager = (props: {
  callback: TransitionCallback<AuthenticatedAndManagingAction>;
  emayliasService: EmaylService;
  initialSearch: string
}) => {
  const [fetchedList, setFetchedList] = useState<EmayliasRecord[]>();
  const [emailsError, setEmailsError] = useState<string>();
  const [isFetching, setIsFetching] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchPrompt, setSearchPrompt] = useState<string>(props.initialSearch);

  useEffect(() => {
    const fetchData = async () => {
      setEmailsError(undefined);
      setIsFetching(true);
      try {
        const [list, profile] = await Promise.all([
          emaylService.getList(),
          emaylService.getProfile()
        ]);

        setFetchedList(
          list.sort((a, b) => b.provisionDt < a.provisionDt ? -1 : 1)
        );
        userProfile = profile;
      } catch (e) {
        setEmailsError(e.toString());
      } finally {
        setIsFetching(false);
      }
    };

    fetchData();
  }, [props.emayliasService]);

  useEffect(() => {
    setSearchPrompt(props.initialSearch)
  }, [props.initialSearch])

  const activationCallbackFactory = (emaylias: EmayliasRecord) => () => {
    const newEmaylias = { 
      ...emaylias, 
      state: emaylias.state == EmayliasState.ACTIVE ? EmayliasState.INACTIVE : EmayliasState.ACTIVE
    };
    setFetchedList((prevList) =>
      prevList?.map((itm) => itm.objectId == emaylias.objectId ? newEmaylias : itm)
    );
  };

  const deletionCallbackFactory = (emaylias: EmayliasRecord) => () => {
    // remove emaylias from the cached list
    setFetchedList((prevList) =>
      prevList?.filter((itm) => itm.objectId != emaylias.objectId)
    );
  };

  const aliasEntryListGrid = (fetchedHmeEmails: EmayliasRecord[]) => {
    const emayliasList =
      searchEntries(searchPrompt || '', fetchedHmeEmails) || fetchedHmeEmails;

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
          value={searchPrompt}
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
      title="" // {chrome.i18n.getMessage("AppTagLine")}
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

const Popup = () => {
  const [state, setState, isStateLoading] = useBrowserStorageState(
    'popupState',
    PopupState.SignedOut
  );

  const [clientAuthStateSynced, setClientAuthStateSynced] = useState(false);
  const [initialSearch, setInitialSearch] = useState("");

  useEffect(() => {
    const initDataCheck = async () => {
      console.log("**** doing initDataCheck")
      const isAuthenticated = syncClientAuthState();
      if (!isAuthenticated) {
        return;
      }

      const [tab] = await browser.tabs.query({ active: true, lastFocusedWindow: true });
      if (tab?.url) {
        let { hostname } = new URL(tab?.url);
        if (hostname.startsWith("www.")) {
          hostname = hostname.replace("www.", "")
        }
        console.log("**** hostname = ", hostname)
        if (hostname) {
          // retrieve the full list of eMaylias entries
          const list = await emaylService.getList();

          // find all entries that match the hostname
          const filteredHostMatches = list.filter((entry: EmayliasRecord) => {
            return entry.attrDomains.find(dom => dom.domain.includes(hostname));
          })
          console.log("filteredHostMatches.length =", filteredHostMatches.length)
          if (filteredHostMatches.length == 0) {
            // no matching domains, so go to the create screen
            if (state == PopupState.AuthenticatedAndManaging) {
              console.log("filteredHostMatches.length == 0 - set to Authenticated")
              setState(PopupState.Authenticated)
            }
          } else if (filteredHostMatches.length > 0) {
            // go to the eMayl list screen and filter by the found eMaylias
            console.log("filteredHostMatches.length > 0 - state =", state)
            if (state == PopupState.Authenticated) {
              console.log("filteredHostMatches.length > 0 - set to AuthenticatedAndManaging")
              setState(PopupState.AuthenticatedAndManaging)
            }
            console.log("setting initialSearch to ", hostname)
            setInitialSearch(hostname);
          }
        }
      }
    };

    console.log("useEffect - isStateLoading =", isStateLoading);
    if (!isStateLoading) {
      initDataCheck().catch(console.error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStateLoading, setState, state])
  
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const syncClientAuthState = async (): Promise<boolean> => {
    console.log("**** calling isAuthenticated()")
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
    return isAuthenticated;
  };


  useEffect(() => {
    // TODO: check what to do here:
    // !isClientStateLoading && 
    !clientAuthStateSynced && syncClientAuthState();
  }, [setState, clientAuthStateSynced, syncClientAuthState]);

  return (
    <ChakraProvider theme={extendTheme({
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
    })}>
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {isStateLoading || !clientAuthStateSynced ? (
            <Spinner />
          ) : (state == PopupState.SignedOut) ? (
            <SignInInstructions />
          ) : (state == PopupState.Authenticated) ? (
            <EmayliasEditComponent
              callback={(action: AuthenticatedAction) => {
                console.log("transitionToNextStateElement - Auth - STATE_MACHINE_TRANSITIONS[state][action] = ", STATE_MACHINE_TRANSITIONS[state][action])
                setState(STATE_MACHINE_TRANSITIONS[state][action])
              }}
              emayliasService={emaylService}
            />
          ) : (
            <EmayliasManager
              callback={(action: AuthenticatedAndManagingAction) => {
                console.log("transitionToNextStateElement - AuthAndManaging - STATE_MACHINE_TRANSITIONS[state][action] = ", STATE_MACHINE_TRANSITIONS[state][action])
                setState(STATE_MACHINE_TRANSITIONS[state][action])
              }}
              initialSearch={initialSearch}
              emayliasService={emaylService}
            />
          )}          
        </div>
      </div>
    </ChakraProvider>
  );
};

export default Popup;
