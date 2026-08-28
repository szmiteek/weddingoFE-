export interface PublicTenantInfo {
  companyName: string;
}

export interface PublicOfferCommand {
  personalData: string;
  email: string;
  phone: string;
  venue: string;
  eventDate: string | null;
  budget: number | null;
  guests: number | null;
  eventType: string[];
  decorationType: string[];
  colors: string;
  description: string;
  mainTableType: string;
  mainTableSeats: string;
  guestsTableType: string;
  flowersType: string;
  honeypot: string;
}
