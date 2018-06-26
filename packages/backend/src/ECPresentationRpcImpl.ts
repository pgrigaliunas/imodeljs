/*---------------------------------------------------------------------------------------------
|  $Copyright: (c) 2017 Bentley Systems, Incorporated. All rights reserved. $
 *--------------------------------------------------------------------------------------------*/
/** @module RPC */

import { IModelToken } from "@bentley/imodeljs-common";
import { IModelDb } from "@bentley/imodeljs-backend";
import { ECPresentationRpcInterface,
  SettingValue, SettingValueTypes,
  ECPresentationError, ECPresentationStatus,
  InstanceKey,
} from "@bentley/ecpresentation-common";
import { KeySet, PageOptions } from "@bentley/ecpresentation-common";
import { Node, NodeKey, NodePathElement } from "@bentley/ecpresentation-common";
import { SelectionInfo, Descriptor, Content } from "@bentley/ecpresentation-common";
import { PresentationRuleSet } from "@bentley/ecpresentation-common";
import ECPresentation from "./ECPresentation";
import ECPresentationManager from "./ECPresentationManager";

/**
 * The backend implementation of ECPresentationRpcInterface. All it's basically
 * responsible for is forwarding calls to [[ECPresentation.manager]].
 *
 * Consumers should not use this class. Instead, they should register
 * [ECPresentationRpcInterface]($ecpresentation-common):
 * ``` ts
 * [[include:Backend.Initialization.RpcInterface]]
 * ```
 */
export default class ECPresentationRpcImpl extends ECPresentationRpcInterface {

  /**
   * Get the ECPresentationManager used by this RPC impl.
   */
  public getManager(): ECPresentationManager {
    return ECPresentation.manager;
  }

  private getIModel(token: IModelToken): IModelDb {
    const imodel = IModelDb.find(token);
    if (!imodel)
      throw new ECPresentationError(ECPresentationStatus.InvalidArgument, "IModelToken doesn't point to any iModel");
    return imodel;
  }

  public setActiveLocale(locale: string | undefined): Promise<void> {
    this.getManager().activeLocale = locale;
    return Promise.resolve();
  }

  public async addRuleSet(ruleSet: PresentationRuleSet): Promise<void> {
    return await this.getManager().addRuleSet(ruleSet);
  }

  public async removeRuleSet(ruleSetId: string): Promise<void> {
    return await this.getManager().removeRuleSet(ruleSetId);
  }

  public async clearRuleSets(): Promise<void> {
    return await this.getManager().clearRuleSets();
  }

  public async getRootNodes(token: IModelToken, pageOptions: Readonly<PageOptions> | undefined, options: object): Promise<ReadonlyArray<Readonly<Node>>> {
    return await this.getManager().getRootNodes(this.getIModel(token), pageOptions, options);
  }

  public async getRootNodesCount(token: IModelToken, options: object): Promise<number> {
    return await this.getManager().getRootNodesCount(this.getIModel(token), options);
  }

  public async getChildren(token: IModelToken, parentKey: Readonly<NodeKey>, pageOptions: Readonly<PageOptions> | undefined, options: object): Promise<ReadonlyArray<Readonly<Node>>> {
    return await this.getManager().getChildren(this.getIModel(token), parentKey, pageOptions, options);
  }

  public async getChildrenCount(token: IModelToken, parentKey: Readonly<NodeKey>, options: object): Promise<number> {
    return await this.getManager().getChildrenCount(this.getIModel(token), parentKey, options);
  }

  public async getNodePaths(token: Readonly<IModelToken>, paths: InstanceKey[][], markedIndex: number, options: object): Promise<NodePathElement[]> {
    return await this.getManager().getNodePaths(this.getIModel(token), paths, markedIndex, options);
  }

  public async getFilteredNodePaths(token: Readonly<IModelToken>, filterText: string, options: object): Promise<NodePathElement[]> {
    return await this.getManager().getFilteredNodePaths(this.getIModel(token), filterText, options);
  }

  public async getContentDescriptor(token: IModelToken, displayType: string, keys: Readonly<KeySet>, selection: Readonly<SelectionInfo> | undefined, options: object): Promise<Readonly<Descriptor> | undefined> {
    const descriptor = await this.getManager().getContentDescriptor(this.getIModel(token), displayType, keys, selection, options);
    if (descriptor)
      descriptor.resetParentship();
    return descriptor;
  }

  public async getContentSetSize(token: IModelToken, descriptor: Readonly<Descriptor>, keys: Readonly<KeySet>, options: object): Promise<number> {
    return await this.getManager().getContentSetSize(this.getIModel(token), descriptor, keys, options);
  }

  public async getContent(token: IModelToken, descriptor: Readonly<Descriptor>, keys: Readonly<KeySet>, pageOptions: Readonly<PageOptions> | undefined, options: object): Promise<Readonly<Content>> {
    const content: Content = await this.getManager().getContent(this.getIModel(token), descriptor, keys, pageOptions, options);
    content.descriptor.resetParentship();
    return content;
  }

  public async getDistinctValues(token: Readonly<IModelToken>, descriptor: Readonly<Descriptor>, keys: Readonly<KeySet>, fieldName: string, options: object, maximumValueCount: number): Promise<string[]> {
    return await this.getManager().getDistinctValues(this.getIModel(token), descriptor, keys, fieldName, options, maximumValueCount);
   }

  public async setUserSettingValue(ruleSetId: string, settingId: string, value: SettingValue): Promise<void> {
    return await this.getManager().settings.setValue(ruleSetId, settingId, value);
  }

  public async getUserSettingValue(ruleSetId: string, settingId: string, settingType: SettingValueTypes): Promise<any> {
    return await this.getManager().settings.getValue(ruleSetId, settingId, settingType);
  }
}
