import { CodeComponentMeta } from "@plasmicapp/loader-nextjs";
import type { SupabaseStorageGetSignedUrlProps } from ".";

export const SupabaseStorageGetSignedUrlMeta: CodeComponentMeta<SupabaseStorageGetSignedUrlProps> = {
  name: "SupabaseStorageGetSignedUrl",
  description: "Get a signed URL for a file in a private bucket. For public buckets, directly construct the public URL instead.",
  providesData: true,
  props: {
    queryName: "string",
    bucketName: "string",
    filePath: "string",
    expiresIn: "number",
    hideDefaultErrors: "boolean",
    children: "slot",
    loading: "slot",
    validating: "slot",
    noData: "slot",
    forceNoData: "boolean",
    forceQueryError: "boolean",
    forceMutationError: "boolean",
    forceLoading: "boolean",
    forceValidating: "boolean",
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
}