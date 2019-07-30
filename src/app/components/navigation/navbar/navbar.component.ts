import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {TranslateService} from '@ngx-translate/core';

import {AccountService} from '../../../services/account.service';
import {AuthDialogComponent} from '../../auth-dialog/auth-dialog.component';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnInit {

  @Output() public sidenavToggle = new EventEmitter();

  public isAuthenticated;
  public languages;

  constructor(
    private account: AccountService,
    private dialog: MatDialog,
    public translate: TranslateService) {

    this.isAuthenticated = false;
    this.languages = this.translate.getLangs();
    this.account.isUserAuthenticatedObservable.subscribe(state => this.isAuthenticated = state);
  }

  ngOnInit() {
  }

  public onToggleSidenav() {
    this.sidenavToggle.emit();
  }

  public openLoginDialog() {
    this.dialog.open(AuthDialogComponent);
  }
}
