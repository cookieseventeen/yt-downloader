import { Routes } from '@angular/router';
import { SearchComponent } from './search/search.component';
import { HistoryComponent } from './history/history.component';
import { LibraryComponent } from './library/library.component';
import { LinkParserComponent } from './link-parser/link-parser.component';
import { OperationsComponent } from './operations/operations.component';
import { authGuard } from '../core/services/auth.guard';

export default [
  { path: '', redirectTo: 'search', pathMatch: 'full' as const },
  { path: 'search', component: SearchComponent },
  { path: 'parser', component: LinkParserComponent },
  { path: 'history', component: HistoryComponent },
  { path: 'library', component: LibraryComponent },
  { path: 'operations', component: OperationsComponent, canActivate: [authGuard] },
] as Routes;
