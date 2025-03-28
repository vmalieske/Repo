import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  MatAutocomplete,
  MatAutocompleteSelectedEvent,
  MatAutocompleteTrigger,
} from '@angular/material/autocomplete';
import {
  MatChipGrid,
  MatChipInput,
  MatChipInputEvent,
  MatChipRemove,
  MatChipRow,
} from '@angular/material/chips';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { filter, map, startWith, tap, withLatestFrom } from 'rxjs/operators';

import { AsyncPipe } from '@angular/common';
import { MatIconButton } from '@angular/material/button';
import { MatButton } from '@angular/material/button';
import { MatOption } from '@angular/material/core';
import { MatFormField, MatHint, MatLabel } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatRadioButton, MatRadioGroup } from '@angular/material/radio';
import { MatTooltip } from '@angular/material/tooltip';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatTabChangeEvent, MatTabsModule } from '@angular/material/tabs';
import {
  CreationTuple,
  DescriptionValueTuple,
  DigitalEntity,
  DimensionTuple,
  FileTuple,
  Institution,
  Person,
  PhysicalEntity,
  PlaceTuple,
  Tag,
  TypeValueTuple,
} from 'src/app/metadata';
import { ContentProviderService, SnackbarService } from 'src/app/services';
import { isDigitalEntity, isPhysicalEntity } from 'src/common';
import { FilesizePipe } from '../../../pipes/filesize.pipe';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { AgentsComponent } from '../agents/agents.component';
import { AgentCardComponent } from '../agents/agent-card/agent-card.component';
import { CreationComponent } from '../optional/creation/creation.component';
import { LinksComponent } from "../optional/links/links.component";
import { PhysObjComponent } from "../optional/phys-obj/phys-obj.component";
import { GeneralComponent } from "../general/general.component";
import { DimensionComponent } from "../optional/dimension/dimension.component";
import { ExternalIdsComponent } from "../optional/external-ids/external-ids.component";
import { BiblioRefComponent } from "../optional/biblio-ref/biblio-ref.component";
import { AgentListComponent } from "../agents/agent-list/agent-list.component";
import { MetadataFilesComponent } from "../optional/metadata-files/metadata-files.component";
import { OptionalCardListComponent } from "../optional/optional-card-list/optional-card-list.component";
import { MetadataCommunicationService } from 'src/app/services/metadata-communication.service';

type AnyEntity = DigitalEntity | PhysicalEntity;

@Component({
  selector: 'app-entity',
  templateUrl: './entity.component.html',
  styleUrls: ['./entity.component.scss'],
  standalone: true,
  imports: [
    MatIcon,
    MatTooltip,
    FormsModule,
    ReactiveFormsModule,
    MatRadioGroup,
    MatRadioButton,
    MatSidenavModule,
    MatListModule,
    MatTabsModule,
    AsyncPipe,
    TranslatePipe,
    CommonModule,
    AgentsComponent,
    CreationComponent,
    LinksComponent,
    PhysObjComponent,
    GeneralComponent,
    DimensionComponent,
    ExternalIdsComponent,
    BiblioRefComponent,
    MetadataFilesComponent,
],
})
export class EntityComponent implements OnChanges {
  @Input('digitalEntity')
  public digitalEntity: DigitalEntity | undefined = undefined;

  @Input('physicalEntity')
  public physicalEntity: PhysicalEntity | undefined = undefined;

  public entitySubject = new BehaviorSubject<AnyEntity | undefined>(undefined);

  // entity$!: Observable<AnyEntity | null>;

