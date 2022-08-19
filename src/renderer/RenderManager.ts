import path = require("path");
import ConfigModel from "../models/config/ConfigModel";
import Configuration from "../models/config/Configuration";
import MemberConfigModel from "../models/config/members/MemberConfigModel";
import IAmTypeModel from "../models/language/interfaces/IAmTypeModel";
import IAmProjectManager from "../ProjectManager";
import RenderTypeArgs from "./RenderTypeArgs";
import Renderer from "./Renderer";
import RenderMembersArgs from "./RenderMembersArgs";
import AccessibilityModel from "../models/language/AccessibilityModel";
import IAmAccessibilityModel from "../models/language/interfaces/IAmAccessibilityModel";
import IAmSingletonable from "../models/language/interfaces/IAmSingletonable";
import IAmEventModel from "../models/language/interfaces/members/IAmEventModel";
import IAmModel from "../models/language/interfaces/IAmModel";
import FieldConfigModel from "../models/config/members/FieldConfigModel";
import IAmFieldModel from "../models/language/interfaces/members/IAmFieldModel";
import IAmPropertyModel from "../models/language/interfaces/members/IAmPropertyModel";
import IAmMethodModel from "../models/language/interfaces/members/IAmMethodModel";
import IAmSlicedTypeModel from "../models/language/interfaces/types/IAmSlicedTypeModel";
import IAmEnumModel from "../models/language/interfaces/types/IAmEnumModel";
import PropertyConfigModel from "../models/config/members/PropertyConfigModel";

function makeFilePath(model: IAmSlicedTypeModel): string {
  return model.namespace.split('.').join('/')
}

/**
 * We need to finish the type slicing, and unless we find a way to map our model type to the config type, we will need have a T4....
 */

function makeRenderTypeArgs<T extends IAmSlicedTypeModel>(model: T, renderManager: RenderManager): RenderTypeArgs<any> {
  const dir = makeFilePath(model)
  return {
    projManager: renderManager.projManager,
    config: renderManager.config,
    directory: dir,
    fileName: model.name,
    fileExtension: '.md',
    filePath: path.join(dir, model.name) + '.md'
  }
}

function makeRenderMembersArgs
  <TParent extends IAmSlicedTypeModel,
   TMember extends IAmEventModel | IAmFieldModel | IAmMethodModel | IAmPropertyModel,
   TConfig extends MemberConfigModel>(model: TParent, members: TMember[], config: TConfig, renderManager: RenderManager): RenderMembersArgs<TParent, TMember, TConfig> {
  return {
    more: makeRenderTypeArgs(model, renderManager),
    members: members,
    config: config,
    parent: model
  }
}

/**
 * The RenderManager doesn't perform any rendering, instead it 
 * works closely with a configuration to restrict what gets rendered.
 * 
 * For example, instead of calling a render function for a property with a config and 
 * having the receiver determine if that property should be rendered; lets just do that here.
 * This reduces the workload/complexity and maintenance needed by different rendering implementations.
 * 
 * This is the last place for changes that will impact all renderers. (This is the callsite where renderer
 * implementations have their functions called)
 */
export default class RenderManager {
  config: Configuration;
  path: string
  renderer: Renderer
  projManager: IAmProjectManager

  render(projManager: IAmProjectManager): void {
    this.projManager = projManager;
    // Render each type in this project
    projManager.types.forEach(type => {
      if (type.isClass)
        this.renderClass(type)
      else if (type.isValueType)
        this.renderStruct(type)
      else if (type.isEnum)
        this.renderEnum(type)
      else if (type.isInterface)
        this.renderInterface(type)
      else 
        this.renderDelegate(type)
    });
  }

  renderClass(model: IAmTypeModel): void {    
    // Check config to determine what shall be rendered
    if (!this.shouldRender(model, this.config.type.class))
      return
    this.renderer.beginRenderingClass(model, makeRenderTypeArgs(model, this))
    this.renderMembers(model)
    this.renderer.endRenderingClass(model, makeRenderTypeArgs(model, this))
  }

  renderDelegate(model: IAmTypeModel): void {
    if (!this.shouldRender(model, this.config.type.delegate))
      return
    this.renderer.beginRenderingDelegate(model, makeRenderTypeArgs(model, this))
    this.renderer.endRenderingDelegate(model, makeRenderTypeArgs(model, this))
  }

  renderEnum(model: IAmTypeModel): void {
    if (!this.shouldRender(model, this.config.type.enum))
      return
    this.renderer.beginRenderingEnum(model, makeRenderTypeArgs(model, this))
    this.renderer.renderValues(makeRenderMembersArgs<IAmEnumModel, IAmFieldModel, FieldConfigModel>(model, model.fields, this.config.member.field, this))
    this.renderer.endRenderingEnum(model, makeRenderTypeArgs(model, this))
  }

  renderInterface(model: IAmTypeModel): void {
    if (!this.shouldRender(model, this.config.type.interface))
      return
    this.renderer.beginRenderingInterface(model, makeRenderTypeArgs(model, this))
    this.renderMembers(model)
    this.renderer.endRenderingInterface(model, makeRenderTypeArgs(model, this))
  }

  renderStruct(model: IAmTypeModel): void {
    if (!this.shouldRender(model, this.config.type.struct))
      return
    this.renderer.beginRenderingStruct(model, makeRenderTypeArgs(model, this))
    this.renderMembers(model)
    this.renderer.endRenderingStruct(model, makeRenderTypeArgs(model, this))
  }

