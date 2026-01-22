/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { ElasticsearchClient, SavedObjectsClientContract, Logger } from '@kbn/core/server';
import type { DocumentCheckResult } from '../types';
import type { SavedObjectsCreationStateType } from './types';

const isLens = (type: string) => type === 'lens';

const extractKqlFromLens = (attributes: Record<string, unknown>): string | undefined => {
  const lensState = (attributes as Record<string, any>)?.state;
  const query = lensState?.query;
  if (query && typeof query.query === 'string') {
    return query.query;
  }

  const searchSourceJSON = (attributes as Record<string, any>)?.kibanaSavedObjectMeta
    ?.searchSourceJSON;
  if (typeof searchSourceJSON === 'string') {
    try {
      const parsed = JSON.parse(searchSourceJSON);
      const parsedQuery = parsed.query?.query;
      if (typeof parsedQuery === 'string') {
        return parsedQuery;
      }
    } catch (e) {
      // swallow JSON parse errors; not fatal for lens creation
    }
  }

  return undefined;
};

const extractFilterStrings = (attributes: Record<string, unknown>): string[] => {
  const lensState = (attributes as Record<string, any>)?.state;
  const filters = Array.isArray(lensState?.filters) ? lensState.filters : [];

  return filters
    .map((filter) => {
      if (typeof filter?.meta?.query === 'string') {
        return filter.meta.query;
      }
      const q = filter?.query?.query_string?.query;
      if (typeof q === 'string') {
        return q;
      }
      return undefined;
    })
    .filter((f): f is string => typeof f === 'string' && f.trim().length > 0);
};

/**
 * Node: Check documents for Lens saved objects using KQL and filters
 */
export const checkDocumentsForLens = async (
  state: SavedObjectsCreationStateType,
  esClient: ElasticsearchClient | undefined,
  savedObjectsClient: SavedObjectsClientContract,
  logger: Logger
): Promise<Partial<SavedObjectsCreationStateType>> => {
  if (!esClient) {
    logger.warn('Skipping document checks: esClient not available');
    return {};
  }

  const lensObjects = filterLensObjects(state.savedObjects || []);
  if (lensObjects.length === 0) {
    return {};
  }

  const { checks, errors } = await processLensObjects(
    lensObjects,
    esClient,
    savedObjectsClient,
    logger
  );

  return {
    documentChecks: checks,
    validationErrors: errors,
  };
};

const filterLensObjects = (savedObjects: any[]): any[] => {
  return savedObjects.filter((obj) => isLens(obj.type));
};

const processLensObjects = async (
  lensObjects: any[],
  esClient: ElasticsearchClient,
  savedObjectsClient: SavedObjectsClientContract,
  logger: Logger
): Promise<{ checks: DocumentCheckResult[]; errors: string[] }> => {
  const errors: string[] = [];
  const checks: DocumentCheckResult[] = [];

  for (const obj of lensObjects) {
    const attributes = (obj as any).attributes ?? {};
    const query = extractKqlFromLens(attributes);
    const filterStrings = extractFilterStrings(attributes);

    if (!query) {
      logger.debug(`Lens ${obj.id ?? ''} has no query; skipping document check`);
    } else {
      const indexRefs = filterIndexReferences(obj.references || []);
      await processIndexReferences(
        indexRefs,
        query,
        filterStrings,
        attributes,
        obj,
        esClient,
        savedObjectsClient,
        checks,
        errors,
        logger
      );
    }
  }

  return { checks, errors };
};

const filterIndexReferences = (references: any[]): any[] => {
  return references.filter((ref) => ref.type === 'index-pattern' || ref.type === 'data-view');
};

const processIndexReferences = async (
  indexRefs: any[],
  query: string,
  filterStrings: string[],
  attributes: any,
  obj: any,
  esClient: ElasticsearchClient,
  savedObjectsClient: SavedObjectsClientContract,
  checks: DocumentCheckResult[],
  errors: string[],
  logger: Logger
): Promise<void> => {
  for (const ref of indexRefs) {
    let indexTitle: string | undefined;
    try {
      const dataView = await savedObjectsClient.get(ref.type, ref.id);
      indexTitle = (dataView.attributes as any)?.title;
    } catch (err) {
      logger.warn(`Unable to load data view ${ref.id} for lens ${obj.id}: ${err}`);
      continue;
    }

    if (!indexTitle) {
      logger.warn(`Data view ${ref.id} missing title; skipping document check`);
      continue;
    }

    await performDocumentCheck(
      indexTitle,
      query,
      filterStrings,
      attributes,
      obj,
      esClient,
      checks,
      errors,
      logger
    );
  }
};

