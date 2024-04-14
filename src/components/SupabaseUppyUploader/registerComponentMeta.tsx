//Plasmic
import { CodeComponentMeta } from "@plasmicapp/host";
import type { SupabaseUppyUploaderProps } from ".";


//Define the registration metatdata for plasmic studio
export const SupabaseUppyUploaderMeta : CodeComponentMeta<SupabaseUppyUploaderProps> = {
  name: "SupabaseUppyUploader",
  props: {
    bucketName: {
      type: "string",
      description: "The name of the supabase storage bucket to upload to. Warning: changing this propr will cause Uppy to re-initialize. Avoid making it dynamic",
    },
    folder: {
      type: "string",
      description: "The folder within the bucket to upload to (leave blank if you want to upload to the root of the bucket). Warning: changing this propr will cause Uppy to re-initialize. Avoid making it dynamic"
    },
    avoidNameConflicts: {
      type: "choice",
      defaultValue: "Each file in unique subfolder",
      options: ["Each file in unique subfolder", "Uid in front of filename", "None"],
      description: "Whether to add a unique ID in front of the filename before uploading to Supabase Storage. This is useful to prevent conflicts if users upload files with the same name.",
    },
    initialFilePaths: {
      type: 'array',
      description: `
        Initial files that already exist in Supabase Storage, to pre-populate the Uploader with. 
        The specified paths MUST be RELATIVE to the bucket AND folder (if specified) that you configured the Uploader with.
        Eg if you have existing files at "someBucket/someFolder/file1.jpg" & "someBucket/someFolder/SUB_FOLDER/file2.jpg",
        and the uploader is configured with bucketName of "someBucket" and folder of "someFolder", 
        You would pass an initialValue of ["file1.jpg", "SUB_FOLDER/file2.jpg"] to download & display these in the Uploader.`
    },
    theme: {
      type: "choice",
      defaultValue: "light",
      options: ["light", "dark", "auto"],
      description: "The theme (light or dark) of the Uppy uploader dashboard. Warning: changing this propr will cause Uppy to re-initialize. Avoid making it dynamic"
    },
    showDoneButton: {
      type: "boolean",
      defaultValue: true,
      description:
        "Whether to show the done button in the Uppy uploader dashboard. You can define what happens when the done button is clicked by adding an interaction action 'onDoneButtonClick'. Warning: changing this propr will cause Uppy to re-initialize. Avoid making it dynamic",
    },
    width: {
      type: "number",
      description: "The width of the Uppy uploader dashboard in px. Warning: changing this propr will cause Uppy to re-initialize. Avoid making it dynamic",
    },
    height: {
      type: "number",
      description: "The height of the Uppy uploader dashboard in px. Warning: changing this propr will cause Uppy to re-initialize. Avoid making it dynamic",
    },
    maxNumberOfFiles: {
      type: "number",
      defaultValue: 10,
      description: "The maximum number of files that can be uploaded",
    },
    minNumberOfFiles: {
      type: "number",
      defaultValue: 1,
      description: "The minimum number of files that must be uploaded",
    },
    maxFileSize: {
      type: "number",
      defaultValue: 1000000,
      description: "The maximum size of each file in bytes",
    },
    minFileSize: {
      type: "number",
      defaultValue: 0,
      description: "The minimum size of each file in bytes",
    },
    allowedFileTypes: {
      type: "string",
      description:
        "A comma separated list of file types that are allowed (which we will convert to an array and provide to Uppy see uppy docs -> restrictions https://uppy.io/docs/uppy/#restrictions). To allow all file types unset this value.",
    },
    allowMultipleUploadBatches: {
      type: "boolean",
      defaultValue: true,
      description:
        "Whether to allow multiple batches of files to be uploaded. Eg the user uploads a batch, then another batch later.",
    },
    autoProceed: {
      type: "boolean",
      defaultValue: true,
      description:
        "Whether to automatically start uploading files once they are added",
    },
    showProgressDetails: {
      type: "boolean",
      defaultValue: true,
      description:
        "Whether to show progress details in the Uppy uploader dashboard. Warning: changing this propr will cause Uppy to re-initialize. Avoid making it dynamic",
    },
    showRemoveButtonAfterComplete: {
      type: "boolean",
      defaultValue: true,
      description:
        "Whether to show the remove button after a file has been uploaded. Warning: changing this propr will cause Uppy to re-initialize. Avoid making it dynamic",
    },
    deleteFromSupabaseStorageOnRemove: {
      type: "boolean",
      defaultValue: true,
      description:
        "Whether to delete the file from Supabase Storage when the user removes it from the uploader interface (clicks 'X'). Note that deletion is not awaited and errors are not handled.",
    },
    onDoneButtonClick: {
      type: "eventHandler",
      argTypes: [],
      description:
        "Action to take when the done button is clicked in the Uppy uploader dashboard",
    },
    onStatusChange: {
      type: "eventHandler",
      argTypes: [
        {
          name: "status",
          type: "string",
        },
      ],
    },
    onValueChange: {
      type: "eventHandler",
      argTypes: [
        {
          name: "value",
          type: "object",
        },
      ],
    },
    onInitialFileLoadResultChange: {
      type: "eventHandler",
      argTypes: [
        {
          name: "value",
          type: "object",
        },
      ],
    },
    loading: {
      type: "slot",
      defaultValue: {
        type: "text",
        value: "Loading...",
      },
    }
  },
  states: {
    value: {
      type: "readonly",
      variableType: "object",
      onChangeProp: 'onValueChange',
      initVal: {
        "rawFilesData": [],
        "numSucceeded": 0,
        "numFailed": 0,
        "numAnyStatus": 0,
        "successfulFiles": []
      },
    },
    status: {
      type: "readonly",
      variableType: "text",
      onChangeProp: 'onStatusChange',
      initVal: "empty"
    },
    initialFileLoadResult: {
      type: "readonly",
      variableType: "object",
      onChangeProp: 'onInitialFileLoadResultChange',
      initVal: []
    }
  },
  refActions: {
    removeFile: {
      description: "Remove a file from the Uppy uploader, based on the File ID created by Uppy. Will NOT delete the file from Supabase.",
      argTypes: [
        {
          name: "fileID",
          type: "string",
        },
      ],
    },
    cancelAll: {
      description: "Cancel all uploads. Will NOT delete files from Supabase",
      argTypes: [],
    },
    reset: {
      description: "Reset the Uppy instance.",
      argTypes: [],
    }
  },
  importPath: "./index",
};