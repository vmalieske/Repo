import { Component, OnInit, Inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatSlideToggle,
  MatDialogRef,
} from '@angular/material';

import { baseAddress } from '../../metadata/base-objects';
import { IUserData } from '../../../interfaces';
import { MongoHandlerService } from '../../../services/mongo-handler.service';

@Component({
  selector: 'app-upload-application-dialog',
  templateUrl: './upload-application-dialog.component.html',
  styleUrls: ['./upload-application-dialog.component.scss'],
})
export class UploadApplicationDialogComponent implements OnInit {
  public uploadApplicationForm = new FormGroup({
    prename: new FormControl('', Validators.required),
    surname: new FormControl('', Validators.required),
    mail: new FormControl('', Validators.required),

    institution: new FormControl(''),
    university: new FormControl(''),
    address: baseAddress(false),

    motivation: new FormControl('', Validators.required),
  });

  constructor(
    private mongo: MongoHandlerService,
    @Inject(MAT_DIALOG_DATA) public data: IUserData | undefined,
    private dialogRef: MatDialogRef<UploadApplicationDialogComponent>,
  ) {}

  get prename() {
    return this.uploadApplicationForm.get('prename') as FormControl;
  }

  get surname() {
    return this.uploadApplicationForm.get('surname') as FormControl;
  }

  get mail() {
    return this.uploadApplicationForm.get('mail') as FormControl;
  }

  get address() {
    return this.uploadApplicationForm.get('address') as FormGroup;
  }

  ngOnInit() {
    if (this.data) {
      this.prename.patchValue(this.data.prename);
      this.surname.patchValue(this.data.surname);
      this.mail.patchValue(this.data.mail);
    } else {
      this.dialogRef.close();
    }
  }

  public trySend() {
    if (!this.uploadApplicationForm.valid) {
      return;
    }
    const val = this.uploadApplicationForm.getRawValue();
    const {
      motivation,
      prename,
      surname,
      mail,
      institution,
      university,
      address,
    } = val;

    this.mongo
      .sendUploadApplicationMail({
        subject: `[UPLOAD] ${prename} ${surname} - ${mail}`,
        mailbody: `
Upload application request
Prename: ${prename}
Surname: ${surname}
Mail:    ${mail}
-
Motivation:
  ${motivation}
-
Institution: ${institution}
University:  ${university}
Address:     ${address.country}
             ${address.postcode} ${address.city}
             ${address.street} ${address.number}
             ${address.building}`.trim(),
      })
      .then(result => {
        console.log(result);
        if (result.status === 'ok') {
          this.dialogRef.close();
        } else {
          throw new Error(result.message);
        }
      })
      .catch(error => {
        console.error(error);
      });
  }
}