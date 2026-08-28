export interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  hourlyRate: number;
}

export interface EmployeeCreateCommand {
  firstName: string;
  lastName: string;
  hourlyRate: number;
}

export interface EmployeeUpdateCommand {
  firstName: string;
  lastName: string;
  hourlyRate: number;
}
