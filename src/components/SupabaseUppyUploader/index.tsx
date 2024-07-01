//Relevant docs
//Uppy react https://uppy.io/docs/react/
//Uppy core https://uppy.io/docs/uppy/
//Uppy dashboard https://uppy.io/docs/dashboard/
//Supabase Uppy Tus example this is based on https://github.com/supabase/supabase/blob/master/examples/storage/resumable-upload-uppy/README.md

//React
import React, { useEffect, useState, useCallback, forwardRef, useImperativeHandle, Suspense } from "react";

//Uppy - types
//Other Uppy imports done using dynamic import in initUppy due to conflicts with ES modules and Commonjs when compiling this package into commonjs
//Reason: Uppy is not available in commonjs, so we must import it dynamically instead
import type { UppyFile, Uppy } from "@uppy/core";

//Uppy - Dashboard component
//We dynamically import it here because this package is compiled to commonjs so it can be loaded into a nextjs project
//But Uppy does not support import via commonjs require(), so we must instead import it dynamically
//The correct way to dynamically import a React component (with named rather than dynamic export) is this way, combined with
//suspense boundary where the component is used (see bottom)
//The correct way to import non-react components using dynamic imports is to use the await import() method, 
//Which we do for importing non-react-component Uppy dependencies in the initUppy function
//When importing 
const Dashboard = React.lazy(() => import("@uppy/react").then((module) => ({ default: module.Dashboard })));
//https://stackoverflow.com/questions/58791636/can-you-deconstruct-lazily-loaded-react-components

//General utils
import getBearerTokenForSupabase from "../../utils/getBearerTokenForSupabase";
import { v4 as uuid } from "uuid";

//Component-specific utils
import deleteFileFromSupabaseStorage from "./helpers/deleteFileFromSupabaseStorage";
import formatValues, { FormattedValues } from "./helpers/formatValues";
import downloadFilesFromSupabaseAndAddToUppy, {DownloadFilesFromSupabaseAndAddToUppyResult} from "./helpers/downloadFilesFromSupabaseAndAddToUppy";

//Decalre types for element actions
type SupabaseUppyUploaderActions = {
  removeFile: (fileID: string) => void;
  cancelAll: () => void;
  reset: () => void;
}


type Status = "empty" | "uploads processing" | "uploads complete" | "initial files loaded";

//Declare the props type
export type SupabaseUppyUploaderProps = {
  className: string;
  bucketName: string;
  folder?: string;
  avoidNameConflicts: "Each file in unique subfolder" | "Uid in front of filename" | "None";
  initialFilePaths?: Array<string>;
  maxNumberOfFiles?: number;
  minNumberOfFiles?: number;
  maxFileSize?: number;
  minFileSize?: number;
  allowedFileTypes: string | null;
  showProgressDetails: boolean;
  showRemoveButtonAfterComplete: boolean;
  deleteFromSupabaseStorageOnRemove: boolean;
  allowMultipleUploadBatches: boolean;
  autoProceed: boolean;
  width?: number;
  height?: number;
  theme: "light" | "dark" | "auto";
  showDoneButton: boolean;
  onDoneButtonClick: () => void;
  onStatusChange: (status: Status) => void;
  onValueChange: (value: FormattedValues) => void;
  onInitialFileLoadResultChange: (value: DownloadFilesFromSupabaseAndAddToUppyResult) => void;
  loading: React.ReactNode;
};

//Helper function to init uppy
export async function initUppy(
  supabaseProjectURL: string,
  bearerToken: string,
  supabaseAnonKey: string
) {

  //Dyanmic import statements for Uppy since it does not support commonjs require() and we are compiling this package to commonjs
  //Importing this way avoids errors when using the package in a nextjs app
  const { default: Uppy } = await import("@uppy/core");
  const { default: Tus } = await import("@uppy/tus");

  const supabaseStorageURL = `${supabaseProjectURL}/storage/v1/upload/resumable`;

  var uppy = new Uppy().use(Tus, {
    endpoint: supabaseStorageURL,
    headers: {
      authorization: `Bearer ${bearerToken}`,
      apikey: supabaseAnonKey,
      "x-upsert": "false",
    },
    uploadDataDuringCreation: true,
    chunkSize: 6 * 1024 * 1024,
    allowedMetaFields: [
      "bucketName",
      "objectName",
      "contentType",
      "cacheControl",
    ],
  });

  return uppy;
}

