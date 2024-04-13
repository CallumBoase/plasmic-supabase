//Helper function to get a fileName from a path like "folder1/folder2/filename.jpg"
export default function getFileNameFromPath(filePath : string) {
  const filePathParts = filePath.split("/")
  const filePathPartsLen = filePathParts.length;
  return filePathPartsLen > 1 ? filePathParts[filePathPartsLen-1] : filePath;
}