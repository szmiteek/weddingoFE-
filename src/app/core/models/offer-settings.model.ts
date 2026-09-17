export type PdfOrientation = 'LANDSCAPE' | 'PORTRAIT';

export interface OfferInfoFieldOption {
  key: string;
  label: string;
}

export interface OfferSettings {
  /** Page background as #RRGGBB. */
  backgroundColor: string;
  orientation: PdfOrientation;
  /** Fields printed on the "Informacje ogólne" page, in the order the tenant arranged them. */
  infoFields: string[];
  hasLogo: boolean;
  /** The tenant's own PDF that the generated pages are appended to. */
  hasCoverPdf: boolean;
  coverPdfFilename: string | null;
  coverPdfPages: number | null;
  availableFields: OfferInfoFieldOption[];
  maxInfoFields: number;
}

export interface OfferSettingsUpdateCommand {
  backgroundColor: string;
  orientation: PdfOrientation;
  infoFields: string[];
}