//The component
export const SupabaseUppyUploader = forwardRef<SupabaseUppyUploaderActions, SupabaseUppyUploaderProps>(
  function SupabaseUppyUploader({
    className,
    bucketName,
    folder,
    avoidNameConflicts,
    initialFilePaths,
    maxNumberOfFiles,
    minNumberOfFiles,
    maxFileSize,
    minFileSize,
    allowedFileTypes,
    showProgressDetails,
    showRemoveButtonAfterComplete,
    deleteFromSupabaseStorageOnRemove,
    allowMultipleUploadBatches,
    autoProceed,
    showDoneButton,
    onDoneButtonClick,
    width,
    height,
    theme,
    onStatusChange,
    onValueChange,
    onInitialFileLoadResultChange,
    loading
  }: SupabaseUppyUploaderProps, ref) {

    //States
    const [ready, setReady] = useState(false);
    const [initialFileLoadStarted, setInitialFileLoadStarted] = useState(false);
    const [initialFileLoadCompleted, setInitialFileLoadCompleted] = useState(false);
    const [uppy, setUppy] = useState<Uppy | null>();
    const [reset, setReset] = useState<number>(Math.random());
    
    //Create state for initialFilePaths that will NEVER change, so we don't re-render if it changes
    const [initialFilePathsState] = useState(initialFilePaths);

    //Callbacks from the various prop functions that can be passed in by Plasmic to expose value/state to parent component
    const onValueChangeCallback = useCallback(onValueChange, [onValueChange]);
    const onStatusChangeCallback = useCallback(onStatusChange, [onStatusChange]);
    const onInitialFileLoadResultChangeCb = useCallback(onInitialFileLoadResultChange, [onInitialFileLoadResultChange]);

    //Callback to run when a file is added to Uppy
    const fileAddedHandler = useCallback((_file: UppyFile) => {
      //Expose new status and value to parent component
      onValueChangeCallback(formatValues(uppy?.getFiles()));

      if(ready) {
        //If this was a file added by the user, set status to "uploads processing"
        onStatusChangeCallback("uploads processing");
      } else {
        //Otherwise it was a file added as an initial value during initialization
        //So do not update the status since we are still in the initialization stage
      }
    }, [uppy, onStatusChangeCallback, onValueChangeCallback, ready]);

    //Callback for when a file is removed from Uppy
    const fileRemovedHandler = useCallback(async (file: UppyFile, reason: string) => {

      //Get the current files from Uppy
      const files = uppy?.getFiles();

      //We remove the file from Uppy instantly and run the delete API call in the background
      //Reason: we shouldn't force users to wait for file deletion and we won't force them to care about deletion errors
      //Report the new value back to the parent component
      onValueChangeCallback(formatValues(files));

      //Set status based on files remaining after we remove this one
      //Note that Uppy does not consider itself to be In Progress during file removal, and we are OK with this
      if(!files || files.length === 0) {
        //If there are no more files left, set status back to "No file uploaded yet"
        onStatusChangeCallback("empty");
      } else if(uppy?.getObjectOfFilesPerState().isAllComplete) {
        //If there are more files, and none are in progress, set status to "uploads complete"
        onStatusChangeCallback("uploads complete");
      } else {
        //If there are more files, and some are in progress, no action needed
      }

      //Determine if it's appropriate to run the API call to delete the file from Supabase Storage
      const shouldDelete = 
        reason === "removed-by-user" &&
        deleteFromSupabaseStorageOnRemove &&
        //Only delete if the file has been uploaded successfully previously, otherwise it may be a failed upload due to file named same already existing on server
        file.progress?.uploadComplete;

      //Delete file from Supabase if appropriate (without waiting for result or telling the user about errors)
      if (shouldDelete) {
        try {
          await deleteFileFromSupabaseStorage(bucketName, file.meta.objectName as string);
        } catch(err) {
          //We don't do anything useful with the error here because we aren't making the user wait for deletion or fix errors
          console.log('error from supabase in file removal', err)
        }
      }
    }, [bucketName, deleteFromSupabaseStorageOnRemove, uppy, onValueChangeCallback, onStatusChangeCallback]);

    //Callback for when Uppy has completed uploading files (whether successful or not)
    const completeHandler = useCallback(() => {
      //Report the new value back to the parent component
      onValueChangeCallback(formatValues(uppy?.getFiles()));

      //Determine which status to set
      if(ready) {
        //Normal occurence of file upload completion - a file added by user finished uploading
        onStatusChangeCallback("uploads complete");
      } else {
        //An initial file that we downloaded and added to Uppy became "completed" during Initialization stage
        if(initialFileLoadCompleted) {
          //If all initial files have now completed
          //Set the status to "initial files loaded" and set ready to true, indicating that next time a 
          //file complete event occurs, it will be due to a user uploading a file
          onStatusChangeCallback("initial files loaded");
          setReady(true);
        } else {
          //If all initial files have NOT yet completed, no action needed
          //Wait until all have completed and then take the above action
        }
      }
    }, [uppy, ready, initialFileLoadCompleted, onValueChangeCallback, onStatusChangeCallback]);

    //Callback to run when various processing events occur in Uppy
    const runOnvalueChangeCallback = useCallback(() => {
      //Report the new value back to the parent component
      onValueChangeCallback(formatValues(uppy?.getFiles()));
    }, [uppy, onValueChangeCallback]);

    //SETUP UPPY ON INITIAL RENDER
    useEffect(() => {

      //Get the bearer token for Supabase, which will be used to authenticate Supabase Storage API calls done by Uppy.Tus plugin
      //Reason: we're using raw http requests for the api calls not supabaseJS, hence we need to manually get the token
      getBearerTokenForSupabase().then(async (token) => {
        //Initialize Uppy
        const uppy = await initUppy(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          token,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        setUppy(uppy)

      });

    }, [reset])

    //Once uppy is Initialized, download initial files from Supabse and add to the Uppy instance
    //But only do this ONCE
    useEffect(() => {

      //Uppy not Initialized, so do nothing
      if(!uppy) return;

      //The component is already ready (we've run this before), so do nothing
      if(ready === true) return;

      //The initial file load has already started, so do nothing
      if(initialFileLoadStarted) return;

      //There's no initial files to download, so set ready and do nothing
      if(!initialFilePathsState) {
        setReady(true);
        return;
      }

      //There is initial files to download from Supabase and we should begin the initial download
      //Do that and then set ready
      setInitialFileLoadStarted(true);

      downloadFilesFromSupabaseAndAddToUppy(initialFilePathsState, uppy, bucketName, folder)
      .then((result) => {
        console.log('result', result)
        //Report the new initialFileLoadResult value back to the parent component
        onInitialFileLoadResultChangeCb(result);
        // if(result.length > 0 && result.some(file => file.downloadSucceeded)) {
        //   //Report the new status and value back to the parent component
        //   onStatusChangeCallback("initial files loaded");
        //   onValueChangeCallback(formatValues(uppy.getFiles()));
        // }
        //Indicate that all initial files have now been loaded into Uppy
        setInitialFileLoadCompleted(true);
        //Trigger the completeHandler one more time, to set status, value and ready appropriately
        completeHandler();
        // runOnvalueChangeCallback();
        // setReady(true);
      });

    }, [uppy, initialFilePathsState, bucketName, folder, ready, initialFileLoadStarted, onValueChangeCallback, onInitialFileLoadResultChangeCb, completeHandler]);

    //Before a file is added to Uppy, setup Supabase metatadata (which is needed for upload to supabase via Tus plugin)
    //Optionally help manage duplicate file conflicts in Supabase Storage by doing one of the following (as specified by user):
    //-Add a unique ID in front of the filename OR
    //-Add each file to a unique subfolder
    //For extended notes see ./helpers/notes.md
    useEffect(() => {
      uppy?.setOptions({
        onBeforeFileAdded: (file) => {

          //Get the original ID generated by Uppy for ths new file
          const originalIdFromUppy = file.id;

          //Check there's no IDENTICAL file already in the instace of the Uppy uploader
          //This normally happens automatically in Uppy based on Uppy's generated file.id (which will be the same for identical files from the same source)
          //However, we sometimes must modify file.id below for other reasons
          //When we modify file.id, we store the original in file.meta.originalIdFromUppy
          //Therefore, to prevent IDENTICAL files in same instance of Uppy, we do this check manually using file.meta.originalIdFromUppy
          const identicalFileAlreadyInUppy = uppy.getFiles().some(file => file.meta.originalIdFromUppy === originalIdFromUppy);
          if(identicalFileAlreadyInUppy){
            uppy.info('You have already added this file, so we skipped it. If you need to re-upload the file, remove it first then try again.', 'error', 3000);
            return false;
          }

          //If this was triggered from downloading an initial file
          //Set the ID to the custom-id we stored in the metadata in downloadFilesFromSupabaseAndAddToUppy.tsx
          //And don't add any further metadata, because this was set based on Supabase storage info
          //in downloadFilesFromSupabaseAndAddToUppy.tsx
          if(file.meta.isInitialValueDownload === true) {
            //We only need to modify the ID
            file.id = file.meta.originalIdFromUppy as string;
            return file;
          }

          //Generate a uid
          const uid = uuid();

          //Setup the common file metadata for Supabase (that is the same between all options below)
          const commonSupabaseMeta = {
            bucketName: bucketName,
            contentType: file.type,
          }

          if(avoidNameConflicts === "None" || !avoidNameConflicts) {
            //When not adding any UID to the filename
            //Prepare the file object for Uppy
            const modifiedFile = {
              //The normal file data
              ...file,
              //Add more file metadata
              meta: {
                //The original metadata
                ...file.meta,
                //Common supabaseMeta data
                ...commonSupabaseMeta,
                //Objectname for Supabase based on folder and filename
                objectName: folder ? `${folder}/${file.name}` : `${file.name}`,
                //The original ID for this file as generated by Uppy (even though we didn't modify it in this scenario)
                originalIdFromUppy: originalIdFromUppy,
              }
            }
            return modifiedFile;

          } else if (avoidNameConflicts === "Uid in front of filename") {
            //When adding a UID in front of the file name

            //Generate the modified filename
            const fileName = `${uid}_${file.name}`;

            //Prepare the file object for Uppy
            const modifiedFile = {
              //The normal file data
              ...file,
              //Modify the Uppy-generated file.id to our UID
              id: uid,
              //Modify the file name to include our UID
              name: fileName,
              //Add file metadata
              meta: {
                //The original metadata
                ...file.meta,
                //Add the common supabase metadata
                ...commonSupabaseMeta,
                //Objectname for Supabase based on folder and our uid_filename
                objectName: folder ? `${folder}/${fileName}` : `${fileName}`,
                //Another place we must set our modified filename
                name: `${fileName}`,
                //Store the original ID generated by Uppy
                originalIdFromUppy: originalIdFromUppy,
              }
            }
            return modifiedFile;

          } else if (avoidNameConflicts === "Each file in unique subfolder") {
            //When adding each file to a unique subfolder

            //Generate our final path within the bucket and optional folder specified by props
            //Adding a subfolder with the UID
            const folderFinal = folder ? `${folder}/${uid}` : uid;
            const pathFinal = `${folderFinal}/${file.name}`;

            //Prepare the file object for Uppy
            const modifiedFile = {
              //The normal file data
              ...file,
              //Modify the Uppy-generated file.id to our UID
              id: uid,
              //Add file metadata
              meta: {
                //The original metadata
                ...file.meta,
                //Add the common supabase metadata
                ...commonSupabaseMeta,
                //Objectname for Supabase based on our final path including uid folder
                objectName: pathFinal,
                //Store the original ID generated by Uppy
                originalIdFromUppy: originalIdFromUppy,
              },
            }
            return modifiedFile;
          }
        }
      })
    }, [uppy, bucketName, folder, avoidNameConflicts])

    //When various option props change, update the Uppy instance with the new options
    useEffect(() => {
      if (uppy) {
        uppy.setOptions({
          restrictions: {
            maxNumberOfFiles: maxNumberOfFiles || 10,
            minNumberOfFiles: minNumberOfFiles || 1,
            maxFileSize: maxFileSize || 1000000,
            minFileSize: minFileSize || 0,
            allowedFileTypes: allowedFileTypes?.split(/,\s*/) || null,
          },
          allowMultipleUploadBatches: allowMultipleUploadBatches,
          autoProceed: autoProceed,
        });
      }
    }, [
      maxNumberOfFiles,
      minNumberOfFiles,
      maxFileSize,
      minFileSize,
      allowedFileTypes,
      allowMultipleUploadBatches,
      autoProceed,
      uppy,
    ]);

    //Add callbacks to Uppy to keep the parent component up-to-date with values and customise behaviour of Uppy
    //These will be cleaned up when the component unmounts or when one of the dependencies changes
    useEffect(() => {
      
      if (uppy) {

        //When a file is first added
        uppy.on("file-added", fileAddedHandler);
        
        //Various progress events
        uppy.on("upload", runOnvalueChangeCallback);
        uppy.on("upload-progress", runOnvalueChangeCallback);
        uppy.on("progress", runOnvalueChangeCallback);
        uppy.on("upload-success", runOnvalueChangeCallback);
        uppy.on("error", runOnvalueChangeCallback);
        uppy.on("upload-error", runOnvalueChangeCallback);
        uppy.on("upload-retry", runOnvalueChangeCallback);
        uppy.on("retry-all", runOnvalueChangeCallback);
        uppy.on("restriction-failed", runOnvalueChangeCallback);
        uppy.on("reset-progress", runOnvalueChangeCallback);

        //All operations are complete - update value + processing to false
        uppy.on("complete", completeHandler);

        //When a file is removed
        uppy.on("file-removed", fileRemovedHandler);
      }

      //Cleanup old event listeners before re-adding new ones
      return () => {
        if (uppy) {
          uppy.off("file-added", fileAddedHandler);
          uppy.off("upload-progress", runOnvalueChangeCallback);
          uppy.off("upload", runOnvalueChangeCallback);
          uppy.off("progress", runOnvalueChangeCallback);
          uppy.off("upload-success", runOnvalueChangeCallback);
          uppy.off("error", runOnvalueChangeCallback);
          uppy.off("upload-error", runOnvalueChangeCallback);
          uppy.off("upload-retry", runOnvalueChangeCallback);
          uppy.off("retry-all", runOnvalueChangeCallback);
          uppy.off("restriction-failed", runOnvalueChangeCallback);
          uppy.off("reset-progress", runOnvalueChangeCallback);
          uppy.off("complete", completeHandler);
          uppy.off("file-removed", fileRemovedHandler);
        }
      }
    }, [uppy, fileAddedHandler, fileRemovedHandler, completeHandler, runOnvalueChangeCallback]);

    //When dashboard options change, reset the Uppy instance
    //Reason: the props changing do not otherwise show up until unmount and re-initializing of the component
    //which is bad UX in Plasmic studio, because live updates to those props are therefore not visible as user changes them
    useEffect(() => {
      setReset(Math.random());
      setReady(false);
    }, [width, height, theme, showDoneButton, showProgressDetails, showRemoveButtonAfterComplete]);

    //Define element actions to run from Plasmic studio
    useImperativeHandle(
      ref,
      () => {
        return {
          removeFile: (fileID: string) => {
            uppy?.removeFile(fileID);
          },
          cancelAll: () => {
            uppy?.cancelAll({reason: 'user'});
          },
          reset: () => {
            setReset(Math.random());
            setReady(false);
            setInitialFileLoadCompleted(false);
            setInitialFileLoadStarted(false);
          }
        };
      }
    )

    //Render loading slot when necessary
    if (!ready) {
      return(<div className={className}>{loading}</div>);
    }

    //Render the uploader
    return (
      <Suspense fallback={loading}>
        <div className={className}>
          <Dashboard
            uppy={uppy as Uppy}
            proudlyDisplayPoweredByUppy={false}
            width={width}
            height={height}
            showProgressDetails={showProgressDetails}
            showRemoveButtonAfterComplete={showRemoveButtonAfterComplete}
            //If showDoneButton is false, pass in undefined as the doneButtonHandler (which hides the Done button as per Uppy docs)
            //Otherwise show the done button and run a custom handler if the user has defined one
            doneButtonHandler={!showDoneButton ? undefined : () => {
              //Run whatever custom handler the user has defined
              onDoneButtonClick();
            }}
            theme={theme}
          />
        </div>
      </Suspense>
    );
  }
);
