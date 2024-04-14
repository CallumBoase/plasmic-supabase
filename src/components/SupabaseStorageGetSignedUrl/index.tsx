import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from "react";
import { DataProvider } from "@plasmicapp/loader-nextjs";
import useSWR from "swr";
import createClient from "../../utils/supabase/component";
import getErrMsg from "../../utils/getErrMsg";

//Decalre types

interface Actions {
  refetchSignedUrl(): Promise<void>;
  clearError(): void;
}

interface SignedUrl {
  signedUrl: string;
}

export interface SupabaseStorageGetSignedUrlProps {
  className?: string;
  queryName: string;
  bucketName: string;
  filePath: string;
  expiresIn?: number;
  hideDefaultErrors: boolean;
  children: React.ReactNode;
  loading: React.ReactNode;
  validating: React.ReactNode;
  noData: React.ReactNode;
  forceNoData: boolean;
  forceQueryError: boolean;
  forceMutationError: boolean;
  forceLoading: boolean;
  forceValidating: boolean;
}

//Define the Supabase provider component
export const SupabaseStorageGetSignedUrl = forwardRef<Actions, SupabaseStorageGetSignedUrlProps>(
  function SupabaseProvider(props, ref) {
    const {
      //All avialable props destructured
      className,
      queryName,
      bucketName,
      filePath,
      expiresIn,
      hideDefaultErrors,
      children,
      loading,
      validating,
      noData,
      forceNoData,
      forceQueryError,
      forceMutationError,
      forceLoading,
      forceValidating,
    } = props;

    //Setup state
    const [data, setData] = useState<SignedUrl | null>(null);

    //string version of the raw error object from SWR
    const [fetcherError, setFetcherError] = useState<string | null>(null);

    //string version of the raw error object from mutation
    const [mutationError, setMutationError] = useState<string | null>(null);

    //Function that can be called to get a signed URL form supabase
    const getSignedUrl = useCallback(async () => {
      
      const supabase = createClient();

      const expiresInToUse = expiresIn || 3600;

      //Get signed URL
      const { data, error } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(filePath, expiresInToUse);

      if (error) {
        throw error;
      }
      return data;

    }, [bucketName, filePath, expiresIn]);

    //Fetch data using SWR
    const {
      data: fetchedData,
      error: rawFetcherErr,
      mutate,
      isValidating,
    } = useSWR(`/${queryName}`, getSignedUrl, {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false,
    });

    //When any props change, refetch data
    useEffect(() => {
      mutate().catch((err) => setMutationError(getErrMsg(err)));
    }, [bucketName, filePath, expiresIn, mutate]);

    //When data changes, set data
    //In turn this will cause change to sortedData
    useEffect(() => {
      if (fetchedData) {
        setData(fetchedData);
      }
    }, [fetchedData]);

    //When error changes from SWR, set fetcherError
    useEffect(() => {
      if (rawFetcherErr) {
        setFetcherError(getErrMsg(rawFetcherErr));
      } else {
        setFetcherError(null);
      }
    }, [rawFetcherErr]);

    //When forceQueryError changes, set fetcherEror
    useEffect(() => {
      if (forceQueryError) {
        setFetcherError("Simulated query error!");
      } else {
        setFetcherError(null);
      }
    }, [forceQueryError]);

    //When forceMutationError changes, set mutationError
    useEffect(() => {
      if (forceMutationError) {
        setMutationError("Simulated mutation error!");
      } else {
        setMutationError(null);
      }
    }, [forceMutationError]);

    /*Define element actions which can be called in Plasmic Studio*/
    useImperativeHandle(ref, () => ({

      //Element action to refetch the signed URL
      refetchSignedUrl: async () => {
        setMutationError(null)
        try {
          await mutate();
          return;
        } catch(err) {
          setMutationError(getErrMsg(err));
          return;
        }
      },

      //Element action to Clear any mutation errors
      clearError: () => {
        setMutationError(null);
      },
    }));

    //Render the component
    return (
      <div className={className}>
        <DataProvider
          name={queryName || "SupabaseProvider"}
          data={{
            isLoading: (isValidating && !fetchedData) || forceLoading,
            isValidating: isValidating || forceValidating,
            mutationError,
            fetcherError,
            data: forceNoData ? null : data
          }}
        >
          {/*Loading state - validating before we initially have data*/}
          {((isValidating && !fetchedData) || forceLoading) && loading}

          {/*Validating state - any time we are running mutate() to revalidate cache*/}
          {(isValidating || forceValidating) && validating}

          {/*No data state*/}
          {(!data || forceNoData) && noData}

          {/*Error state - error is currently there according to SWR*/}
          {fetcherError && !hideDefaultErrors && (
            <p>Error from getting signed URL: {fetcherError}</p>
          )}

          {/*Error state - error is currently there according to mutation*/}
          {mutationError && !hideDefaultErrors && (
            <p>Error from mutation: {mutationError}</p>
          )}

          {/*Render children with data provider - when we have data*/}
          {data && children}
        </DataProvider>
      </div>
    );
  }
);