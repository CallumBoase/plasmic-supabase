import { v4 as uuid } from "uuid";
import getErrMsg from "../../../utils/getErrMsg";

import type { SupabaseProviderError } from "../types";

type BuildSupabaseProviderErrorParams = {
  error: any;
  actionAttempted: SupabaseProviderError["actionAttempted"];
  summary: string;
  dataForSupabase?: SupabaseProviderError["dataForSupabase"];
  optimisticData?: SupabaseProviderError["optimisticData"];
  customMetadata: SupabaseProviderError["customMetadata"];
};

type BuildSupabaseProviderError = (
  params: BuildSupabaseProviderErrorParams
) => SupabaseProviderError;

export const buildSupabaseProviderError: BuildSupabaseProviderError = ({
  error,
  actionAttempted,
  summary,
  dataForSupabase,
  optimisticData,
  customMetadata
}) => {
  return {
    errorId: uuid(),
    summary,
    errorMessage: getErrMsg(error),
    actionAttempted,
    dataForSupabase: dataForSupabase ? dataForSupabase : null,
    optimisticData: optimisticData ? optimisticData : null,
    customMetadata
  };
};
