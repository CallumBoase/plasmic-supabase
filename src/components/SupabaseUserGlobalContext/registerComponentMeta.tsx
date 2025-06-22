import { GlobalContextMeta } from "@plasmicapp/host";
import type { SupabaseUserGlobalContextProps } from ".";

export const SupabaseUserGlobalContextMeta : GlobalContextMeta<SupabaseUserGlobalContextProps> = {
  name: "SupabaseUserGlobalContext",
  props: {
      defaultRedirectOnLoginSuccess: "string",
  },
  importPath: "./index",
  providesData: true,
  globalActions: {
    login: {
      parameters: [
        {
          name: "email",
          type: "string",
        },
        {
          name: "password",
          type: "string",
        },
        {
          name:"successRedirect",
          type: "string"
        }
      ],
    },
    requestMagicLinkToEmail: {
      parameters: [
        {
          name: "email",
          type: "string",
        },
        {
          name: "createUserIfNotFound",
          type: "boolean",
          displayName: "If the email does not belong to an existing user, should a new user be signed up?"
        },
        {
          name: "userMetadata",
          displayName: "Optional Custom user metadata if user is signed up (object with key:value pairs)",
          type: "object"
        },
        {
          name: "successRedirect",
          type: "string",
          displayName: "Optional URL to redirect to if request succeeds. Leave blank to stay on same page."
        },
        {
          name:"emailRedirect",
          type: "string",
          displayName: "Optional URL of page to redirect to when user clicks the emailed OTP link"
        }
      ],
    },
    signup: {
      parameters: [
        {
          name: "email",
          type: "string",
        },
        {
          name: "password",
          type: "string",
        },
        {
          name:"successRedirect",
          type: "string"
        },
        {
          name: "emailRedirect",
          type: "string"
        },
        {
          name: "userMetadata",
          displayName: "Custom user metadata (object with key:value pairs)",
          type: "object"
        }
      ],
    },
    logout: {
      parameters: [
        {
          name:"successRedirect",
          type: "string"
        }
      ]
    },
    resetPasswordForEmail: {
      parameters: [
        {
        name: "email",
        type: "string",
        },
        {
          name: "redirectTo",
          displayName: 'URL of page to redirect to when user clicks email link',
          type: "string",
        }
      ],
    },
    updateUserPassword: {
      parameters: [
        {
        name: "password",
        type: "string",
        },
      ],
    },
    updateUser: {
      parameters: [
        {
          name: "password",
          type: "string",
          displayName: "New password value (optional)"
        },
        {
          name: "email",
          type: "string",
          displayName: "New email value (optional)"
        },
        {
          name: "phone",
          type: "string",
          displayName: "New phone value (optional)"
        },
        {
          name: "userMetadata",
          displayName: "New user metadata (object with key:value pairs) (optional)",
          type: "object"
        },
        {
          name: "emailRedirect",
          displayName: "Optional URL to redirect the user to when they click the link to confirm email address change",
          type: "string"
        },
        {
          name: "nonce",
          type: "string",
          displayName: "New nonce value (optional)"
        }
      ],
    },
  },
};