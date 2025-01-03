import { CodeComponentMeta } from "@plasmicapp/host";
import { SupabaseProviderNewProps } from ".";

// className,
//       queryName,
//       tableName,
//       columns,
//       filters,
//       orderBy,
//       limit,
//       offset,
//       returnCount,

export const SupabaseProviderNewMeta : CodeComponentMeta<SupabaseProviderNewProps> = {
  name: "SupabaseProviderNew",
  importPath: "./index",
  providesData: true,
  props: {
    children: {
      type: "slot",
      defaultValue: [
        {
          type: "text",
          value:
            `INSTRUCTIONS FOR SUPABASE PROVIDER:
            1. Click the new SupabaseProvider component in the Component tree (LHS of screen) to open it's settings
            2. In settings on RHS of screen, choose a globally unique "Query name" (eg "/pagename/staff")
            3. Enter the correct "table name" from Supabase (eg "staff")
            4. On LHS of screen, change the name of SupabaseProvider to match the query name
            5. Delete this placeholder text (from "children" slot). Then add components to "children" and use the dynamic data as you wish! :)`,
        },
      ],
    },
    queryName: {
      type: "string",
      required: true,
    },
    tableName: {
      type: "string",
      required: true,
    },
    columns: {
      type: "string",
      defaultValue: "*",
    },
    filters: {
      type: "array",
      itemType: {
        type: "object",
        fields: {
          fieldName: "string",
          operator: {
            type: "choice",
            options: [
              {
                value: "eq",
                label: "is equal to (eq)"
              },
              {
                value: "neq",
                label: "not equal to (neq)"
              },
              {
                value: "gt",
                label: "greater than (gt)"
              },
              {
                value: "gte",
                label: "greater than or equal to (gte)"
              },
              {
                value: "lt",
                label: "less than (lt)"
              },
              {
                value: "lte",
                label: "less than or equal to (lte)"
              },
              {
                value: "like",
                label: "matches a case-sensitive pattern (like)"
              },
              {
                value: "ilike",
                label: "matches a case-insensitive pattern (ilike)"
              },
              {
                value: "is",
                label: "is (is)"
              },
              {
                value: "in",
                label: "is in an array (in)"
              },
              {
                value: "contains",
                label: "contains every element in (contains)"
              },
              {
                value: "containedBy",
                label: "contained by (containedby)"
              },
              {
                value: "rangeGt",
                label: "greater than range (rangeGt)"
              },
              {
                value: "rangeGte",
                label: "greater than or equal to range (rangeGte)"
              },
              {
                value: "rangeLt",
                label: "less than range (rangeLt)"
              },
              {
                value: "rangeLte",
                label: "less than or equal to range (rangeLte)"
              },
              {
                value: "rangeAdjacent",
                label: "is mutually exclusive to range (rangeAdjacent)"
              },
              {
                value: "overlaps",
                label: "has an element in common with (overlaps)"
              },
              {
                value: "match",
                label: "where each { column:value, ... } matches (match)"
              },
              {
                value: "or",
                label: "that matches at least one PostgREST filter (or)"
              },
              {
                value: "textSearch",
                label: "matches the query string (textSearch)"
              },
              {
                value: "not",
                label: "that doesn't match the PostgREST filter (not)"
              },
            ]
          },
          value: "string",
          value2: "string",
        },
      },
      description:
        "Filters to execute during the query. Acceptable values are eq, neq, gt, lt, gte, lte.",
    },
    orderBy: {
      type: "array",
      itemType: {
        type: "object",
        fields: {
          fieldName: "string",
          direction: {
            type: "choice",
            options:  [
              {label: "Ascending",value: "asc"}, 
              {label: "Descending",value: "desc"}
            ],
          },
        },
      },
      displayName: "Order by",
      description:
        "Columns to order the results by during the query.",
    },
    limit: {
      type: "number",
      step: 1,
      min: 0,
      required: false,
      description: 'Number of records to fetch',
      advanced: true,
    },
    offset: {
      type: "number",
      step: 1,
      min: 0,
      required: false,
      description: 'Number of records to skip',
      advanced: true,
    },
    returnCount: {
      type: "choice",
      options: ["none", "exact", "planned", "estimated"],
      defaultValue: "none",
      required: false,
      description: 'Count algorithm to use to count rows in the table or view. `"none"`: Don\'t return a count. `"exact"`: Exact but slow count algorithm. Performs a `COUNT(*)` under the hood. `"planned"`: Approximated but fast count algorithm. Uses the Postgres statistics under the hood. `"estimated"`: Uses exact count for low numbers and planned count for high numbers.',
      advanced: true,
    },
    onError: {
      type: "eventHandler",
      argTypes: [{name: 'supabaseProviderError', type: 'object'}],
      required: false,
      description: 'Event handler for when an error occurs with fetch or mutate of data. Within this handler you can access the error that occured via the variable "supabaseProviderError"'
    },
    skipServerSidePrefetch: {
      type: "boolean",
      required: false,
      defaultValue: false,
      description: `
        In the standard configuration of Plasmic (NextJS + Loader API), Plasmic will prefetch data form Supabase on the server before the page containing the SupabaseProvider is rendered (if data is not in cache).
        If data is in cache, the stale data will be used (no server-side fetch), before the client-side refetch is triggered.
        This behaviour is normally desirable because of the SEO benefits.
        However, if you wish to disable server-side prefetch, you can set this prop to TRUE.`,
      advanced: true
    },
    addDelayForTesting: {
      type: "boolean",
      required: false,
      defaultValue: false,
      description: `
        Whether to add a 1 second delay when fetching or mutating data from Supabase. Useful for testing.`,
      advanced: true
    },
    simulateRandomFetchErrors: {
      type: "boolean",
      required: false,
      defaultValue: false,
      description: `
        Whether to simulate random fetch errors when fetching data from Supabase. Useful for testing.`,
      advanced: true
    },
  },
  refActions: {
    refetchRows: {
      description: "refetch rows from the database",
      argTypes: [],
    }
  }
};