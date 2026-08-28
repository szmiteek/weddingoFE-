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

export interface OfferPdfOverrides {
  date: string;
  venue: string;
  guests: number | null;
  colors: string;
  mainTable: string;
  guestsTable: string;
  flowers: string;
  description: string;
}

export interface OfferFilter {
  createdDateFrom?: string;
  createdDateTo?: string;
  eventDateFrom?: string;
  eventDateTo?: string;
  client?: string;
  venue?: string;
}
