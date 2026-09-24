import { Routes } from '@angular/router';
import { EndpointListComponent } from './components/endpoint-list/endpoint-list.component';

export const ENDPOINTS_ROUTES: Routes = [
  { path: '', component: EndpointListComponent }
];