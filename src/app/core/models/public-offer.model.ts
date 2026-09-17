export interface PublicTenantInfo {
  companyName: string;
  /** Whether the tenant uploaded a logo in their offer settings — it shows at the top of the form. */
  hasLogo: boolean;
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
  appetizersOnTable: boolean | null;
  honeypot: string;
}
