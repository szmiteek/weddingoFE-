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
  /** Null oznacza niezapłaconą zaliczkę — z tego wynika pozycja switcha. */
  depositAmount: number | null;
  comment: string;
  decorationDescription: string | null;
  afterWeddingParty: boolean;
  /** Null for an event added by hand — only an event created from a signed offer points at one. */
  offerId: number | null;
}

export interface EventUpdateCommand {
  price?: number;
  /** Wysyłane razem z kwotą — bez tej flagi backend nie odróżnia „bez zmian” od „wyczyść zaliczkę”. */
  depositPaid?: boolean;
  depositAmount?: number | null;
  comment?: string;
  decorationDescription?: string;
}

export interface EventFilter {
  dateFrom?: string;
  dateTo?: string;
  client?: string;
  venue?: string;
}
