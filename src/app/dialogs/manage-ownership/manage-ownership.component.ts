import { Component, inject, Inject, OnInit, signal } from '@angular/core';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MAT_DIALOG_DATA, MatDialog, MatDialogClose, MatDialogRef } from '@angular/material/dialog';

import { MatIconButton } from '@angular/material/button';
import { MatOption } from '@angular/material/core';
import { MatFormField } from '@angular/material/form-field';
import {MatButtonModule} from '@angular/material/button';
import { MatIcon, MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatList, MatListItem, MatListModule } from '@angular/material/list';
import { AccountService, BackendService, DialogHelperService } from 'src/app/services';
import { IEntity, IStrippedUserData } from 'src/common';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { MatSelectModule } from '@angular/material/select';
import {
  BehaviorSubject,
  catchError,
  combineLatestWith,
  filter,
  from,
  map,
  of,
  startWith,
  switchMap,
} from 'rxjs';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-manage-ownership',
  standalone: true,
  imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatIconButton,
        MatDialogClose,
        MatIconModule,
        MatFormField,
        MatInputModule,
        MatAutocompleteModule,
        MatSelectModule,
        MatTooltipModule,
        TranslatePipe,
  ],
  templateUrl: './manage-ownership.component.html',
  styleUrl: './manage-ownership.component.scss'
})
export class ManageOwnershipComponent {
  private dialog = inject(MatDialog);
  private data: IEntity = structuredClone(this.element);
  private backend = inject(BackendService);
  private account = inject(AccountService);
  private helper = inject(DialogHelperService);

  public searchControl = new FormControl('');
  public searchFocused = false;

  public isMulti: boolean = false;
  public multiEntityTooltip: string = "";
  public targetOwner = signal<IStrippedUserData | undefined>(undefined);

  public entity$ = new BehaviorSubject<IEntity | undefined>(undefined);
  private entityOwnerChanges$ = new BehaviorSubject<
    {
      action: 'add' | 'remove';
      user: IStrippedUserData;
    }[]
  >([]);
  public entityOwners$ = this.entity$.pipe(
    filter((obj): obj is IEntity => !!obj?._id),
    switchMap(({ _id }) => this.backend.findEntityOwners(_id.toString())),
    catchError(err => {
      console.error('Failed fetching entity owners', err);
      return of<IStrippedUserData[]>([]);
    }),
    combineLatestWith(this.entityOwnerChanges$),
    map(([owners, changes]) => {
      changes.forEach(({ action, user }) => {
        if (action === 'add') owners.push(user);
        else owners = owners.filter(_u => _u._id !== user._id);
      });
      return owners;
    }),
  );
  public strippedUser$ = this.account.strippedUser$;

  public allAccounts$ = from(this.backend.getAccounts()).pipe(
    catchError(err => {
      console.error('Failed fetching accounts', err);
      return of<IStrippedUserData[]>([]);
    }),
  );
  public filteredAccounts$ = this.allAccounts$.pipe(
    combineLatestWith(
      this.searchControl.valueChanges.pipe(
        startWith(''),
        map(value => (typeof value === 'string' ? value.toLowerCase().trim() : ''))
      ),
      // this.entityOwners$,
    ),
    map(([accounts, search, /*currentOwners*/]) =>
      accounts
        // .filter(account => !currentOwners.some(owner => owner._id === account._id))
        .filter(account => Object.values(account).join('').toLowerCase().includes(search)),
    ),
  );

  constructor(
      private dialogRef: MatDialogRef<ManageOwnershipComponent>,
      @Inject(MAT_DIALOG_DATA)
      public element: IEntity,
    ){
      console.log(this.element);
    }

  public getEntityCount() {
    if(Array.isArray(this.data)) return this.data.length;

    return null;
  }

  public async userSelected(event: MatAutocompleteSelectedEvent) {
    const newOwner = event.option.value;
    this.targetOwner.set(newOwner);
  }

  public async removeUser() {
    this.targetOwner.set(undefined);
  }

  public async transferUser() {
    //ToDo: commit dialog
    //transfer ownership
    //close window

    if(this.data) {
      console.log(this.data);

      if(!this.targetOwner()) return;

      const loginData = await this.helper.verifyAuthentication(
        'Validate login before saving',
      );
      if(!loginData) return;

      try {
        if(Array.isArray(this.data)) {
          const savePromises = this.data.map(entity => this.saveNewOwner(entity._id));
          await Promise.all(savePromises);
        } else {
          await this.saveNewOwner(this.data._id);
        }

        this.dialogRef.close(this.element);
      } catch (error) {
        console.error('Owner could not be transfered: ', error);
      }
      
    }
  }

private async saveNewOwner(entityId: string) {
  return this.backend.transferOwnerShip(entityId, this.targetOwner()?._id);
}

  public cancel() {
    this.dialogRef.close(false);
  }

  async ngOnInit() {
    this.entity$.next(this.data);

    this.backend.findEntitiesWithAccessRole('owner').then( result => {
      console.log(result);
    })

    if (this.data) {
      console.log("Element: ", this.data);

      if(Array.isArray(this.data)) {
        this.isMulti = true;
        this.data.forEach(entity => {
          this.multiEntityTooltip = this.multiEntityTooltip + entity.name + '\n';
        });
      }
    }
  }
}
