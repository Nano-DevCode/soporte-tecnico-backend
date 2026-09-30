export interface IPdfResult {
  fileName: string;
  url: string;
  bucket:
    | 'avatars'
    | 'images-tickets'
    | 'pdfs'
    | 'images'
    | 'pdfs-response'
    | 'pdfs-request'
    | 'excels'
    | 'tools-images'
    | 'it-assets-images'
    | 'images-consumable';
}
