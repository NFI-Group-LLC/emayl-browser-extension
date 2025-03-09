import { serialize, SerializeOptions } from 'cookie'
import { jwtDecode } from 'jwt-decode'
import { ICookie } from '../types'

export const COOKIE_APP_URL = "https://emayl.app"
export const COOKIE_CHUNK_SIZE = 3800 // Reserve some space for the cookie name and other overhead
export const COOKIE_PREFIX = 'emayl-cookie'

const getAllCookies = (): Promise<chrome.cookies.Cookie[]> => {
  return new Promise((resolve, reject) => {
    chrome.cookies.getAll({ url: COOKIE_APP_URL }, (cookies) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(cookies);
      }
    });
  });
};

export const removeAllCookies = (): Promise<void> => {
  console.log("calling removeAllCookies()")
  return new Promise((resolve, reject) => {
    chrome.cookies.getAll({}, (cookies) => {
      if (chrome.runtime.lastError) {
        console.log("removeAllCookies() failed:", chrome.runtime.lastError)
        reject(chrome.runtime.lastError);
      } else {
        const removePromises = cookies.map(cookie => {
          return new Promise<void>((resolve, reject) => {
            chrome.cookies.remove({ url: `http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path}`, name: cookie.name }, () => {
              if (chrome.runtime.lastError) {
                console.log("removeAllCookies() remove failed:", chrome.runtime.lastError)
                reject(chrome.runtime.lastError);
              } else {
                resolve();
              }
            });
          });
        });

        Promise.all(removePromises)
          .then(() => resolve())
          .catch((error) => reject(error));
      }
    });
  });
};

export const getLargeCookie = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    getAllCookies()
      .then((cookies) => {
        if (cookies) {
          const countCookie = cookies.filter(cookie => cookie.name == `${COOKIE_PREFIX}-auth-count`);
          if (!countCookie.length) {
            console.log("**** getLargeCookie - numChunks not found");
            reject(Error("No cookie count"));
            return;
          }
          const countStr: string = countCookie[0].value as string
          // console.log(`countStr: ${countStr}`);
          const numChunks = parseInt(countStr) || 0;
          if (numChunks === 0) {
            console.log("**** getLargeCookie - numChunks == 0");
            reject(Error("invalid cookie count or chunk is zero"));
            return;
          }
          let value = '';
          for (let i = 0; i < numChunks; i++) {
            const chunkName = `${COOKIE_PREFIX}-auth-chunk-${i}`            
            const chunkCookie = cookies.filter(cookie => cookie.name == chunkName);
            if (!chunkCookie.length) {
              console.log("**** getLargeCookie - unable to finc chunk", chunkName);
              reject(Error("Invalid cookie count or missing chunk"));
              return;
            }
            value += chunkCookie[0].value;
          }
          resolve(value)
        }
      })
      .catch((reason) => {
        console.log("getAllCookies rejection:", reason)
        reject(reason)
      })
  });

}

export const isTokenExpired = (token: string) => {
  const { exp } = jwtDecode(token);
  const currentTime = Date.now() / 1000;
  if (!exp) {
    console.log("isTokenExpired -- exp is NULL")
    return true
  }
  // console.log(`isTokenExpired -- exp=${exp}`)
  return exp < currentTime;
}

export const wrapCookie = (jwt: ICookie): Headers => {
  const jsonString = JSON.stringify(jwt)
  const encodedValue = encodeURIComponent(jsonString)
  const numChunks = Math.ceil(encodedValue.length / COOKIE_CHUNK_SIZE)
  const cookieOptions: SerializeOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV !== 'development', // Use secure cookies in production
    path: "/"
  }

  if (jwt.identityToken) {
    const { exp } = jwtDecode(jwt.identityToken);
    const currentTime = Date.now() / 1000;
    if (!exp) {
      console.log("wrapCookie -- exp is NULL")
    } else {
      const timeToExp = exp - Math.floor(currentTime)
      if (timeToExp < 0) {
        console.log(`wrapCookie -- expired ${-timeToExp} seconds ago`)
      } else {
        console.log(`wrapCookie -- expires in ${timeToExp} seconds, exp=${exp}`)
      }
    }
  }

  const newHeaders = new Headers()
  newHeaders.set('Set-Cookie', serialize(`${COOKIE_PREFIX}-auth-count`, String(numChunks), cookieOptions))

  for (let i = 0; i < numChunks; i++) {
    const chunk = encodedValue.slice(i * COOKIE_CHUNK_SIZE, (i + 1) * COOKIE_CHUNK_SIZE)
    const cookieName = `${COOKIE_PREFIX}-auth-chunk-${i}`;
    newHeaders.append('Set-Cookie', serialize(cookieName, chunk, cookieOptions))
  }

  return newHeaders
}

// for debugging purposes only
export const logExpiration = (prefix: string, token: string | null) => {
  if (!token || !token.length) {
    console.log(prefix + " -- accessToken is NULL")
  } else {
    const { exp } = jwtDecode(token);
    if (exp) {
      const secs = Math.floor(exp - (Date.now() / 1000))
      if (secs <= 0) {
        console.log(prefix + " -- EXPIRED")
      } else {
        const hours = Math.floor(secs / 3600)
        const mins = Math.floor((secs % 3600) / 60)
        if (hours == 0) {
          console.log(prefix + ` --- token expires in ${mins} mins, ${secs % 60} seconds`)
        } else {
          console.log(prefix + ` --- token expires in ${hours} hours, ${mins} mins, ${secs % 60} seconds`)
        }
      }
    } else {
      console.log(prefix + "-- exp not found")
    }
  }
}
