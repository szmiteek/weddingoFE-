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
  availableFields: OfferInfoFieldOption[];
  maxInfoFields: number;
}

export interface OfferSettingsUpdateCommand {
  backgroundColor: string;
  orientation: PdfOrientation;
  infoFields: string[];
}
