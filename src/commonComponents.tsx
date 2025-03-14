import React, { ButtonHTMLAttributes, DetailedHTMLProps } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

export const Spinner = () => {
  return (
    <div className="text-center">
      <FontAwesomeIcon
        icon={faSpinner}
        spin={true}
        className="text-3xl text-sky-400"
      />
    </div>
  );
};

export const LoadingButton = (
  props: {
    loading: boolean;
  } & DetailedHTMLProps<
    ButtonHTMLAttributes<HTMLButtonElement>,
    HTMLButtonElement
  >
) => {
  const { loading, disabled, ...btnHtmlAttrs } = props;

  const defaultClassName =
    'w-full justify-center text-white bg-sky-400 hover:bg-sky-500 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg px-5 py-2.5 text-center mr-2 inline-flex items-center';

  const diabledClassName =
    'w-full justify-center text-white bg-gray-400 font-medium rounded-lg px-5 py-2.5 text-center mr-2 inline-flex items-center';

  const btnClassName = disabled ? diabledClassName : defaultClassName;

  return (
    <button
      type="submit"
      className={btnClassName}
      disabled={loading || disabled}
      {...btnHtmlAttrs}
    >
      {loading && !disabled && (
        <FontAwesomeIcon icon={faSpinner} spin={true} className="mr-1" />
      )}
      {props.children}
    </button>
  );
};

export const ErrorMessage = (props: { children?: React.ReactNode }) => {
  return (
    <div
      className="p-2 text-sm text-red-700 bg-red-100 rounded-lg"
      role="alert"
    >
      {props.children}
    </div>
  );
};

export const TitledComponent = (props: {
  title: string;
  children?: React.ReactNode;
}) => {
  const children =
    props.children instanceof Array ? props.children : [props.children];

  return (
    <div className="text-base space-y-3">
      <div className="flex text-center items-center justify-center">
        <h1 className="flex text-xl font-normal text-blue-900 items-center justify-center">
          <Link
            href="https://emayl.app"
            className="flex items-center"
            aria-label={chrome.i18n.getMessage("GoToWebApp")}
            title={chrome.i18n.getMessage("GoToWebApp")}
          >
            <img
              src='./icon-16.png'
              alt={chrome.i18n.getMessage("GoToWebApp")}
            />
            <div className='flex text-base text-center font-serif ml-1 text-black'>
              {chrome.i18n.getMessage("AppName")}
              <span className='text-sm align-super ml-0.5'>™</span>
            </div>
          </Link>
          <span className="text-2xl font-extrabold text-gray-700 ml-5">{props.title}</span>
        </h1>
      </div>
      {children?.map((child, key) => {
        return (
          child && (
            <React.Fragment key={key}>
              {child}
            </React.Fragment>
          )
        );
      })}
    </div>
  );
};

export const Link = (
  props: React.DetailedHTMLProps<
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    HTMLAnchorElement
  >
) => {
  // https://github.com/jsx-eslint/eslint-plugin-react/issues/3284
  // eslint-disable-next-line react/prop-types
  const { className, children, ...restProps } = props;
  return (
    <a
      className={`text-sky-400 hover:text-sky-500 ${className}`}
      target="_blank"
      rel="noreferrer"
      {...restProps}
    >
      {children}
    </a>
  );
};
