import { Component, AfterViewInit } from '@angular/core';
import { MatStepper, MatStep, MatSelectChange } from '@angular/material';
import { StepperSelectionEvent } from '@angular/cdk/stepper';
import { Router } from '@angular/router';

import { ILDAPData } from '../../../interfaces';
import { AccountService } from '../../../services/account.service';
import { UploadHandlerService } from '../../../services/upload-handler.service';
import { ObjectIdService } from '../../../services/object-id.service';
import { UuidService } from '../../../services/uuid.service';
import {
  baseAddress,
  baseExternalId,
  baseExternalLink,
  baseDimension,
  baseCreation,
  baseInstitution,
  basePerson,
  baseEntity,
  baseDigital,
  basePhysical,
  basePlace,
} from '../../metadata/base-objects';
import { MongoHandlerService } from '../../../services/mongo-handler.service';
import { ContentProviderService } from '../../../services/content-provider.service';
import { IEntity, IFile } from '../../../interfaces';
import { mock } from '../../../../assets/mock';

@Component({
  selector: 'app-add-entity-wizard',
  templateUrl: './add-entity-wizard.component.html',
  styleUrls: ['./add-entity-wizard.component.scss'],
})
export class AddEntityWizardComponent implements AfterViewInit {
  // public UploadResult: any | undefined = JSON.parse(mock.upload);
  public UploadResult: any | undefined;
  // public SettingsResult: any | undefined = JSON.parse(mock.settings);
  public SettingsResult: any | undefined;

  // The entity gets validated inside of the metadata/entity component
  // but we also keep track of validation inside of the wizard
  public entity: any = { ...baseEntity(), ...baseDigital() };
  public isEntityValid = false;
  public entityMissingFields: string[] = [];

  public serverEntity: IEntity | undefined;

  // Enable linear after the entity has been finished
  public isLinear = false;
  // While waiting for server responses, block further user interaction
  public isFinishing = false;
  public isFinished = false;

  public isChoosingPublishState = true;

  // Data of the current user, used to load existing digital entities
  public userData: ILDAPData | undefined;

  constructor(
    public uploadHandler: UploadHandlerService,
    private account: AccountService,
    private uuid: UuidService,
    private mongo: MongoHandlerService,
    private router: Router,
    private content: ContentProviderService,
    private objectId: ObjectIdService,
  ) {
    window.onmessage = async message => {
      const type = message.data.type;
      switch (type) {
        case 'resetQueue':
          const didQueueReset = await this.uploadHandler.resetQueue();
          if (didQueueReset) {
            this.SettingsResult = undefined;
            this.UploadResult = undefined;
            this.uuid.reset();
          }
          break;
        case 'addFile':
          this.uploadHandler.addToQueue(message.data.file);
          break;
        case 'fileList':
          console.log(message.data);
          this.uploadHandler.addMultipleToQueue(message.data.files);
          this.uploadHandler.setMediaType(message.data.mediaType);
          break;
        case 'settings':
          this.SettingsResult = message.data.settings;
          break;
        default:
          console.log(message.data);
      }
    };

    this.uploadHandler.$UploadResult.subscribe(
      result => (this.UploadResult = result),
    );

    this.account.userDataObservable.subscribe(
      newUserData => (this.userData = newUserData),
    );
  }

  ngAfterViewInit() {}

  public selectExistingEntity = (event: MatSelectChange) => {
    // Take existing as base but replace all entity _id's
    const entity = event.value;
    entity._id = this.objectId.generateEntityId();
    for (let i = 0; i < entity.phyObjs.length; i++) {
      entity.phyObjs[i]._id = this.objectId.generateEntityId();
    }
    this.entity = this.content.walkEntity(entity);
  };

  public validateUpload = () =>
    this.UploadResult !== undefined && this.UploadResult.status === 'ok';

  public validateEntity() {
    this.entityMissingFields.splice(0, this.entityMissingFields.length);
    let isValid = true;

    const validateObject = (obj: any) => {
      for (const property in obj) {
        if (!obj.hasOwnProperty(property)) {
          continue;
        }
        const current = obj[property];
        const value = current.value;
        const isRequired = current.required;
        const isArray = Array.isArray(value);
        const isString = typeof value;
        // Skip non-required strings
        // Additional Typechecking is in place because
        // we are not using any TypeScript checking here
        if (!isRequired && !isArray && isString) {
          continue;
        }

        // If we have an array, walk over its entries
        if (isArray) {
          const isEmpty = (value as any[]).length === 0;
          // Check for isEmpty and isRequired
          // because there are optional arrays that can contain
          // objects that _are_ required
          if (isEmpty && isRequired) {
            this.entityMissingFields.push(`${property} can't be empty`);
            isValid = false;
          } else {
            for (const element of value as any[]) {
              validateObject(element);
            }
          }
        } else if (isString) {
          const isEmpty =
            (value as string).length === 0 || (value as string) === '';
          if (isEmpty) {
            this.entityMissingFields.push(`${property} can't be empty`);
            isValid = false;
          }
        } else {
          console.log('Unknown hit in validation', property, current);
        }
      }
    };

    // Walk over every property of entity
    validateObject(this.entity);
    this.isEntityValid = isValid;
    this.validationEntityToJSONEntity();
    return this.isEntityValid;
  }

