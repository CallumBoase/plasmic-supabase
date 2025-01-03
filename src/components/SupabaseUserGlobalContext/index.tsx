import React from "react";
import { DataProvider } from "@plasmicapp/host";
import { GlobalActionsProvider } from "@plasmicapp/host";
import { useState, useEffect, useMemo } from "react";
import createClient from '../../utils/supabase/component'
import getErrMsg from "../../utils/getErrMsg";
import type { AuthTokenResponse } from "@supabase/supabase-js";

// Note on using window.location for redirects/reloads in this component, instead of Next.js Router

// Context:
// Next.js <Link> components prefetch pages in the background for faster navigation
// This can cause unexpected behaviour when using Middleware for login protecting pages (eg redirect to /login if not logged in)

// Scenario:
// 1. User is not logged in and visits a page that contains a <Link> to a private page
// 2. <Link> prefetches the private page. Middleware runs caching that a redirect to /login should occur if <Link> clicked
// 3. User logs in and we do NOT use window.locatoin.reload or window.location.href to redirect/reload
// 4. User clicks the <Link> to the private page, but due to cached prefetch, they are redirected to /login still

// Issue:
// Middleware runs during prefetch, but not during actual navigation, causing outdated auth state checks

// Solution:
// Use window.location.reload() or window.location.href for redirects/reloads after login/logout
// This invalidates prefetched pages, ensuring middleware runs again based on the new auth state


interface DataProviderData {
  user: AuthTokenResponse["data"]["user"] | null;
  error: string | null;
}

interface UserMetadata {
  [index: string]: number | string | boolean | object;
}

export interface SupabaseUserGlobalContextProps {
  children: React.ReactNode;
  defaultRedirectOnLoginSuccess?: string;
}