  public availableLicences = [
    {
      title: 'CC0',
      src: 'assets/licence/CC0.png',
      description: 'No Rights Reserved (CC0)',
      link: 'https://creativecommons.org/publicdomain/zero/1.0/',
    },
    {
      title: 'PDM',
      src: 'assets/licence/PDM.png',
      description: 'Public Domain Mark 1.0 Universal (PDM 1.0)',
      link: 'https://creativecommons.org/publicdomain/mark/1.0/',
    },
    {
      title: 'BY',
      src: 'assets/licence/BY.png',
      description: 'Attribution 4.0 International (CC BY 4.0)',
      link: 'https://creativecommons.org/licenses/by/4.0',
    },
    {
      title: 'BY-SA',
      src: 'assets/licence/BY-SA.png',
      description: 'Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)',
      link: 'https://creativecommons.org/licenses/by-sa/4.0',
    },
    {
      title: 'BY-ND',
      src: 'assets/licence/BY-ND.png',
      description: 'Attribution-NoDerivatives 4.0 International (CC BY-ND 4.0)',
      link: 'https://creativecommons.org/licenses/by-nd/4.0',
    },
    {
      title: 'BYNC',
      src: 'assets/licence/BYNC.png',
      description: 'Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)',
      link: 'https://creativecommons.org/licenses/by-nc/4.0',
    },
    {
      title: 'BYNCSA',
      src: 'assets/licence/BYNCSA.png',
      description: 'Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)',
      link: 'https://creativecommons.org/licenses/by-nc-sa/4.0',
    },
    {
      title: 'BYNCND',
      src: 'assets/licence/BYNCND.png',
      description: 'Attribution-NonCommercial-NoDerivatives 4.0 International (CC BY-NC-ND 4.0)',
      link: 'https://creativecommons.org/licenses/by-nc-nd/4.0',
    },
    {
      title: 'AR',
      src: 'assets/licence/AR.png',
      description: 'All rights reserved',
      link: 'https://en.wikipedia.org/wiki/All_rights_reserved',
    }
  ];

  selectedTabIndex = 0;

  tabList = ['General', 'Licence', 'Related', 'Dimensions', 'Creation', 'Ids', 'Links', 'References', 'Files', 'Physical'];

  // Public for validation
  public PhysicalEntity = PhysicalEntity;
  public DimensionTuple = DimensionTuple;
  public PlaceTuple = PlaceTuple;
  public CreationTuple = CreationTuple;
  public TypeValueTuple = TypeValueTuple;
  public DescriptionValueTuple = DescriptionValueTuple;
  public Person = Person;
  public Institution = Institution;
  public Tag = Tag;
  public FileTuple = FileTuple;

  public indexString = 'General';

  // Autocomplete Inputs
  public availablePersons = new BehaviorSubject<Person[]>([]);
  public availableInstitutions = new BehaviorSubject<Institution[]>([]);
  public availableTags = new BehaviorSubject<Tag[]>([]);
  public searchPerson = new FormControl('');
  public searchInstitution = new FormControl('');
  public searchAgent = new FormControl('');
  public searchTag = new FormControl('');
  public filteredPersons$: Observable<Person[]>;
  public filteredInstitutions$: Observable<Institution[]>;
  public filteredAgentList$: Observable<(Person | Institution)[]>;
  public filteredTags$: Observable<Tag[]>;
  public separatorKeysCodes: number[] = [ENTER, COMMA];

  constructor(
    public content: ContentProviderService,
    public dialog: MatDialog,
    private snackbar: SnackbarService,
    public metaService: MetadataCommunicationService
  ) {
    (window as any)['printEntity'] = () => console.log(this.entitySubject.value);

    this.content.$Persons.subscribe(persons => {
      this.availablePersons.next(persons.map(p => new Person(p)));
    });

    this.content.$Institutions.subscribe(insts => {
      this.availableInstitutions.next(insts.map(i => new Institution(i)));
    });

    this.content.$Tags.subscribe(tags => {
      this.availableTags.next(tags.map(t => new Tag(t)));
    });

    this.filteredPersons$ = this.searchAgent.valueChanges.pipe(
      startWith(''),
      map(value => (value as string).toLowerCase()),
      map(value => {
        if (!value) {
          return [];
        }
        return this.availablePersons.value.filter(p => p.fullName.toLowerCase().includes(value));
      }),
    );
    this.filteredInstitutions$ = this.searchAgent.valueChanges.pipe(
      startWith(''),
      map(value => (value as string).toLowerCase()),
      map(value => {
        if (!value) {
          return [];
        }
        return this.availableInstitutions.value.filter(i => i.name.toLowerCase().includes(value));
      }),
    );
    this.filteredAgentList$ = combineLatest([
      this.filteredPersons$,
      this.filteredInstitutions$,
    ]).pipe(
      map(([persons, institutions]) => {
        const combinedList = [...persons, ...institutions];
        return combinedList.length > 0 ? combinedList : [];
      }),
    );
    this.filteredTags$ = this.searchTag.valueChanges.pipe(
      startWith(''),
      map(value => (value as string).toLowerCase()),
      withLatestFrom(this.digitalEntity$),
      map(([value, digitalEntity]) =>
        this.availableTags.value
          .filter(t => !digitalEntity.tags.find(tt => tt.value === t.value))
          .filter(t => t.value.toLowerCase().includes(value)),
      ),
    );
  }

