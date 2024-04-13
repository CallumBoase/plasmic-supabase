import type { UppyFile } from '@uppy/core'

//Helper function to get the objectName without first folder
function getObjNameWithoutFirstFolder(objectName: string) {
  const pathWithoutFirstFolder = objectName.split('/').length > 1 ? objectName.split('/').slice(1).join('/') : objectName;
  return pathWithoutFirstFolder;
}

//Helper function format values for return to parent component (onValueChangeCallback)
//We remove the data prop from each file object which is a Blob or File Object (because it causes infinite re-render in Plasmic Studio)
//Then we add some extra information
export default function formatValues(Files: Array<UppyFile> | null | undefined) {
  if (!Files) {
    return null;
  }
  const safeFilesArray = Files.map((file) => {
    //Get all but data prop of file
    const { data, ...allPropsButData } = file;

    return JSON.parse(JSON.stringify(allPropsButData));
    // return allPropsButData;
  });

  const final = {
    rawFilesData: safeFilesArray,
    numSucceeded: safeFilesArray.filter((file) => file.progress?.uploadComplete).length,
    numFailed: safeFilesArray.filter((file) => file.progress?.uploadComplete === false).length,
    numAnyStatus: safeFilesArray.length,
    successfulFiles: safeFilesArray.filter((file) => file.progress?.uploadComplete).map((file) => {
      return {
        bucketName: file.meta.bucketName,
        fileName: file.name,
        path: file.meta.objectName,
        pathWithoutFirstFolder: getObjNameWithoutFirstFolder(file.meta.objectName),
        fullPath: `${file.meta.bucketName}/${file.meta.objectName}`,
      }
    }),
  };

  return final;

}

export type FormattedValues = ReturnType<typeof formatValues>;