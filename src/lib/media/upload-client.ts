export type UploadMediaResult = {
  id: string;
  url: string;
  width: number | null;
  height: number | null;
  alt: string;
  mimeType: string | null;
  filename: string | null;
  sizeBytes?: number | null;
  folder?: string | null;
};

/**
 * Upload one file via XMLHttpRequest so we get upload progress events.
 * Posts to /api/admin/upload (not a Server Action — avoids the 1MB body limit).
 */
export function uploadMediaViaApi(
  file: File,
  alt: string,
  options?: {
    folder?: string;
    onProgress?: (percent: number) => void;
    signal?: AbortSignal;
  },
): Promise<UploadMediaResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/upload");
    xhr.withCredentials = true;

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !options?.onProgress) return;
      const percent = Math.min(100, Math.round((event.loaded / event.total) * 100));
      options.onProgress(percent);
    };

    xhr.onload = () => {
      let payload: { error?: string; media?: UploadMediaResult } = {};
      try {
        payload = JSON.parse(xhr.responseText) as typeof payload;
      } catch {
        /* non-JSON body */
      }

      if (xhr.status >= 200 && xhr.status < 300 && payload.media) {
        options?.onProgress?.(100);
        resolve(payload.media);
        return;
      }

      if (xhr.status === 413 || payload.error?.toLowerCase().includes("large")) {
        reject(new Error(payload.error || "File is too large"));
        return;
      }

      if (xhr.status === 0) {
        reject(new Error("Network error. Check your connection and try again."));
        return;
      }

      reject(
        new Error(
          payload.error ||
            (xhr.status === 415
              ? "Unsupported file type"
              : `Upload failed (${xhr.status})`),
        ),
      );
    };

    xhr.onerror = () => {
      reject(new Error("Network error. Check your connection and try again."));
    };

    xhr.onabort = () => {
      reject(new Error("Upload cancelled"));
    };

    if (options?.signal) {
      if (options.signal.aborted) {
        xhr.abort();
        return;
      }
      options.signal.addEventListener("abort", () => xhr.abort(), { once: true });
    }

    const formData = new FormData();
    formData.set("file", file);
    formData.set("alt", alt);
    formData.set("folder", options?.folder?.trim() || "uploads");
    xhr.send(formData);
  });
}
