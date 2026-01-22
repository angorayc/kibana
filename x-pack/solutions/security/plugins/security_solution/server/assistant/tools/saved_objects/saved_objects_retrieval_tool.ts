/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { tool } from '@langchain/core/tools';
import { z } from '@kbn/zod';
import { requestHasRequiredAnonymizationParams } from '@kbn/elastic-assistant-plugin/server/lib/langchain/helpers';
import type { AssistantTool, AssistantToolParams } from '@kbn/elastic-assistant-plugin/server';
import { contentReferenceString, savedObjectReference } from '@kbn/elastic-assistant-common';

import { APP_UI_ID } from '../../../../common';
import type { SavedObjectsToolParams } from './types';

export const SAVED_OBJECTS_RETRIEVAL_TOOL_DESCRIPTION =
  'Call this to retrieve saved objects from Kibana.';

export const SAVED_OBJECTS_RETRIEVAL_TOOL: AssistantTool = {
  id: 'saved_objects_retrieval_tool',
  name: 'Saved Objects Retrieval Tool',
  description: SAVED_OBJECTS_RETRIEVAL_TOOL_DESCRIPTION,
  sourceRegister: APP_UI_ID,
  isSupported: (params: AssistantToolParams): params is SavedObjectsToolParams => {
    const { request, savedObjectsClient } = params;
    return requestHasRequiredAnonymizationParams(request) && savedObjectsClient != null;
  },
  async getTool(params: AssistantToolParams) {
    if (!this.isSupported(params)) return null;

    const { savedObjectsClient, contentReferencesStore, assistantContext } =
      params as SavedObjectsToolParams;
    return tool(
      async (input) => {
        const spaceId = assistantContext.getSpaceId();
        const result = await savedObjectsClient.find({
          type: input.savedObjectType,
          namespaces: [spaceId],
        });

        const savedObjectContentReference = contentReferencesStore.add((p) =>
          savedObjectReference({ id: p.id })
        );

        const reference = `\n${contentReferenceString(savedObjectContentReference)}`;

        return `${JSON.stringify(result)}${reference}`;
      },
      {
        name: 'SavedObjectsRetrievalTool',
        description: params.description || SAVED_OBJECTS_RETRIEVAL_TOOL_DESCRIPTION,
        schema: z.object({
          savedObjectType: z.string().describe('The type of the saved object to retrieve.'),
        }),
        tags: ['saved_objects', 'saved-objects-retrieval-tool'],
      }
    );
  },
};