export const SupabaseUserGlobalContext = ({children, defaultRedirectOnLoginSuccess}: SupabaseUserGlobalContextProps) => {
  
  //Setup state
  const [user, setUser] = useState<AuthTokenResponse["data"]["user"] | null>(null);
  const [error, setError] = useState<string | null>(null);

  //Helper function to get the user and save to state
  async function getUserAndSaveToState() {

    const supabase = createClient();

    //Get the session from stored credentials (not from the server)
    let { data: getSessionData, error: getSessionError } = await supabase.auth.getSession();
    if (getSessionError) {
      throw getSessionError;
    }

    //If no session, set user to null
    if(!getSessionData.session) {
      setUser(null);
      setError(null)
      return;
    }

    //If there is a session, save the user to state
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.error(error);
      throw error;
    }
    setUser(data?.user);

  }

  //On initial load, set the session to state
  useEffect(() => {
    getUserAndSaveToState();
  }, [])

  //Global actions that can be called from plasmic studio
  const actions = useMemo(
    () => ({
      //Login
      login: async (email: string, password: string, successRedirect: string) => {
        try {
          const supabase = createClient();
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) {
            throw error;
          }
          
          //Save the session to state
          setUser(data?.session?.user);
          
          //Reset errors if present
          setError(null);

          //Redirect or reload on success
          if(successRedirect ?? defaultRedirectOnLoginSuccess){
            window.location.href = successRedirect ?? defaultRedirectOnLoginSuccess;
          } else {
            window.location.reload();
          }
          
          return;

        } catch (e) {
          setError(getErrMsg(e))
          return;
        }
      },

      //requestMagicLinkToEmail
      requestMagicLinkToEmail: async (
        email: string, 
        createUserIfNotFound: boolean, 
        userMetadata?: UserMetadata,
        successRedirect?: string, 
        emailRedirect?: string
      ) => {
        try {
          const supabase = createClient();

          const options = {
            emailRedirectTo: emailRedirect || undefined,
            data: userMetadata || undefined,
            shouldCreateUser: createUserIfNotFound ? true : false
          }

          const { error } = await supabase.auth.signInWithOtp({
            email,
            options
          });

          // Throw errors if present
          if (error) {
            throw error;
          }

          // Save the session to state
          // Unless there's already a logged in user,
          // It's likely there will be no session to save to state
          await getUserAndSaveToState();

          //Reset errors to nothing since it succeeded
          setError(null);

          //Redirect on success
          //Reload is not required
          if(successRedirect){
            window.location.href = successRedirect;
          }
          
          return;

        } catch (e) {
          setError(getErrMsg(e))
          return;
        }

      },

      //Logout
      logout: async (successRedirect: string) => {
        try {
          const supabase = createClient();
          const { error } = await supabase.auth.signOut();
          if (error) {
            throw error;
          }
          //Reset the session in state
          setUser(null);

          //Reset errors if present
          setError(null);

          //Redirect or reload on success
          if(successRedirect) {
            window.location.href = successRedirect;
            // router.push(successRedirect);
          } else {
            window.location.reload();
          }

          return;
        } catch (e) {
          setError(getErrMsg(e))
          return;
        }
      },
      //signUp
      signup: async (email: string, password: string, successRedirect: string, emailRedirect?: string, userMetadata?: UserMetadata) => {
        try {
          const supabase = createClient();
          let options = Object.assign({},
            userMetadata && { data: userMetadata },
            emailRedirect && { emailRedirectTo: emailRedirect },
          )

          const { error } = await supabase.auth.signUp({ 
            email, 
            password,
            options 
          });
          if (error) throw error;
          await getUserAndSaveToState();

          setError(null);

          //Redirect or reload on success
          if(successRedirect) {
            window.location.href = successRedirect;
          } else {
            window.location.reload();
          }
          
          // There is potential to include a signup redirect here that would redirect to a page provided in an action parameter
          return true;
        } catch (e) {
          setError(getErrMsg(e))
          return false;
        }
      },
      //resetPassword
      resetPasswordForEmail: async (email: string, redirectTo?: string) => {
        try {

          const options = {
            redirectTo: redirectTo || undefined
          }

          const supabase = createClient();
          const { error } = await supabase.auth.resetPasswordForEmail(
            email, // this auth function takes its parameters slightly differently. It doesn't accept named parameters like the other supabase.auth functions.
            options
          );
          if (error) throw error;
          await getUserAndSaveToState();
          setError(null);
          return;
        } catch (e) {
          setError(getErrMsg(e))
          return;
        }
      },
      // Update User Password
        // This action/function assumes the user has an active session (either by having "Logged in" or clicking the password reset confirmation from a recovery email)
        // Currently this can be used by any authenticated user to change their password without having to re-enter their exisiting password
        // There is likely a more robust way to perform this - 
        // i.e. requiring an expiring token to be passed in the /changepassword URL, validating the token against the supabase DB, only displaying the page if the toekn was valid, otherwise redirect
      updateUserPassword: async (password: string) => {
        try {
          const supabase = createClient();
          const { error } = await supabase.auth.updateUser({
            password: password
          });
          if (error) throw error;
          await getUserAndSaveToState();
          setError(null);
          return;
        } catch (e) {
          setError(getErrMsg(e))
          return;
        }
      },
      // Update user
      // This action/function assumes the user has an active session (either by having "Logged in" or clicking the password reset confirmation from a recovery email)
      // Full-option user update function using same underlying method as updateUserPassword
      updateUser: async (
        password?: string, 
        email?: string, 
        phone?: string, 
        userMetadata?: UserMetadata, 
        emailRedirect?: string,
        nonce?: string
      ) => {
        try {
          const supabase = createClient();
          const { error } = await supabase.auth.updateUser(
            {
              password: password || undefined,
              email: email || undefined,
              phone: phone || undefined,
              data: userMetadata || undefined,
              nonce: nonce || undefined,
            },
            {
              emailRedirectTo: emailRedirect || undefined
            }
          );
          if (error) throw error;
          await getUserAndSaveToState();
          setError(null);
          return;
        } catch (e) {
          setError(getErrMsg(e))
          return;
        }
      },
    }),
    [defaultRedirectOnLoginSuccess]
  );
  
  //Setup the data that will be passed as global context to Plasmic studio
  const dataProviderData: DataProviderData = {
    user,
    error,
  };

  //Render the actual components
  return (
    <GlobalActionsProvider
      contextName="SupabaseUserGlobalContext"
      actions={actions}
    >
      <DataProvider name="SupabaseUser" data={dataProviderData}>
        {children}
      </DataProvider>
    </GlobalActionsProvider>
  );
};