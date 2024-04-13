import createClient from "../utils/supabase/component";

//Helper function to the get a bearer token to use with supabase
//Either the logged in user's bearer token or the anon token if no user logged in
//This is useful for manually sending an API call to SupabaseStorage (eg when using Tus with Uppy)
//Because you need to provide a bearer token even if there's no logged in user
export default async function getBearerTokenForSupabase() {
  //Init supabase client
  const supabase = createClient();

  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session?.access_token) {
    //Return the anon token
    return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  } else {
    //Return the logged in user's auth token
    return data.session.access_token;
  }
}