  public showSaveMessage() {
    this.snackbar.showInfo('Saved locally!');
  }

  public selectTab(indexString: string) {
    this.selectedTabIndex = this.tabList.findIndex(tab => tab == indexString);
    this.indexString = indexString;
  }

  public async selectTag(event: MatAutocompleteSelectedEvent, digitalEntity: DigitalEntity) {
    const tagId = event.option.value;
    const tag = this.availableTags.value.find(t => t._id === tagId);
    if (!tag) return console.warn(`Could not tag with id ${tagId}`);
    digitalEntity.addTag(tag);
  }

  public displayInstitutionName(institution: Institution): string {
    return institution.name;
  }

  public displayPersonName(person: Person): string {
    return person.fullName;
  }

  public async handleFileInput(fileInput: HTMLInputElement) {
    if (!fileInput.files) return alert('Failed getting files');
    const files: File[] = Array.from(fileInput.files);

    const readfile = (_fileToRead: File) =>
      new Promise<FileTuple | undefined>((resolve, _) => {
        const reader = new FileReader();
        reader.readAsText(_fileToRead);

        reader.onloadend = () => {
          const fileContent = reader.result as string | null;
          if (!fileContent) {
            console.error('Failed reading file content');
            return resolve(undefined);
          }

          const file_name = _fileToRead.name;
          const file_link = fileContent;
          const file_size = _fileToRead.size;
          const file_format = _fileToRead.name.includes('.')
            ? _fileToRead.name.slice(_fileToRead.name.indexOf('.'))
            : _fileToRead.name;

          const file = new FileTuple({
            file_name,
            file_link,
            file_size,
            file_format,
          });

          resolve(file);
        };
      });

    for (const file of files) {
      const metadataFile = await readfile(file);
      if (!metadataFile) continue;
      this.entitySubject.value?.metadata_files.push(metadataFile);
    }
  }

  // Entity access

  get entity$() {
    return this.entitySubject.pipe(
      filter(entity => !!entity),
      map(entity => entity as AnyEntity),
    );
  }

  get _id$() {
    return this.entity$.pipe(map(entity => entity._id.toString()));
  }

  get digitalEntity$() {
    return this.entitySubject.pipe(
      filter(entity => isDigitalEntity(entity)),
      map(entity => entity as DigitalEntity),
    );
  }

  get physicalEntity$() {
    return this.entitySubject.pipe(
      filter(entity => isPhysicalEntity(entity)),
      map(entity => entity as PhysicalEntity),
    );
  }
  // /Entity access

  // Validation
  get generalInformationValid$() {
    return this.entity$.pipe(map(entity => entity.title && entity.description));
  }

  get licenceValid$() {
    return this.digitalEntity$.pipe(map(digitalEntity => digitalEntity.licence));
  }

  get placeValid$() {
    return this.physicalEntity$.pipe(
      map(physicalEntity => PlaceTuple.checkIsValid(physicalEntity.place)),
    );
  }

  get hasRightsOwner$() {
    return this.digitalEntity$.pipe(
      map(digitalEntity => DigitalEntity.hasRightsOwner(digitalEntity)),
    );
  }

  get hasContactPerson$() {
    return this.digitalEntity$.pipe(
      map(digitalEntity => DigitalEntity.hasContactPerson(digitalEntity)),
    );
  }

  get hasCreator$() {
    return this.digitalEntity$.pipe(map(digitalEntity => DigitalEntity.hasCreator(digitalEntity)));
  }

  get rightsOwnerList$() {
    return this.digitalEntity$.pipe(
      map(digitalEntity => DigitalEntity.rightsOwnerList(digitalEntity)),
    );
  }