  public validationEntityToJSONEntity() {
    const resultEntity = this.content.convertValidationEntityToJSON(
      this.entity,
    );
    return resultEntity;
  }

  public JSONEntityToValidationEntity() {
    const _parsed = JSON.parse(mock.json);
    const _base = this.content.walkEntity(_parsed);
    console.log('JSON entity parsed to validation Entity:', _base);
    this.entity = (_base as unknown) as any;
    this.validateEntity();
  }

  public stringify(input: any) {
    return JSON.stringify(input);
  }

  // Finalize the Entity
  public canFinish() {
    return (
      this.isEntityValid &&
      this.SettingsResult !== undefined &&
      this.UploadResult !== undefined &&
      this.UploadResult.status === 'ok'
    );
  }

  public async tryFinish(stepper: MatStepper, lastStep: MatStep) {
    if (this.isFinishing) {
      console.log('Already trying to finish entity');
      return;
    }
    this.isLinear = true;
    this.isFinishing = true;
    console.log(
      'Entity:',
      this.entity,
      'Settings:',
      this.SettingsResult,
      'Upload:',
      this.UploadResult,
    );
    const digitalEntity = { ...this.validationEntityToJSONEntity() };
    this.serverEntity = await this.mongo
      .pushDigitalEntity(digitalEntity)
      .then(result => {
        console.log('Got DigitalEntity from server:', result);
        const files = (this.UploadResult.files as IFile[]).sort(
          (a, b) => b.file_size - a.file_size,
        );
        const entity: IEntity = {
          _id: '',
          name: result.title,
          annotationList: [],
          files: this.UploadResult.files,
          settings: this.SettingsResult,
          finished: true,
          online: false,
          mediaType: this.uploadHandler.mediaType,
          dataSource: {
            isExternal: false,
            service: 'kompakkt',
          },
          relatedDigitalEntity: {
            _id: result._id,
          },
          relatedEntityOwners: [],
          whitelist: {
            enabled: false,
            persons: [],
            groups: [],
          },
          processed: {
            raw: files[0].file_link,
            high: files[Math.floor((files.length * 1) / 3)].file_link,
            medium: files[Math.floor((files.length * 2) / 3)].file_link,
            low: files[files.length - 1].file_link,
          },
        };
        console.log('Saving entity to server:', entity);
        return entity;
      })
      .then(entity => this.mongo.pushEntity(entity))
      .then(result => {
        console.log('Saved entity to server', result);
        return result;
      })
      .catch(e => {
        console.error(e);
        return undefined;
      });

    if (this.serverEntity) {
      this.isFinishing = false;
      this.isFinished = true;
      this.isLinear = true;

      lastStep.completed = true;
      stepper.next();
      stepper._steps.forEach(step => (step.editable = false));
    } else {
      // TODO: Error handling
      this.isFinishing = false;
      this.isLinear = false;
    }
  }

  public publishEntity() {
    if (this.serverEntity) {
      this.serverEntity.online = true;
      this.mongo
        .pushEntity(this.serverEntity)
        .then(updatedEntity => {
          this.isChoosingPublishState = false;
          if (updatedEntity.status === 'ok') {
            // TODO: alert user that publishing was success
            this.serverEntity = updatedEntity;
          } else {
            throw new Error(
              `Failed updating entity: ${JSON.stringify(updatedEntity)}`,
            );
          }
        })
        .catch(e => {
          console.error(e);
        });
    }
  }

  public navigateToFinishedEntity() {
    if (this.serverEntity) {
      this.router
        .navigate([`/entity/${this.serverEntity._id}`])
        .then(() => {})
        .catch(e => console.error(e));
    }
  }

  // Steps require interaction before they can be completed
  // but some steps might be correct out of the box.
  // mark steps as interacted with on selection
  public stepInteraction(event: StepperSelectionEvent) {
    event.selectedStep.interacted = true;
  }
}
