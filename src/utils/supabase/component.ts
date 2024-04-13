import { createBrowserClient } from '@supabase/ssr'
import { parse, serialize } from 'cookie';

//Helper function to check if setting cookies works
//This is used to determine if we are running in plasmic studio or preview
//In plasmic studio / preview setting cookies does not error, but the value does not stick
//If cookies won't work, we'll instead save session info into local storage
function cookiesAvailable() {
  document.cookie = 'studioEnv=false';
  const cookies = parse(document.cookie);
  const testCookieRefetched = cookies['studioEnv'];

  if(testCookieRefetched) {
    //Cookie setting works. We're not in plasmic studio
    //Delete the unused cookie
    document.cookie = "studioEnv=; expires=Thu, 01 Jan 1970 00:00:00 UTC";
    return true;
  } else {
    //Cookie setting doesn't work. We're in plasmic studio
    return false;
  }

}

export default function createClient() {
  //Create the supabase client like normal
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      //Override the default behaviour of how supabase handles storing of session data of logged in user
      //Reason: Plasmic studio & Plasmic studio -> Preview runs the app in an iframe which doesn't seem to support setting or getting of cookies
      //Therefore, when running in plasmic studio, we store session data in localStorage instead
      //However, we retain default behaviour of using cookies outside of Plasmic studio for security & functionality benefits
      cookies: {

        //Override the default behaviour of how supabase gets session data of logged in user
        get: (key) => {

          
          if(cookiesAvailable()) {
            //Cookies are available, so we get session data from cookies
            //This is the default behaviour of createBrowserClient
            //This option should run, except when editing the app in plasmic studio or previewing it from studio
            const cookies = parse(document.cookie);
            return cookies[key];

          } else {
            //Cookies are not available, so we're in plasmic studio or plasmic studio preview
            //Look for session data in localStorage instead (the set() function below should have saved it there)
            return localStorage.getItem(key);

          }
        },

        //Override the default behaviour of how supabase saves session data of logged in user
        set: (key, value, options) => {
          
          if(cookiesAvailable()) {
            //Cookies are available, so we are running the app normally, not in plasmic studio / plasmic preview
            //Store session data in cookies
            //This is the default behaviour of createBrowserClient
            //ONLY this method will run when cookies are available, improving security
            document.cookie = serialize(key, value, options);

          
          } else {
            //Cookies are not available, so we're in plasmic studio or plasmic studio preview
            //Save session info in localStorage instead
            localStorage.setItem(key, value);
          }
          
        },

        //Override the default behaviour of how supabase removes session data of logged in user
        //Remove session data from both cookies and localStorage (if present)
        remove: (key, options) => {
          //Remove the session data from cookies (if present) (default behaviour)
          document.cookie = serialize(key, '', options);
          //Remove the session data from localStorage (if present)
          localStorage.removeItem(key);
        }
      },
    }
  );

  return supabase;

};