  get contactPersonList$() {
    return this.digitalEntity$.pipe(
      map(digitalEntity => DigitalEntity.contactPersonList(digitalEntity)),
    );
  }

  get creatorList$() {
    return this.digitalEntity$.pipe(map(digitalEntity => DigitalEntity.creatorList(digitalEntity)));
  }

  get editorList$() {
    return this.digitalEntity$.pipe(map(digitalEntity => DigitalEntity.editorList(digitalEntity)));
  }

  get dataCreatorList$() {
    return this.digitalEntity$.pipe(
      map(digitalEntity => DigitalEntity.dataCreatorList(digitalEntity)),
    );
  }

  get personsValid$() {
    return this.entity$.pipe(
      map(
        entity =>
          undefined === entity.persons.find(p => !Person.checkIsValid(p, entity._id.toString())),
      ),
    );
  }

  get institutionsValid$() {
    return this.entity$.pipe(
      map(
        entity =>
          undefined ===
          entity.institutions.find(i => !Institution.checkIsValid(i, entity._id.toString())),
      ),
    );
  }

  get dimensionsValid$() {
    return this.digitalEntity$.pipe(
      map(entity => undefined === entity.dimensions.find(d => !DimensionTuple.checkIsValid(d))),
    );
  }

  get creationValid$() {
    return this.digitalEntity$.pipe(
      map(entity => undefined === entity.creation.find(c => !CreationTuple.checkIsValid(c))),
    );
  }

  get externalIdValid$() {
    return this.entity$.pipe(
      map(entity => undefined === entity.externalId.find(c => !TypeValueTuple.checkIsValid(c))),
    );
  }

  get externalLinkValid$() {
    return this.entity$.pipe(
      map(
        entity =>
          undefined === entity.externalLink.find(c => !DescriptionValueTuple.checkIsValid(c)),
      ),
    );
  }

  get biblioRefsValid$() {
    return this.entity$.pipe(
      map(
        entity =>
          undefined === entity.biblioRefs.find(c => !DescriptionValueTuple.checkIsValid(c, false)),
      ),
    );
  }

  get otherValid$() {
    return this.entity$.pipe(
      map(entity => undefined === entity.other.find(c => !DescriptionValueTuple.checkIsValid(c))),
    );
  }

  get metadataFilesValid$() {
    return this.entity$.pipe(
      map(entity => undefined === entity.metadata_files.find(c => !FileTuple.checkIsValid(c))),
    );
  }

  // get phyObjsValid$() {
  //   return this.digitalEntity$.pipe(
  //     map(entity => undefined === entity.phyObjs.find(p => !PhysicalEntity.checkIsValid(p))),
  //   );
  // }

  phyObjsValid() {
    return (this.physicalEntity?.title === '' && this.physicalEntity?.description === '' && this.physicalEntity?.place.name === '' && (this.physicalEntity?.persons.length ?? 0) === 0) ||
    (this.physicalEntity?.title !== '' && this.physicalEntity?.description !== '' && this.physicalEntity?.place.name !== '' && (this.physicalEntity?.persons.length ?? 0) !== 0);
  }

  // get phyObjEmpty$() {
  //   return this.digitalEntity$.pipe(
  //     map(entity => (entity.phyObjs[0].persons.length === 0) && entity.phyObjs[0].title === '' && entity.phyObjs[0].description === '',
  //   ));
  // }

  // isPerson(agent: Person | Institution): agent is Person {
  //   return (agent as Person).fullName !== undefined;
  // }

  // isInstitution(agent: Person | Institution): agent is Institution {
  //   return (agent as Institution).addresses !== undefined;
  // }
  // /Validation

  objectKeys(obj: any): string[] {
    return Object.keys(obj);
  }

  public addDiscipline(event: MatChipInputEvent, digitalEntity: DigitalEntity) {
    const discipline = event.value;
    digitalEntity.discipline.push(discipline);
    event.input.value = '';
  }

  public addTag(event: MatChipInputEvent, digitalEntity: DigitalEntity) {
    const tagText = event.value;
    const tag = new Tag();
    tag.value = tagText;
    digitalEntity.addTag(tag);
    this.searchTag.patchValue('');
    this.searchTag.setValue('');
    event.input.value = '';
  }

