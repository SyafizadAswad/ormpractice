import { Routes } from '@angular/router';
import { IssuesBenchmarkComponent } from './features/issues/issues-benchmark.component';

export const routes: Routes = [
  { path: '', component: IssuesBenchmarkComponent },
  { path: '**', redirectTo: '' },
];
