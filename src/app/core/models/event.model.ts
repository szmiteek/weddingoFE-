export interface EventItem {
  id: number;
  clientPersonalData: string;
  venue: string;
  date: string;
  email: string;
  phone: string;
  budget: number;
  guests: number;
  price: number;
  comment: string;
  decorationDescription: string | null;
  offerId: number;
}

export interface EventUpdateCommand {
  price?: number;
  comment?: string;
  decorationDescription?: string;
}

export interface EventFilter {
  dateFrom?: string;
  dateTo?: string;
  client?: string;
  venue?: string;
}