  public addSimpleProperty(event: MouseEvent, entity: AnyEntity, property: string) {
    event.preventDefault();
    event.stopPropagation();
    if (isDigitalEntity(entity)) {
      switch (property) {
        case 'dimensions':
          return entity.dimensions.push(new DimensionTuple());
        case 'creation':
          return entity.creation.push(new CreationTuple());
        case 'tags':
          return entity.tags.push(new Tag());
        case 'phyObjs':
          return entity.phyObjs.push(new PhysicalEntity());
      }
    }
    switch (property) {
      case 'persons':
        return entity.persons.push(this.content.addLocalPerson(new Person()));
      case 'institutions':
        return entity.institutions.push(this.content.addLocalInstitution(new Institution()));
      case 'externalId':
        return entity.externalId.push(new TypeValueTuple());
      case 'externalLink':
        return entity.externalLink.push(new DescriptionValueTuple());
      case 'biblioRefs':
        return entity.biblioRefs.push(new DescriptionValueTuple());
      case 'other':
        return entity.other.push(new DescriptionValueTuple());
      case 'metadata_files':
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.hidden = true;
        document.body.appendChild(input);
        input.onchange = () => this.handleFileInput(input).then(() => input.remove());
        input.click();
        return;
    }
  }

  // public removeAgentRole(
  //   entity: AnyEntity,
  //   property: string,
  //   role: string,
  //   entityId: string,
  //   agentId: string,
  // ) {
  //   if (Array.isArray(entity[property])) {
  //     const currentAgent = entity[property].find(agent => agent._id == agentId);
  //     const roleIndex = currentAgent.roles[entityId].indexOf(role);
  //     if (roleIndex > -1) {
  //       currentAgent.roles[entityId].splice(roleIndex, 1);
  //     }

  //     if (currentAgent.roles[entityId].length == 0) {
  //       const agentIndex = entity[property].indexOf(currentAgent);
  //       entity[property].splice(agentIndex, 1)[0];
  //     }
  //   }
  // }

  public removeProperty(entity: AnyEntity, property: string, index: number) {
    if (Array.isArray(entity[property])) {
      const removed = entity[property].splice(index, 1)[0];
      if (!removed) {
        return console.warn('No item removed');
      }
      // No reason to remove locally created persons and institutions
      /*if (isPerson(removed) || isInstitution(removed)) {
        if (property === 'persons' && removed) {
          this.content.removeLocalPerson(removed as Person);
        } else if (property === 'institutions' && removed) {
          this.content.removeLocalInstitution(removed as Institution);
        }
      }*/
    } else {
      console.warn(`Could not remove ${property} at ${index} from ${entity}`);
    }
  }

  public removeValueFromProperty(entity: AnyEntity, data: any) {
    const { property, index } = data;

    this.removeProperty(entity, property, index);

    //delete a value within a property
    // if (Array.isArray(entity[property])) {
    //   const targetObject = entity[property][index];
    //   targetObject[propertyKey] = '';

    //   const allValuesEmpty = Object.values(targetObject).every(value => value === '');

    //   if (allValuesEmpty) {
    //     entity[property].splice(index, 1);
    //   }
    // }
  }

  ngOnChanges(changes: SimpleChanges) {
    const digitalEntity = changes.digitalEntity?.currentValue as DigitalEntity | undefined;

    // this.entity$ = this.metaService.getSelectedEntity$(this.entityId);

    // const physicalEntity = changes.physicalEntity?.currentValue as PhysicalEntity | undefined;

    // console.log(digitalEntity, physicalEntity);

    if (digitalEntity) this.entitySubject.next(digitalEntity);

    // this.physicalEntity = digitalEntity?.phyObjs[0] as PhysicalEntity | undefined;

    // if (this.physicalEntity) this.entitySubject.next(this.physicalEntity);

    // if (!digitalEntity && !physicalEntity) this.entitySubject.next(new DigitalEntity());

    if (!digitalEntity) this.entitySubject.next(new DigitalEntity());

    this.metaService.physicalEntity$.subscribe(physObj => {
      this.physicalEntity = physObj;
    });
  }
}
