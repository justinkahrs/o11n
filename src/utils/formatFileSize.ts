export function formatFileSize(size: number): string {
  // The size parameter is provided in MB
  if (size < 1 / 1024) {
    // For extremely small sizes, convert MB to bytes (1 MB = 1048576 bytes)
    const bytes = size * 1048576;
    return `${Math.floor(bytes)} bytes`;
  }
  if (size < 1) {
    // For sizes less than 1 MB, convert MB to KB (1 MB = 1024 KB)
    const kb = size * 1024;
    return `${kb.toFixed(2)} KB`;
  }
  return `${size.toFixed(2)} MB`;
}