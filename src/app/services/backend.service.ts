import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import {
  Collection,
  ICompilation,
  IDigitalEntity,
  IEntity,
  IFile,
  IGroup,
  IInstitution,
  IPerson,
  IStrippedUserData,
  ITag,
  IUserData,
} from 'src/common';
import { environment } from 'src/environment';

enum ETarget {
  contact = 'contact',
  upload = 'upload',
  bugreport = 'bugreport',
}

interface ISendMailRequest {
  subject: string;
  mailbody: string;
  target?: ETarget;
}

export enum SortOrder {
  name = 'name',
  popularity = 'popularity',
  usage = 'usage',
  annotations = 'annotations',
  newest = 'newest',
}

interface IExploreRequest {
  searchEntity: boolean;
  types: string[];
  filters: {
    annotatable: boolean;
    annotated: boolean;
    restricted: boolean;
    associated: boolean;
  };
  searchText: string;
  offset: number;
  sortBy: SortOrder;
  reversed: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class BackendService {
  private endpoint = environment.server_url;

  constructor(private http: HttpClient) {}

  private async get(path: string): Promise<any> {
    return firstValueFrom(this.http.get(`${this.endpoint}${path}`));
  }

  private async post(path: string, obj: any): Promise<any> {
    return firstValueFrom(this.http.post(`${this.endpoint}${path}`, obj));
  }

  // GETs
  public async getAllEntities(): Promise<IEntity[]> {
    return this.get(`api/v1/get/findall/${Collection.entity}`);
  }

  public async getAllPersons(): Promise<IPerson[]> {
    return this.get(`api/v1/get/findall/${Collection.person}`);
  }

  public async getAllInstitutions(): Promise<IInstitution[]> {
    return this.get(`api/v1/get/findall/${Collection.institution}`);
  }

  public async getAllTags(): Promise<ITag[]> {
    return this.get(`api/v1/get/findall/${Collection.tag}`);
  }

  public async getEntity(identifier: string): Promise<IEntity> {
    return this.get(`api/v1/get/find/${Collection.entity}/${identifier}`);
  }

  public async getEntityMetadata(identifier: string): Promise<IDigitalEntity> {
    return this.get(`api/v1/get/find/${Collection.digitalentity}/${identifier}`);
  }

  public async getAllCompilations(): Promise<ICompilation[]> {
    return this.get(`api/v1/get/findall/${Collection.compilation}`);
  }

  // USER PROFILE ROUTES

public async getProfileByIdOrName(idOrName: string | number): Promise<any> {
  return this.get(`api/v2/user-data/profile/${idOrName}`);
}

public async getCurrentUserProfile(): Promise<any> {
  return this.get('api/v2/user-data/profile');
}

public async updateUserProfile(profileData: any): Promise<any> {
  return this.post('api/v2/user-data/profile', profileData);
}

// INSTITUTION PROFILE ROUTES

public async createInstitutionProfile(profileData: any): Promise<any> {
  return this.post('api/v2/institution/profile', profileData);
}

public async updateInstitutionProfile(id: string, profileData: any): Promise<any> {
  return this.post(`api/v2/institution/profile/${id}`, profileData);
}

  /**
   * Fetch a resolved compilation by it's identifier
   * @param  {string}  identifier Database _id of the compilation
   * @param  {string}  password   (Optional) Password of the compilation
   * @param  {[type]}             [description]
   * @return {Promise}            Returns the compilation or null if it's password protected
   */
  public async getCompilation(identifier: string, password?: string): Promise<ICompilation | null> {
    return password
      ? this.get(`api/v1/get/find/${Collection.compilation}/${identifier}/${password}`)
      : this.get(`api/v1/get/find/${Collection.compilation}/${identifier}`);
  }

  public async getCurrentUserData(): Promise<IUserData> {
    return this.get('api/v1/get/ldata');
  }

  // Account specific GETs
  public async getAccounts(): Promise<IStrippedUserData[]> {
    return this.get('api/v1/get/users');
  }

  public async getGroups(): Promise<IGroup[]> {
    return this.get('api/v1/get/groups');
  }

  public async logout(): Promise<void> {
    return this.get('user-management/logout');
  }

  // POSTs
  public async explore(
    exploreRequest: IExploreRequest,
  ): Promise<{ requestTime: number; array: Array<IEntity | ICompilation> }> {
    return this.post('api/v1/post/explore', exploreRequest);
  }

  public async pushEntity(entity: IEntity): Promise<IEntity> {
    return this.post(`api/v1/post/push/${Collection.entity}`, entity);
  }

  public async pushPerson(person: IPerson): Promise<IPerson> {
    return this.post(`api/v1/post/push/${Collection.person}`, person);
  }

  public async pushInstitution(institution: IInstitution): Promise<IInstitution> {
    return this.post(`api/v1/post/push/${Collection.institution}`, institution);
  }

  public async pushGroup(group: IGroup): Promise<IGroup> {
    return this.post(`api/v1/post/push/${Collection.group}`, group);
  }

  public async pushCompilation(Compilation: ICompilation): Promise<ICompilation> {
    return this.post(`api/v1/post/push/${Collection.compilation}`, Compilation);
  }

  public async pushDigitalEntity(DigitalEntity: IDigitalEntity): Promise<IDigitalEntity> {
    return this.post(`api/v1/post/push/${Collection.digitalentity}`, DigitalEntity);
  }

  public async deleteRequest(
    identifier: string,
    type: string,
    username: string,
    password: string,
  ): Promise<string> {
    return this.post(`api/v1/post/remove/${type}/${identifier}`, {
      username,
      password,
    });
  }

  // Search functions
  public async searchEntity(filter: string, offset = 0): Promise<IEntity[]> {
    return this.post(`api/v1/post/search/${Collection.entity}`, {
      filter: filter.split(' '),
      offset,
    });
  }

  public async searchPerson(filter: string, offset = 0): Promise<IPerson[]> {
    return this.post(`api/v1/post/search/${Collection.person}`, {
      filter: filter.split(' '),
      offset,
    });
  }

  public async searchTags(filter: string, offset = 0): Promise<ITag[]> {
    return this.post(`api/v1/post/search/${Collection.tag}`, {
      filter: filter.split(' '),
      offset,
    });
  }

  public async searchCompilation(filter: string, offset = 0): Promise<ICompilation[]> {
    return this.post(`api/v1/post/search/${Collection.compilation}`, {
      filter: filter.split(' '),
      offset,
    });
  }

  public async togglePublishedState(identifier: string): Promise<IEntity> {
    return this.post('api/v1/post/publish', { identifier });
  }

  public async sendUploadApplicationMail(mailRequest: ISendMailRequest): Promise<string> {
    return this.post('mail/sendmail', {
      ...mailRequest,
      target: ETarget.upload,
    });
  }

  public async sendBugReportMail(mailRequest: ISendMailRequest): Promise<string> {
    return this.post('mail/sendmail', {
      ...mailRequest,
      target: ETarget.bugreport,
    });
  }

  public async sendContactMail(mailRequest: ISendMailRequest): Promise<string> {
    return this.post('mail/sendmail', {
      ...mailRequest,
      target: ETarget.contact,
    });
  }

  // Admin routes
  public async getAllUsers(username: string, password: string): Promise<IUserData[]> {
    return this.post('admin/getusers', { username, password });
  }

  public async getUser(username: string, password: string, identifier: string): Promise<IUserData> {
    return this.post(`admin/getuser/${identifier}`, { username, password });
  }

  public async promoteUser(
    username: string,
    password: string,
    identifier: string,
    role: string,
  ): Promise<string> {
    return this.post('admin/promoteuser', {
      username,
      password,
      identifier,
      role,
    });
  }

  public async adminTogglePublishedState(
    username: string,
    password: string,
    identifier: string,
  ): Promise<IEntity> {
    return this.post('admin/togglepublished', {
      username,
      password,
      identifier,
    });
  }

  // TODO: Mail entry interface
  public async getMailEntries(
    username: string,
    password: string,
  ): Promise<{ [key: string]: any[] }> {
    return this.post('mail/getmailentries', { username, password });
  }

  // TODO: Mail entry interface
  public async toggleMailAnswered(
    username: string,
    password: string,
    target: string,
    identifier: string,
  ): Promise<any> {
    return this.post(`mail/toggleanswered/${target}/${identifier}`, {
      username,
      password,
    });
  }

  // Upload
  public async completeUpload(UUID: string, type: string): Promise<{ files: IFile[] }> {
    return this.post('upload/finish', { uuid: UUID, type });
  }

  public async cancelUpload(UUID: string, type: string): Promise<string> {
    return this.post('upload/cancel', { uuid: UUID, type });
  }

  // Utility
  public async addEntityOwner(
    username: string,
    password: string,
    entityId: string,
    ownerUsername: string,
  ): Promise<void> {
    return this.post('utility/applyactiontoentityowner', {
      username,
      password,
      command: 'add',
      entityId,
      ownerUsername,
    });
  }

  public async removeEntityOwner(
    username: string,
    password: string,
    entityId: string,
    ownerUsername: string,
  ): Promise<void> {
    return this.post('utility/applyactiontoentityowner', {
      username,
      password,
      command: 'remove',
      entityId,
      ownerUsername,
    });
  }

  public async countEntityUses(entityId: string): Promise<{
    occurences: number;
    compilations: ICompilation[];
  }> {
    return this.get(`utility/countentityuses/${entityId}`);
  }

  public async findEntityOwners(entityId: string): Promise<IStrippedUserData[]> {
    return this.get(`utility/findentityowners/${entityId}`);
  }

  public async findUserInGroups(): Promise<IGroup[]> {
    return this.get('utility/finduseringroups');
  }

  public async findUserInCompilations(): Promise<ICompilation[]> {
    return this.get('utility/finduserincompilations');
  }

  public async findUserInMetadata(): Promise<IEntity[]> {
    return this.get('utility/finduserinmetadata');
  }

  // User-management
  public async login(username: string, password: string): Promise<IUserData> {
    return this.post('user-management/login', { username, password });
  }

  public async registerAccount(accountData: any): Promise<string> {
    return this.post('user-management/register', accountData);
  }

  public async isAuthorized(): Promise<IUserData> {
    return this.get('user-management/auth');
  }

  public async requestPasswordReset(username: string): Promise<any> {
    return this.post('user-management/help/request-reset', { username });
  }

  public async confirmPasswordResetRequest(
    username: string,
    token: string,
    password: string,
  ): Promise<any> {
    return this.post('user-management/help/confirm-reset', { username, token, password });
  }

  public async forgotUsername(mail: string): Promise<any> {
    return this.post('user-management/help/forgot-username', { mail });
  }
}
