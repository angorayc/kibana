/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { SavedObject, SavedObjectsFindResponse } from '@kbn/core/server';
import { Annotation } from '@langchain/langgraph';
import type { QueryDslQueryContainer } from '@kbn/data-views-plugin/common/types';
import type { DocumentCheckResult } from '../types';

/**
 * Analysis result from duplicate detection
 */
export interface AnalysisResult {
  duplicates: Array<{ type: string; id: string; title?: string }>;
  relatedObjects: Array<{ type: string; id: string; relation: string }>;
  shouldProceed: boolean;
}

/**
 * State for the saved objects creation graph
 */
export const SavedObjectsCreationState = Annotation.Root({
  // Input from LLM
  fields: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => ({}),
  }),
  savedObject: Annotation<SavedObject>({
    reducer: (x, y) => y ?? x,
  }),
  retrievedSavedObjects: Annotation<SavedObjectsFindResponse['saved_objects']>({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  analysisResult: Annotation<AnalysisResult | null>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  spaceId: Annotation<string>({
    reducer: (x, y) => y ?? x,
  }),

  // Processing state
  validated: Annotation<boolean>({
    reducer: (x, y) => y ?? x,
    default: () => false,
  }),
  validationErrors: Annotation<string[]>({
    reducer: (x, y) => [...(x ?? []), ...(y ?? [])],
    default: () => [],
  }),
  query: Annotation<QueryDslQueryContainer | undefined>({
    reducer: (x, y) => y ?? x,
  }),
  documentChecks: Annotation<DocumentCheckResult[]>({
    reducer: (x, y) => [...(x ?? []), ...(y ?? [])],
    default: () => [],
  }),

  // Output
  result: Annotation<SavedObject | null>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  error: Annotation<string | null>({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
});

export type SavedObjectsCreationStateType = typeof SavedObjectsCreationState.State;
