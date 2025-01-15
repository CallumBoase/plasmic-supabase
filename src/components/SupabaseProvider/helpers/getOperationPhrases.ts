import type { MutationTypes, ElementActionName } from "../types";

export type GetMutationPhrases = (operation: MutationTypes) => {
  elementActionName: ElementActionName;
  inProgress: string;
  success: string;
  error: string;
};

export const getMutationPhrases: GetMutationPhrases = (operation: MutationTypes) => {
  switch (operation) {
    case "insert":
      return {
        elementActionName: "Add Row",
        inProgress: "Add row in progress",
        success: "Successfully added row",
        error: "Error adding row",
      };
    case "update":
      return {
        elementActionName: "Edit Row",
        inProgress: "Edit row in progress",
        success: "Successfully edited row",
        error: "Error editing row",
      };
    case "delete":
      return {
        elementActionName: "Delete Row",
        inProgress: "Delete row in progress",
        success: "Successfully deleted row",
        error: "Error deleting row",
      };
    case "rpc":
      return {
        elementActionName: "Run RPC",
        inProgress: "Run RPC in progress",
        success: "Successfully ran RPC",
        error: "Error running RPC",
      };
    case "flexibleMutation":
      return {
        elementActionName: "Flexible Mutation",
        inProgress: "Flexible Mutation in progress",
        success: "Successfully ran Flexible Mutation",
        error: "Error running Flexible Mutation",
      };
  }
};