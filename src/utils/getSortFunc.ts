export type SortDirection = "asc" | "desc";
export type SortFuncType = (a: any, b: any) => number;
export type GetSortFunc = (
  fieldName: string,
  direction: SortDirection
) => SortFuncType;

const getSortFunc: GetSortFunc = (fieldName, direction) => {
  return function (a, b) {
    let valA = a[fieldName];
    let valB = b[fieldName];

    //if field vals are string, convert to lowercase
    if (typeof valA === "string") {
      valA = valA.toLowerCase();
    }

    if (typeof valB === "string") {
      valB = valB.toLowerCase();
    }

    //Sort
    if (direction === "asc") {
      return valA > valB ? 1 : -1;
    } else {
      return valA < valB ? 1 : -1;
    }
  };
};

export default getSortFunc;