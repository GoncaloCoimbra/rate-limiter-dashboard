import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface ApiKeyItem { id: number; name: string; key?: string; maskedKey: string; status: string; createdAt: string; policyName?: string; }
export interface ClientItem { id: number; name: string; identifier: string; status: string; createdAt: string; }

@Injectable({ providedIn: 'root' })
export class AccessService {
  private readonly http = inject(HttpClient);
  listKeys(): Observable<ApiKeyItem[]> { return this.http.get<ApiKeyItem[]>('/api/keys'); }
  createKey(name: string, policyId: number): Observable<ApiKeyItem> { return this.http.post<ApiKeyItem>('/api/keys', { name, policyId }); }
  revokeKey(id: number): Observable<ApiKeyItem> { return this.http.post<ApiKeyItem>(`/api/keys/${id}/revoke`, {}); }
  deleteKey(id: number): Observable<void> { return this.http.delete<void>(`/api/keys/${id}`); }
  updateKey(id: number, name: string): Observable<ApiKeyItem> { return this.http.put<ApiKeyItem>(`/api/keys/${id}`, { name }); }
  listClients(): Observable<ClientItem[]> { return this.http.get<ClientItem[]>('/api/clients'); }
  createClient(name: string, identifier: string): Observable<ClientItem> { return this.http.post<ClientItem>('/api/clients', { name, identifier }); }
  deleteClient(id: number): Observable<void> { return this.http.delete<void>(`/api/clients/${id}`); }
  updateClient(id: number, name: string, identifier: string): Observable<ClientItem> { return this.http.put<ClientItem>(`/api/clients/${id}`, { name, identifier }); }
}