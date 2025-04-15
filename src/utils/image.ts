import { readFile, BaseDirectory } from "@tauri-apps/plugin-fs";

export const isImage = (fileName: string): boolean => {
  const ext = fileName.split(".").pop()?.toLowerCase();
  return (
    ext === "jpg" ||
    ext === "jpeg" ||
    ext === "png" ||
    ext === "gif" ||
    ext === "bmp" ||
    ext === "webp"
  );
};

/**
 * Loads an image file from disk and returns a data URL
 * @param {string} imagePath - The absolute path to the image file
 * @param {string} mimeType - The MIME type of the image (e.g., 'image/png', 'image/jpeg')
 * @returns {Promise<string>} A promise that resolves to a data URL for the image
 */
export async function loadImageDataUrl(
  imagePath: string,
  mimeType = "image/png"
) {
  try {
    // Read the image as binary data
    const fileBytes = await readFile(imagePath, {
      baseDir: BaseDirectory.Home,
    }); // Convert the binary data to a Blob and then to a data URL using FileReader
    const blob = new Blob([fileBytes], { type: mimeType });
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error loading image file:", error);
    throw error;
  }
}

export const getImageMime = (fileName: string): string => {
  const ext = fileName.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "gif":
      return "image/gif";
    case "bmp":
      return "image/bmp";
    default:
      return "image/png";
  }
};
