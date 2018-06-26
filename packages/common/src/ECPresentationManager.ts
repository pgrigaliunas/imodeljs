/*---------------------------------------------------------------------------------------------
|  $Copyright: (c) 2017 Bentley Systems, Incorporated. All rights reserved. $
 *--------------------------------------------------------------------------------------------*/
/** @module Core */

import { Node, NodeKey, NodePathElement } from "./hierarchy";
import { SelectionInfo, Descriptor, Content } from "./content";
import { IModel } from "@bentley/imodeljs-common";
import { InstanceKey } from "./EC";
import KeySet from "./KeySet";
import { PresentationRuleSet } from "./rules";
import { UserSettingsManager } from "./UserSettingsManager";

/** Paging options. */
export interface PageOptions {
  pageStart?: number;
  pageSize?: number;
}

/** An interface of presentation manager which provides presentation services for
 * tree and content controls
 */
export interface ECPresentationManager<TIModel extends IModel> {
  /**
   * Currently active locale used to localize presentation data.
   */
  activeLocale: string | undefined;

  /**
   * Settings manager for accessing and setting user settings.
   */
  readonly settings: UserSettingsManager;

  /**
   * Register a ruleset
   * @param ruleSet Ruleset to register
   */
  addRuleSet(ruleSet: PresentationRuleSet): Promise<void>;

  /**
   * Unregister a ruleset.
   * @param ruleSetId Id of a ruleset to unregister.
   */
  removeRuleSet(ruleSetId: string): Promise<void>;

  /**
   * Removes all rulesets added with addRuleSet.
   */
  clearRuleSets(): Promise<void>;

  /** Retrieves root nodes.
   * @param imodel iModel to pull data from.
   * @param pageOptions  Page options for the requested nodes.
   * @param options      An options object that depends on the used presentation manager implementation.
   * @return A promise object that returns either an array of nodes on success or an error string on error.
   */
  getRootNodes(imodel: TIModel, pageOptions: Readonly<PageOptions> | undefined, options: object): Promise<ReadonlyArray<Readonly<Node>>>;

  /** Retrieves root nodes count.
   * @param imodel iModel to pull data from.
   * @param options  An options object that depends on the used presentation manager implementation.
   * @return A promise object that returns the number of root nodes.
   */
  getRootNodesCount(imodel: TIModel, options: object): Promise<number>;

  /** Retrieves children of the specified parent node.
   * @param imodel iModel to pull data from.
   * @param parentKey    Key of the parent node.
   * @param pageOptions  Page options for the requested nodes.
   * @param options      An options object that depends on the used presentation manager implementation.
   * @return A promise object that returns either an array of nodes on success or an error string on error.
   */
  getChildren(imodel: TIModel, parentKey: Readonly<NodeKey>, pageOptions: Readonly<PageOptions> | undefined, options: object): Promise<ReadonlyArray<Readonly<Node>>>;

  /** Retrieves children count for the specified parent node.
   * @param imodel iModel to pull data from.
   * @param parentKey Key of the parent node.
   * @param options  An options object that depends on the used presentation manager implementation.
   * @return A promise object that returns the number of child nodes.
   */
  getChildrenCount(imodel: TIModel, parentKey: Readonly<NodeKey>, options: object): Promise<number>;

  /**
   * Retrieves paths from root nodes to children nodes according to specified keys. Intersecting paths will be merged.
   * @param imodel iModel to pull data from.
   * @param paths Paths from root node to some child node.
   * @param markedIndex Index of the path in `paths` that will be marked.
   * @param options An options object that depends on the used presentation manager implementation.
   * @return A promise object that returns either an array of paths on success or an error string on error.
   */
  getNodePaths(imodel: Readonly<TIModel>, paths: InstanceKey[][], markedIndex: number, options: object): Promise<NodePathElement[]>;

  /**
   * Retrieves paths from root nodes to nodes containing filter text in their label.
   * @param imodel iModel to pull data from.
   * @param filterText Text to filter nodes against.
   * @param options An options object that depends on the used presentation manager implementation.
   * @return A promise object that returns either an array of paths on success or an error string on error.
   */
  getFilteredNodePaths(imodel: Readonly<TIModel>, filterText: string, options: object): Promise<NodePathElement[]>;

  /** Retrieves the content descriptor which can be used to get content.
   * @param imodel iModel to pull data from.
   * @param displayType  The preferred display type of the return content.
   * @param keys         Keys of ECInstances to get the content for.
   * @param selection    Optional selection info in case the content is being requested due to selection change.
   * @param options  An options object that depends on the used presentation manager implementation.
   * @return A promise object that returns either a descriptor on success or an error string on error.
   */
  getContentDescriptor(imodel: TIModel, displayType: string, keys: Readonly<KeySet>, selection: Readonly<SelectionInfo> | undefined, options: object): Promise<Readonly<Descriptor> | undefined>;

  /** Retrieves the content set size based on the supplied content descriptor override.
   * @param imodel iModel to pull data from
   * @param descriptor           Content descriptor which specifies how the content should be returned.
   * @param keys                 Keys of ECInstances to get the content for.
   * @param options              An options object that depends on the used presentation manager implementation.
   * @return A promise object that returns either a number on success or an error string on error.
   * Even if concrete implementation returns content in pages, this function returns the total
   * number of records in the content set.
   */
  getContentSetSize(imodel: TIModel, descriptor: Readonly<Descriptor>, keys: Readonly<KeySet>, options: object): Promise<number>;

  /** Retrieves the content based on the supplied content descriptor override.
   * @param imodel iModel to pull data from
   * @param descriptor           Content descriptor which specifies how the content should be returned.
   * @param keys                 Keys of ECInstances to get the content for.
   * @param pageOptions          Paging options.
   * @param options              An options object that depends on the used presentation manager implementation.
   * @return A promise object that returns either content on success or an error string on error.
   */
  getContent(imodel: TIModel, descriptor: Readonly<Descriptor>, keys: Readonly<KeySet>, pageOptions: Readonly<PageOptions> | undefined, options: object): Promise<Readonly<Content>>;

  /** Retrieves distinct values of specific field from the content based on the supplied content descriptor override.
   * @param imodel               iModel to pull data from
   * @param descriptor           Content descriptor which specifies how the content should be returned.
   * @param keys                 Keys of ECInstances to get the content for.
   * @param fieldName            Name of the field from which to take values.
   * @param options              An options object that depends on the used presentation manager implementation.
   * @param maximumValueCount    Maximum numbers of values that can be returned. Unlimited if 0.
   * @return A promise object that returns either distinct values on success or an error string on error.
   */
  getDistinctValues(imodel: TIModel, descriptor: Readonly<Descriptor>, keys: Readonly<KeySet>, fieldName: string, options: object, maximumValueCount: number): Promise<string[]>;
}
