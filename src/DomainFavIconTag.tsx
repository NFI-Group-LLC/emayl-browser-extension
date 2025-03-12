// DomainFavIconTag.jsx
import { Highlight, Image } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import { faGlobe, faX } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Spinner } from './commonComponents';
import EmaylService from './eMaylService';

interface DomainFavIconTagProps {
  domain: string,
  emaylService: EmaylService
  searchText: string | null,
  showBackground: boolean,
  onDelete: (() => void) | null
  imageOnly: boolean
}

const DomainFavIconTag = ({ domain, emaylService, searchText, showBackground, onDelete, imageOnly }: DomainFavIconTagProps) => {
  const [loading, setLoading] = useState<boolean>(true)
  const [imageSrc, setImageSrc] = useState<string>()

  useEffect(() => {
    const getData = async ()  => {
      try {
        const imageSrc: string = await emaylService.getFavIcon(domain)
        setImageSrc(imageSrc)
      } catch (error) {
        console.log("DomainFavIcon exception retrieving image:", error)
      } finally {
        setLoading(false)
      }
    }
    if (domain && domain.length >= 3) {
      getData()
    }
  }, [domain, emaylService])

  let className = "inline-flex place-items-center items-center align-middle middle justify-center rounded-lg"
  if (showBackground) {
    className = className + " bg-slate-200 px-2 m-1 py-1"
  } else {
    if (imageOnly) {
      className = className + " mr-0"
    } else {
      className = className + " pr-1 mr-5 mb-1"
    }
  }

  if (loading) {
    return <Spinner />
  }

  return (
    <span className={className}>
      {imageSrc ? (
        <Image
          src={imageSrc}
          alt={""}
          className={imageOnly ? 'w-6 mr-0.5' : 'inline-block mr-1.5 mb-1 w-6 h-6'}
        />
      ) : (
        <span className={imageOnly ? 'w-6 mr-0.5' : 'inline-flex place-items-center mr-2 mb-1'}>
          <FontAwesomeIcon icon={faGlobe} className="text-red-500 mr-1" />
        </span>
      )}
      {!imageOnly && (
        <span className='inline-flex mb-1 max-w-80 text-sm place-items-center'>
          <Highlight
            query={showBackground ? "" : searchText ?? ""}
            styles={{ color: 'green', textDecor: 'wavy underline' }}
          >
            {domain}
          </Highlight>
          {onDelete && (
            <button type='button' onClick={onDelete} className='ml-2'>
              <FontAwesomeIcon icon={faX} className="text-gray-800 mr-1" />
            </button>
          )}
        </span>
      )}
    </span>
  );
};

export default DomainFavIconTag;
