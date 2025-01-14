import { useCallback } from "react";
import createClient from "../../../utils/supabase/component";

type MutationDependencies = {
  tableName: string;
  columns: string;
  addDelayForTesting: boolean;
  simulateRandomMutationErrors: boolean;
}

import type { SupabaseProviderFetchResult, Row } from "../types";

export function useSupabaseMutations(dependencies: MutationDependencies) {

  const {
    tableName,
    columns,
    addDelayForTesting,
    simulateRandomMutationErrors,
  } = dependencies;

  // Function to add a row in Supabase
  const addRowMutator = useCallback(
    async (
      rowForSupabase: Row,
      shouldReturnRow: boolean
    ): Promise<SupabaseProviderFetchResult> => {
      // Build the supabase query to insert the row with optional return of the new row
      const supabase = createClient();

      let query = supabase.from(tableName).insert(rowForSupabase);

      if (shouldReturnRow) {
        //@ts-ignore - Typescript doesn't like the dynamic query with select but we know it's OK
        query = query.select(columns);
      }

      // Add delay for testing when indicated
      if (addDelayForTesting)
        await new Promise((resolve) => setTimeout(resolve, 1000));

      // Simulate random mutation errors for testing when indicated
      if (simulateRandomMutationErrors && Math.random() > 0.5) {
        throw new Error(
          `Simulated random mutation error, timestamp: ${new Date().toISOString()}`
        );
      }

      // Run the query
      const { data, count, error } = await query;

      // If there is an error, throw it
      if (error) {
        throw error;
      }

      // Return the data and count
      // Count is not technically needed because we aren't counting rows,
      // however, the return type of this function needs to match the fetcher,  so we include it anyway
      return { data, count };
    },
    [tableName, columns, addDelayForTesting, simulateRandomMutationErrors]
  );

  return { addRowMutator };

}
