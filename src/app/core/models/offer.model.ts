export type OfferStatus = 'NOT_READY' | 'READY' | 'SENT' | 'SIGNED';

export interface Offer {
  id: number;
  createdDate: string;
  personalData: string;
  venue: string;
  eventDate: string;
  email: string;
  phone: string;
  budget: number;
  guests: number;
  price: number | null;
  comment: string | null;
  status: OfferStatus;
  eventType: string[] | null;
  afterWeddingParty: boolean;
  mainTableType: string | null;
  mainTableSeats: string | null;
  guestsTableType: string | null;
  appetizersOnTable: boolean;
  decorationType: string[] | null;
  flowersType: string | null;
  colors: string | null;
  description: string | null;
  decorationDescription: string | null;
  pdfGeneratedDate: string | null;
}

export interface OfferUpdateCommand {
  personalData?: string;
  venue?: string;
  eventDate?: string;
  email?: string;
  phone?: string;
  budget?: number;
  guests?: number;
  comment?: string;
  price?: number;
  eventType?: string[];
  afterWeddingParty?: boolean;
  mainTableType?: string;
  mainTableSeats?: string;
  guestsTableType?: string;
  appetizersOnTable?: boolean;
  decorationType?: string[];
  flowersType?: string;
  colors?: string;
  description?: string;
  decorationDescription?: string;
}

export interface OfferUpdateStatusCommand {
  status: OfferStatus;
}

/** A field of the PDF's "Informacje ogólne" page, pre-filled from the offer. */
export interface OfferPdfField {
  key: string;
  label: string;
  value: string;
}

/** Values edited in the PDF modal — used for the generated file only. */
export interface OfferPdfOverrides {
  fields: Record<string, string>;
  decorationDescription: string;
}

export interface OfferFilter {
  createdDateFrom?: string;
  createdDateTo?: string;
  eventDateFrom?: string;
  eventDateTo?: string;
  client?: string;
  venue?: string;
}