  renderMembers(model: IAmTypeModel): void {
    // Properties
    if (model.properties && model.properties.length > 0) {
      if (this.hasRenderableModels(model.properties, this.config.member.property)) {    
        this.renderProperties(model)
      }      
    }
    // Methods
    if (model.methods && model.methods.length > 0) {
      if (this.hasRenderableModels(model.methods, this.config.member.method)) {    
        this.renderMethods(model)
      }      
    }
    // Events
    if (model.events && model.events.length > 0) {
      if (this.hasRenderableModels(model.events, this.config.member.event)) {    
        this.renderEvents(model)
      }      
    }
    // Fields
    if (model.fields && model.fields.length > 0) {
      if (this.hasRenderableModels(model.fields, this.config.member.field)) {    
        this.renderFields(model)
      }      
    }
  }

  renderProperties(model: IAmTypeModel): void {
    this.renderOrganizedMembers(
      model.properties, 
      this.config.member.property, 
      (accessibility: string, members: IAmPropertyModel[]) => this.renderer.renderProperties(accessibility, makeRenderMembersArgs(model, members, this.config.member.property, this))
    )
  }

  renderMethods(model: IAmTypeModel): void {
    this.renderOrganizedMembers(
      model.methods,
      this.config.member.method, 
      (accessibility: string, members: IAmMethodModel[]) => this.renderer.renderMethods(accessibility, makeRenderMembersArgs(model, members, this.config.member.method, this))
    )
  }

  renderEvents(model: IAmTypeModel): void {
    this.renderOrganizedMembers(
      model.events, 
      this.config.member.event, 
      (accessibility: string, members: IAmEventModel[]) => this.renderer.renderEvents(accessibility, makeRenderMembersArgs(model, members, this.config.member.event, this))
    )
  }
  
  renderFields(model: IAmTypeModel): void {
    this.renderOrganizedMembers(
      model.fields, 
      this.config.member.field, 
      (accessibility: string, members: IAmFieldModel[]) => this.renderer.renderFields(accessibility, makeRenderMembersArgs(model, members, this.config.member.field, this))
    )
  }  

  renderOrganizedMembers<T extends AccessibilityModel & IAmModel>(models: T[], config: MemberConfigModel, renderFunc: (accessibility: string, models: T[]) => void): void {
    models.sort((a, b) => a.name.localeCompare(b.name))
    const publicModels = new Array<T>()
    const privateModels = new Array<T>()
    const protectedModels = new Array<T>()
    const internalModels = new Array<T>()
    const internalAndProtectedModels = new Array<T>()

    for (const model of models) {
      if (model.isInternal && model.isProtected) {
        internalAndProtectedModels.push(model)
      } else if (model.isInternal) {
        internalModels.push(model)
      } else if (model.isProtected) {
        protectedModels.push(model)
      } else if (model.isPublic) {
        publicModels.push(model)
      } else { // private
        privateModels.push(model)
      }
    }

    /**
     * Do not render if config says not to.
     * Do not render if config says to, but there is nothing to render.
     */

    if (config.showIfPublic && publicModels.length > 0)
      renderFunc('public', publicModels)
    if (config.showIfProtected && protectedModels.length > 0)
      renderFunc('protected', protectedModels)
    if (config.showIfInternal && internalModels.length > 0)
      renderFunc('internal', internalModels)
    if (config.showIfInternalProtected && internalAndProtectedModels.length > 0)
      renderFunc('internal protected', internalAndProtectedModels)
    if (config.showIfPrivate && privateModels.length > 0)
      renderFunc('private', privateModels)
  }

  /**
   * Determines if the given model should be rendered based on the config.
   * @param model to be or not to be rendered
   * @param config to be compared to model
   * @returns true for to be rendered, false to skip rendering
   */
  shouldRender(model: AccessibilityModel, config: ConfigModel): boolean {
    // Must process "internal protected" before other states because of it's composition of other states 
    // Otherwise it generates false truths in below conditionals
    if (model.isInternal && model.isProtected)
    {
      if (config.showIfInternalProtected)
        return true
      return false
    }

    // Only render when this entity's accessibility mod matches the config's value
    if (model.isPublic && config.showIfPublic ||      
        model.isProtected && config.showIfProtected ||
        model.isInternal && config.showIfInternal ||      
        model.isPrivate && config.showIfPrivate) 
      return true
      
    return false
  }

  hasRenderableModels(models: AccessibilityModel[], config: ConfigModel): boolean {
    for (const model of models) {
      // Must process "internal protected" before other states because of it's composition of other states 
      // Otherwise it generates false truths in below conditionals
      if (model.isInternal && model.isProtected)
      {
        if (config.showIfInternalProtected)
          return true
        continue
      }

      // Only render when this entity's accessibility mod matches the config's value
      if (model.isPublic && config.showIfPublic ||      
          model.isProtected && config.showIfProtected ||
          model.isInternal && config.showIfInternal ||      
          model.isPrivate && config.showIfPrivate) 
        return true              
    }
    return false
  }

  getFilePath(model: IAmTypeModel): string {
    return path.join(this.path, this.getDirectory(model.fullName))
  }

  /**
   * Gets the directory of a model via it's namespace location.
   * @param namespace Location of the type.
   * @returns Directory that resembles the namespace location with the type itself omitted
   */
  getDirectory(namespace: string): string {
    const names = namespace.split('.')
    return names.slice(0, names.length - 1).join('/')
  }
}