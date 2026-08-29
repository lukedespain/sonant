'use client';

/**
 * A failed call to one of the upload endpoints.
 *
 * `uploadGone` is the server saying it is no longer holding the audio, which
 * tells the caller that retrying with the same upload ticket cannot work and a
 * whole new upload is needed. Its absence means the audio may well still be
 * there, so the ticket is worth keeping.
 */
export class UploadRequestError extends Error {
  readonly status: number;
  readonly uploadGone: boolean;

  constructor(message: string, status: number, uploadGone: boolean) {
    super(message);
    this.name = 'UploadRequestError';
    this.status = status;
    this.uploadGone = uploadGone;
  }
}

/** POST JSON and surface the server's own error text rather than a status code. */
export async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let message = '';
    let uploadGone = false;
    try {
      const parsed = (await res.json()) as { error?: string; uploadGone?: boolean };
      message = parsed.error ?? '';
      uploadGone = parsed.uploadGone === true;
    } catch {
      // Nothing parseable came back, so fall through to a generic message.
    }
    throw new UploadRequestError(
      message || `Something went wrong (${res.status}).`,
      res.status,
      uploadGone
    );
  }

  return (await res.json()) as T;
}

function storageErrorMessage(xhr: XMLHttpRequest) {
  try {
    const parsed = JSON.parse(xhr.responseText) as { message?: string; error?: string };
    const raw = parsed.message ?? parsed.error ?? '';
    if (/exceeded the maximum allowed size/i.test(raw)) {
      return 'That file is over the size limit. Bounce a smaller file and try again.';
    }
    if (/mime type/i.test(raw)) return 'That file type is not supported.';
    if (raw) return raw;
  } catch {
    // Storage did not return JSON.
  }
  if (xhr.status === 0) return 'The upload was interrupted. Check your connection and try again.';
  return `The upload failed (${xhr.status}).`;
}

/**
 * Send the file straight to Supabase Storage. XHR rather than fetch because it
 * reports upload progress, and these files can take a while on a slow line.
 */
export function putToSignedUrl(
  signedUrl: string,
  file: File,
  contentType: string,
  onProgress?: (percent: number) => void
) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', signedUrl, true);
    xhr.setRequestHeader('content-type', contentType);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.min(99, Math.round((event.loaded / event.total) * 100)));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
      } else {
        reject(new Error(storageErrorMessage(xhr)));
      }
    };
    xhr.onerror = () =>
      reject(new Error('The upload was interrupted. Check your connection and try again.'));
    xhr.ontimeout = () => reject(new Error('The upload timed out. Please try again.'));

    xhr.send(file);
  });
}
