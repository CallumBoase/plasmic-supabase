import { CodeComponentMeta } from "@plasmicapp/loader-nextjs";
import type { SupabaseStorageGetSignedUrlProps } from ".";

export const SupabaseStorageGetSignedUrlMeta: CodeComponentMeta<SupabaseStorageGetSignedUrlProps> = {
  name: "SupabaseStorageGetSignedUrl",
  description: "Get a signed URL for a file in a private bucket. For public buckets, directly construct the public URL instead.",
  providesData: true,
  props: {
    queryName: {
      type: "string",
      displayName: "Query name", 
      description: "Unique name for this query throughout the whole app, to help cache the result."
    },
    bucketName: {
      type: 'string',
      displayName: 'Bucket name',
      description: 'The name of the Supabase Storage bucket where the file is stored.'
    },
    filePath: {
      type: 'string',
      displayName: 'File path',
      description: 'The path to the file within in the bucket. Eg example01.jpg or someFolder/example01.jpg'
    },
    expiresIn: {
      type: 'number',
      displayName: 'Expires in',
      description: 'The number of seconds until the signed URL expires. If not set, the default is 1 hour (3600 seconds).'
    },
    hideDefaultErrors: {
      type: 'boolean',
      displayName: 'Hide default errors',
      description: 'Hide the error slots, and handle errors yourself elsewhere'
    },
    children: "slot",
    loading: "slot",
    validating: "slot",
    noData: "slot",
    forceNoData: {
      type: 'boolean',
      displayName: 'Force no data',
      description: 'Force the component to show the no data slot, for testing'
    },
    forceQueryError: {
      type: 'boolean',
      displayName: 'Force query error',
      description: 'Force the component to show the query error slot, for testing'
    },
    forceMutationError: {
      type: 'boolean',
      displayName: 'Force mutation error',
      description: 'Force the component to show the mutation error slot, for testing'
    },
    forceLoading: {
      type: 'boolean',
      displayName: 'Force loading',
      description: 'Force the component to show the loading slot, for testing'
    },
    forceValidating: {
      type: 'boolean',
      displayName: 'Force validating',
      description: 'Force the component to show the validating slot, for testing'
    }
  },
  refActions: {
    refetchSignedUrl: {
      description: "Refetch the signed URL",
      argTypes: [],
    },
    clearError: {
      description: "Clear the latest error message",
      argTypes: [],
    },
  },
  importPath: "./index",
}