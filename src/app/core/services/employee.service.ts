import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Employee, EmployeeCreateCommand, EmployeeUpdateCommand } from '../models/employee.model';
import { Page } from '../models/page.model';

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/employee`;

  getAll(page: number, size = 15): Observable<Page<Employee>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<Page<Employee>>(this.baseUrl, { params });
  }

  create(command: EmployeeCreateCommand): Observable<Employee> {
    return this.http.post<Employee>(this.baseUrl, command);
  }

  update(id: number, command: EmployeeUpdateCommand): Observable<Employee> {
    return this.http.put<Employee>(`${this.baseUrl}/${id}`, command);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
