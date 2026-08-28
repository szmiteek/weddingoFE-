export interface EventElement {
  id: number;
  offerId: number | null;
  eventId: number | null;
  name: string;
  quantity: number;
  unitPrice: number;
  sum: number;
}

/** Exactly one of offerId / eventId is sent — the element belongs to an offer or to an event. */
export interface EventElementCreateCommand {
  offerId?: number;
  eventId?: number;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface EventElementUpdateCommand {
  name: string;
  quantity: number;
  unitPrice: number;
}
