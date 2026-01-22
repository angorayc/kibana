/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { Require } from '@kbn/elastic-assistant-plugin/server/types';
import type { AssistantToolParams } from '@kbn/elastic-assistant-plugin/server';

export type SavedObjectsToolParams = Require<
  AssistantToolParams,
  'savedObjectsClient' | 'assistantContext'
>;

export type SavedObjectsCreationToolParams = Require<
  AssistantToolParams,
  'savedObjectsClient' | 'assistantContext' | 'esClient' | 'logger'
>;

export interface DocumentCheckResult {
  lensTitle: string;
  savedObjectId?: string;
  indexTitle?: string;
  query?: string;
  filter?: string;
  total: number;
}
