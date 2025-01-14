import { v4 as uuid } from "uuid";
import getErrMsg from "../../../utils/getErrMsg";

import type { SupabaseProviderError } from "../types";

type BuildSupabaseProviderErrorParams = {
  error: any;
  operation: SupabaseProviderError["actionAttempted"];
  summary: string;
  dataForSupabase?: SupabaseProviderError["dataForSupabase"];
  optimisticData?: SupabaseProviderError["optimisticData"];
};

type BuildSupabaseProviderError = (
  params: BuildSupabaseProviderErrorParams
) => SupabaseProviderError;

export const buildSupabaseProviderError: BuildSupabaseProviderError = ({
  error,
  operation,
  summary,
  dataForSupabase,
  optimisticData,
}) => {
  return {
    errorId: uuid(),
    summary,
    errorMessage: getErrMsg(error),
    actionAttempted: operation,
    dataForSupabase: dataForSupabase ? dataForSupabase : null,
    optimisticData: optimisticData ? optimisticData : null,
  };
};
