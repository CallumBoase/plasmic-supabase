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
  },
};