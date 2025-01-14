import { v4 as uuid } from "uuid";
import getErrMsg from "../../../utils/getErrMsg";

import type { SupabaseProviderError } from "../types";

type BuildSupabaseProviderErrorParams = {
  error: any;
  operation: SupabaseProviderError["actionAttempted"];
  summary: string;
  optimisticData?: SupabaseProviderError["optimisticData"];
};

type BuildSupabaseProviderError = (params: BuildSupabaseProviderErrorParams) => SupabaseProviderError;

export const buildSupabaseProviderError : BuildSupabaseProviderError = ({error, operation, summary, optimisticData}) => {
  return {
    errorId: uuid(),
    summary,
    errorMessage: getErrMsg(error),
    actionAttempted: operation,
    optimisticData: optimisticData ? optimisticData : null,
  };
}