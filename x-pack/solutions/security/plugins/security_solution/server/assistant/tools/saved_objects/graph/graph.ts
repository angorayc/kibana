/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { END, START, StateGraph } from '@langchain/langgraph';
import type { SavedObjectsClientContract, Logger, ElasticsearchClient } from '@kbn/core/server';
import { SavedObjectsCreationState, type SavedObjectsCreationStateType } from './types';
import {
  analyzeFields,
  checkDocumentsForLens,
  validateSavedObjects,
  createSavedObjects,
  generateReferences,
  routeAfterValidation,
  routeAfterCreation,
} from './nodes';

export interface SavedObjectsCreationGraphParams {
  savedObjectsClient: SavedObjectsClientContract;
  esClient?: ElasticsearchClient;
  logger: Logger;
}

/**
 * Creates the saved objects creation graph
 *
 * Graph flow:
 * START -> analyzeFields -> validate -> [create | END]
 *          create -> [references | END]
 *          references -> END
 */
export const getSavedObjectsCreationGraph = async ({
  savedObjectsClient,
  esClient,
  logger,
}: SavedObjectsCreationGraphParams) => {
  const workflow = new StateGraph(SavedObjectsCreationState)
    // Node: Analyze fields from index mappings
    .addNode('analyzeFields', async (state: SavedObjectsCreationStateType) => {
      return analyzeFields(state, logger);
    })
    // Node: Check documents for Lens visualizations
    // .addNode('checkDocuments', async (state: SavedObjectsCreationStateType) => {
    //   return checkDocumentsForLens(state, esClient, savedObjectsClient, logger);
    // })
    // Node: Validate input
    .addNode('validate', async (state: SavedObjectsCreationStateType) => {
      return validateSavedObjects(state, logger);
    })
    // Node: Create saved objects
    .addNode('create', async (state: SavedObjectsCreationStateType) => {
      return createSavedObjects(state, savedObjectsClient, logger);
    })
    // Edges
    .addEdge(START, 'analyzeFields')
    .addEdge('analyzeFields', 'validate')
    // .addEdge('checkDocuments', 'validate')
    .addConditionalEdges('validate', routeAfterValidation, {
      create: 'create',
      end: END,
    });
  // .addConditionalEdges('create', routeAfterCreation, {
  //   references: 'references',
  //   end: END,
  // })
  // .addEdge('references', END);

  return workflow.compile();
};