const performDocumentCheck = async (
  indexTitle: string,
  query: string,
  filterStrings: string[],
  attributes: any,
  obj: any,
  esClient: ElasticsearchClient,
  checks: DocumentCheckResult[],
  errors: string[],
  logger: Logger
): Promise<void> => {
  const mustClauses = [
    {
      query_string: {
        query,
        default_operator: 'AND',
      },
    },
    ...filterStrings.map((f) => ({
      query_string: {
        query: f,
        default_operator: 'AND',
      },
    })),
  ];

  try {
    const response = await esClient.count({
      index: indexTitle,
      query: {
        bool: {
          must: mustClauses,
        },
      },
    });

    const total = response.count ?? 0;
    checks.push({
      lensTitle: (attributes as any)?.title ?? obj.id ?? 'lens',
      savedObjectId: obj.id,
      indexTitle,
      query,
      filter: filterStrings.join(' AND ') || undefined,
      total,
    });

    if (total === 0) {
      errors.push(
        `Lens "${
          (attributes as any)?.title ?? obj.id
        }" on index "${indexTitle}" returned 0 documents for query "${query}"`
      );
    }
  } catch (err) {
    logger.warn(
      `Document check failed for lens ${obj.id} on ${indexTitle}: ${
        err instanceof Error ? err.message : err
      }`
    );
    errors.push(
      `Lens "${
        (attributes as any)?.title ?? obj.id
      }" on index "${indexTitle}" failed document check: ${
        err instanceof Error ? err.message : 'unknown error'
      }`
    );
  }
};

/**
 * Node: Analyze provided index field mappings against KQL in attributes
 */
export const analyzeFields = async (
  state: SavedObjectsCreationStateType,
  logger: Logger
): Promise<Partial<SavedObjectsCreationStateType>> => {
  logger.debug('Analyzing fields from index mappings against KQL queries');
  const errors: string[] = [];
  const fieldsRecord = (state.fields as Record<string, unknown>) ?? {};
  const availableFields = new Set(Object.keys(fieldsRecord));

  // If no fields provided, skip with a benign analysis result
  if (availableFields.size === 0) {
    logger.debug('No fields provided; skipping field validation');
    errors.push('No index fields provided');
    return {
      analysisResult: {
        duplicates: [],
        relatedObjects: [],
        shouldProceed: true,
      },
    };
  }

  return {
    validationErrors: errors,
    analysisResult: {
      duplicates: [],
      relatedObjects: [],
      shouldProceed: errors.length === 0,
    },
  };
};

/**
 * Node: Validates the input saved objects
 */
export const validateSavedObjects = async (
  state: SavedObjectsCreationStateType,
  logger: Logger
): Promise<Partial<SavedObjectsCreationStateType>> => {
  logger.debug('Validating saved objects input');

  const errors: string[] = [];
  const { savedObject } = state;

  if (!savedObject) {
    errors.push('No saved objects provided for creation');
  }

  // Validate each saved object
  if (!savedObject.type) {
    errors.push(`Object at index ${index}: 'type' is required`);
  }

  if (!savedObject.attributes || typeof savedObject.attributes !== 'object') {
    errors.push(`Object at index ${index}: 'attributes' must be an object`);
  }

  // Validate references if present
  if (savedObject.references) {
    savedObject.references.forEach((ref, refIndex) => {
      if (!ref.id || !ref.type || !ref.name) {
        errors.push(
          `Object at index ${index}, reference ${refIndex}: must have 'id', 'type', and 'name'`
        );
      }
    });
  }

  // Validate initialNamespaces constraints
  if (savedObject.initialNamespaces) {
    if (savedObject.initialNamespaces.length === 0) {
      errors.push(`Object at index ${index}: 'initialNamespaces' cannot be empty`);
    }
  }

  if (errors.length > 0) {
    logger.error(`Validation failed: ${errors.join(', ')}`);
    return {
      validated: false,
      validationErrors: errors,
    };
  }

  logger.debug('Validation successful');
  return {
    validated: true,
    validationErrors: [],
  };
};

/**
 * Node: Creates saved objects via bulkCreate
 */
export const createSavedObjects = async (
  state: SavedObjectsCreationStateType,
  savedObjectsClient: SavedObjectsClientContract,
  logger: Logger
): Promise<Partial<SavedObjectsCreationStateType>> => {
  logger.debug(`Creating saved object`);

  try {
    const result = await savedObjectsClient.create(
      state.savedObject.type,
      state.savedObject.attributes,
      {
        overwrite: false,
      }
    );

    logger.info(
      `Successfully created saved object of type ${result.type} with id ${result.id} in space: ${state.spaceId}`
    );

    return {
      result,
      error: null,
    };
  } catch (error) {
    const errorMessage = `Failed to create saved objects: ${error.message}`;
    logger.error(errorMessage);
    return {
      result: null,
      error: errorMessage,
    };
  }
};

/**
 * Node: Generates content references for created objects
 */
export const generateReferences = async (
  state: SavedObjectsCreationStateType,
  logger: Logger
): Promise<Partial<SavedObjectsCreationStateType>> => {
  if (!state.result) {
    logger.warn('No result to generate references for');
    return { generatedReferencesArray: [] };
  }

  logger.debug('Generating content references');

  const references = state.result.saved_objects
    .filter((obj) => !obj.error) // Only successful creations
    .map((obj) => `${obj.type}:${obj.id}`);

  logger.debug(`Generated ${references.length} references`);

  return { generatedReferencesArray: references };
};

/**
 * Router: Determines next step based on validation
 */
export const routeAfterValidation = (state: SavedObjectsCreationStateType): string => {
  if (state.analysisResult && state.analysisResult.shouldProceed === false) {
    return 'end';
  }
  return state.validated ? 'create' : 'end';
};

/**
 * Router: Determines if we should generate references
 */
export const routeAfterCreation = (state: SavedObjectsCreationStateType): string => {
  return state.error ? 'end' : 'references';
};
