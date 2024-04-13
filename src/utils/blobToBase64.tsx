export default function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
          // Ensure the result is a string before proceeding
          if (typeof reader.result === 'string') {
              // The result includes the data URL, which is the base64 representation of the file
              const dataUrl = reader.result;
              // Extract the base64 data from the data URL
              const base64Data = dataUrl.split(',')[1];
              resolve(base64Data);
          } else {
              // Reject the promise if the result is not a string
              reject(new Error('The file could not be read as a base64 string.'));
          }
      };
      reader.onerror = (error) => {
          reject(error);
      };
      reader.readAsDataURL(blob);
  });
}
