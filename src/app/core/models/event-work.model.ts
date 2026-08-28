export interface EventWork {
  id: number;
  eventId: number;
  employeeId: number;
  workDate: string;
  hoursWorked: number;
  description: string;
}

export interface EventWorkCreateCommand {
  employeeId: number;
  eventId: number;
  workDate: string;
  hoursWorked: number;
  description: string;
}
