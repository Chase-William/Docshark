import ConfigModel from "../models/config/ConfigModel"
import Configuration from "../models/config/Configuration"
import EventConfigModel from "../models/config/members/EventConfigModel"
import FieldConfigModel from "../models/config/members/FieldConfigModel"
import MethodConfigModel from "../models/config/members/MethodConfigModel"
import PropertyConfigModel from "../models/config/members/PropertyConfigModel"
import ClassConfigModel from "../models/config/types/ClassConfigModel"
import DelegateConfigModel from "../models/config/types/DelegateConfigModel"
import EnumConfigModel from "../models/config/types/EnumConfigModel"
import InterfaceConfigModel from "../models/config/types/InterfaceConfigModel"
import StructConfigModel from "../models/config/types/StructConfigModel"
import { IGlobalMetaMap } from "../models/global/MapperManager"
import EventModel from "../models/members/EventModel"
import FieldModel from "../models/members/FieldModel"
import MethodModel from "../models/members/MethodModel"
import PropertyModel from "../models/members/PropertyModel"
import ClassModel from "../models/types/ClassModel"
import DelegateModel from "../models/types/DelegateModel"
import EnumModel from "../models/types/EnumModel"
import InterfaceModel from "../models/types/InterfaceModel"
import StructModel from "../models/types/StructModel"

export default interface Renderer {
  // render<T extends ClassModel |DelegateModel | EnumModel | InterfaceModel | StructModel>(model: T): string

  // renderEvent(model: EventModel): string
  // renderField(model: FieldModel): string
  // renderMethod(model: MethodModel): string
  // renderProperty(model: PropertyModel): string

  beginRenderingClass(model: ClassModel, config: ClassConfigModel, map: IGlobalMetaMap): void
  beginRenderingDelegate(model: DelegateModel, config: DelegateConfigModel, map: IGlobalMetaMap): void
  beginRenderingEnum(model: EnumModel, config: EnumConfigModel, map: IGlobalMetaMap): void
  beginRenderingInterface(model: InterfaceModel, config: InterfaceConfigModel, map: IGlobalMetaMap): void
  beginRenderingStruct(model: StructModel, config: StructConfigModel, map: IGlobalMetaMap): void

  //beginRenderingProperties(): void
  renderProperties(accessibility: string, properties: PropertyModel[], config: PropertyConfigModel, map: IGlobalMetaMap): void
  //endRenderingProperties(): void

  //beginRenderingMethods(): void
  renderMethods(accessibility: string, methods: MethodModel[], config: MethodConfigModel, map: IGlobalMetaMap): void
  //endRenderingMethods(): void

  //beginRenderingEvents(): void
  renderEvents(accessibility: string, events: EventModel[], config: EventConfigModel, map: IGlobalMetaMap): void
  //endRenderingEvents(): void

  //beginRenderingFields(): void
  renderFields(accessibility: string, fields: FieldModel[], config: FieldConfigModel, map: IGlobalMetaMap): void
  //endRenderingFields(): void

  renderValues(model: EnumModel, values: FieldModel[]): void

  endRenderingClass(model: ClassModel, filePath: string, config: ClassConfigModel, map: IGlobalMetaMap): void
  endRenderingDelegate(model: DelegateModel, filePath: string, config: DelegateConfigModel, map: IGlobalMetaMap): void
  endRenderingEnum(model: EnumModel, filePath: string, config: EnumConfigModel, map: IGlobalMetaMap): void
  endRenderingInterface(model: InterfaceModel, filePath: string, config: InterfaceConfigModel, map: IGlobalMetaMap): void
  endRenderingStruct(model: StructModel, filePath: string, config: StructConfigModel, map: IGlobalMetaMap): void
}