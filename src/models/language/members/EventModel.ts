import { jsonMember, jsonObject } from 'typedjson';
import IAmEventModel from '../interfaces/members/IAmEventModel';
import IAmTypeModel from '../interfaces/IAmTypeModel';
import CommonComment from '../../written/CommonComment';
import TypeModel from '../TypeModel';
import MemberModel from './MemberModel';

@jsonObject()
export default class EventModel extends MemberModel<CommonComment> implements IAmEventModel {
  @jsonMember(Boolean, { name: 'IsAbstract' })
  isAbstract: boolean;
  @jsonMember(Boolean, { name: 'IsVirtual' })
  isVirtual: boolean;

  bind(types: Map<string, IAmTypeModel>): void {
    return
  }
}
