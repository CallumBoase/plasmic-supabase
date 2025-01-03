import { createBrowserClient } from "@supabase/ssr";
import { createClient as createClientPrimitive } from "@supabase/supabase-js";
import { parse } from "cookie";
import serverSide from "@/utils/serverSide";

//Helper function to check if setting cookies works
//This is used to determine if we are running in plasmic studio or preview
//In plasmic studio / preview setting cookies does not error, but the value does not stick
//If cookies won't work, we'll instead save session info into local storage
function cookiesAvailable() {
  document.cookie = "studioEnv=false";
  const cookies = parse(document.cookie);
  const testCookieRefetched = cookies["studioEnv"];

  if (testCookieRefetched) {
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
  let supabase;

  //Check if we are pre-rendering this component within getStaticProps
  //Using the react-ssr-prepass that standard Plasmic loader API uses in the [[...catchall]].tsx page
  //This happens server-side so cookies and local storage are not available
  if (serverSide()) {

    // Render the static-props version of the SupabaseProvider
    // The query will run successfully on the server if it is accessible to the public
    // But will fail if the query requires the user to be logged in
    // This is OK and expected behaviour, allowing pre-rendering of public data only
    // eg for a blog, product list, on a dynamic page of a website that needs good SEO
    supabase = createClientPrimitive(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

  } else {

    // We are running in the browser

    if(cookiesAvailable()) {

      //Cookies are available, so we use the default behaviour of createBrowserClient
      //This option will run when NOT editing the app in plasmic studio or previewing it from studio
      supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

    } else {

      // Cookies are not available, so we use a modified version of createBrowserClient compatible with plasmic studio or preview
      // This option will run when editing the app in plasmic studio or previewing it from studio
      // We store & retrieve session data in localStorage instead of normal cookies

      supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return Object.keys(localStorage).map(name => ({ name, value: localStorage.getItem(name) || '' }))
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value }) => localStorage.setItem(name, value))
            }

          }
        }
      )

    }
  }

  return supabase;

}