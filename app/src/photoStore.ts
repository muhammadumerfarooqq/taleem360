// Holds the one photo taken on the Scan screen until the Fetching screen sends it to recognize().
// In memory only: nothing is stored on the device and nothing is kept after the page closes.
let pending: Blob | null = null

export function setPhoto(photo: Blob): void {
  pending = photo
}

export function getPhoto(): Blob | null {
  return pending
}

export function clearPhoto(): void {
  pending = null
}
