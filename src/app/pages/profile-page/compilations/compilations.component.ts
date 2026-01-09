import { AsyncPipe } from '@angular/common';
import {
  Component,
  computed,
  ElementRef,
  inject,
  input,
  QueryList,
  signal,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { RouterLink } from '@angular/router';
import { combineLatest, map, switchMap } from 'rxjs';

import { GridElementComponent } from 'src/app/components/grid-element/grid-element.component';
import { SelectionContainerComponent } from 'src/app/components/selection/selection-container.component';
import { TranslatePipe } from 'src/app/pipes';
import {
  AccountService,
  BackendService,
  DialogHelperService,
  SnackbarService,
} from 'src/app/services';
import { CacheManagerService } from 'src/app/services/cache-manager.service';
import { SelectionService } from 'src/app/services/selection.service';
import { AddCompilationWizardComponent } from 'src/app/wizards';
import { Collection, ICompilation, isCompilation } from 'src/common';

@Component({
  selector: 'app-profile-compilations',
  templateUrl: './compilations.component.html',
  styleUrls: ['./compilations.component.scss'],
  standalone: true,
  imports: [
    MatChipsModule,
    GridElementComponent,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    RouterLink,
    MatDividerModule,
    MatSlideToggleModule,
    FormsModule,
    TranslatePipe,
    AsyncPipe,
    SelectionContainerComponent,
  ],
})
export class ProfileCompilationsComponent {
  #cache = inject(CacheManagerService);
  #account = inject(AccountService);
  #dialog = inject(MatDialog);
  #backend = inject(BackendService);
  #helper = inject(DialogHelperService);
  #rootSelectionService = inject(SelectionService);
  #selectionContainerSignal = signal<SelectionContainerComponent | undefined>(undefined);
  #snackbar = inject(SnackbarService);

  @ViewChildren('gridItem', { read: ElementRef }) gridItems!: QueryList<ElementRef>;
  @ViewChild('sc') set selectionContainer(container: SelectionContainerComponent | undefined) {
    this.#selectionContainerSignal.set(container);
  }

  showPartakingCompilations = signal(false);
  showPartakingCompilations$ = toObservable(this.showPartakingCompilations);

  searchText = input<string>('');
  searchText$ = toObservable(this.searchText);

  public selectionService = computed<SelectionService>(
    () => this.#selectionContainerSignal()?.selectionService ?? this.#rootSelectionService,
  );

  userCompilations$ = this.#account.compilationsWithEntities$.pipe(
    map(compilations => compilations.filter(c => isCompilation(c))),
  );

  partakingCompilations$ = this.#account.user$.pipe(
    switchMap(() =>
      this.#cache.getItem<ICompilation[]>('profile-partaking-compilations', () =>
        this.#backend.findUserInCompilations(),
      ),
    ),
  );

  filteredCompilations$ = combineLatest(
    this.searchText$,
    this.showPartakingCompilations$,
    this.userCompilations$,
    this.partakingCompilations$,
  ).pipe(
    map(([text, showPartaking, userCompilations, partakingCompilations]) => {
      const compilations = showPartaking ? partakingCompilations : userCompilations;
      if (!compilations || compilations.length === 0) return { empty: true, results: [] };
      if (!text || text.trim().length === 0) return { empty: false, results: compilations };
      text = text.trim().toLowerCase();
      return {
        empty: false,
        results: compilations.filter(c =>
          ((c.__normalizedName || c.name) + c.description)
            .toLowerCase()
            .includes(text.toLowerCase()),
        ),
      };
    }),
  );

  filteredCompilationsSignal = toSignal(this.filteredCompilations$);
  user = toSignal(this.#account.user$);

  readonly singleSelectedCompilation = computed(() =>
    this.selectionService().singleSelectedCompilation(),
  );

  public openCompilationCreation(compilation?: ICompilation) {
    const dialogRef = this.#dialog.open(AddCompilationWizardComponent, {
      data: compilation,
      disableClose: true,
    });
    dialogRef
      .afterClosed()
      .toPromise()
      .then((result: undefined | ICompilation) => {
        this.#account.updateTrigger$.next(Collection.compilation);
      });
  }

  public async removeCompilationDialog(compilation: ICompilation) {
    const loginData = await this.#helper.confirmWithAuth(
      `Do you really want to delete ${compilation.name}?`,
      `Validate login before deleting: ${compilation.name}`,
    );
    if (!loginData) return;
    const { username, password } = loginData;

    // Delete
    this.#backend
      .deleteRequest(compilation._id, 'compilation', username, password)
      .then(result => {
        this.#account.updateTrigger$.next(Collection.compilation);
      })
      .catch(e => console.error(e));
  }

  //Selection

  public isSelected(compilation: ICompilation): boolean {
    return this.selectionService().isSelected(compilation);
  }

  public addCompilationToSelection(compilation: ICompilation, event: MouseEvent) {
    this.selectionService().addToSelection(compilation, event);
  }

  onMouseDown(event: MouseEvent) {
    const target = event.target as HTMLElement;

    const hasSelectionBoxParent = !!target.closest('.selection');
    const hasForbiddenTagName = ['BUTTON', 'INPUT', 'MAT-ICON', 'MAT-MENU-ITEM'].includes(
      target.tagName,
    );
    if (hasSelectionBoxParent || hasForbiddenTagName) {
      return;
    }

    if (!event.shiftKey && !event.ctrlKey) {
      this.selectionService().onMouseDown(event);
    }
  }

  onMouseMove(event: MouseEvent) {
    this.selectionService().onMouseMove(event);
  }

  onMouseUp() {
    const selectionRect = this.selectionService().getCurrentBoxRect();
    this.selectionService().stopDragging();
    if (!selectionRect) return;

    const user = this.user();
    if (!user?._id) {
      this.#snackbar.showMessage('You must be logged in to select entities.', 5);
      return;
    }

    console.log(this.gridItems);

    const compElementPairs =
      this.filteredCompilationsSignal()?.results.map((element, index) => ({
        element,
        htmlElement: this.gridItems.get(index)?.nativeElement as HTMLElement,
      })) || [];

    this.selectionService().selectEntitiesInRect(selectionRect, compElementPairs);
  }
}
