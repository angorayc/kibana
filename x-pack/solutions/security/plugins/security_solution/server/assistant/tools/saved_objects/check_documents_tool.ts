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
import type { Require } from '@kbn/elastic-assistant-plugin/server/types';

import { APP_UI_ID } from '../../../../common';

export type CheckDocumentsToolParams = Require<
  AssistantToolParams,
  'assistantContext' | 'esClient' | 'logger'
>;

const TOOL_NAME = 'CheckDocumentsTool';

const TOOL_DESCRIPTION = `Call this to check whether any documents match a KQL query (with optional filter) in one or more indices. Returns hit count, whether any documents exist, and a sample _source.`;

export const CHECK_DOCUMENTS_TOOL: AssistantTool = {
  id: 'check-documents-tool',
  name: TOOL_NAME,
  description: TOOL_DESCRIPTION,
  sourceRegister: APP_UI_ID,
  isSupported: (params: AssistantToolParams): params is CheckDocumentsToolParams => {
    const { request, assistantContext, esClient } = params;
    return (
      requestHasRequiredAnonymizationParams(request) && assistantContext != null && esClient != null
    );
  },
  async getTool(params: AssistantToolParams) {
    if (!this.isSupported(params)) return null;

    const { assistantContext, esClient, logger } = params as CheckDocumentsToolParams;

    return tool(
      async ({ index, kql, filter }) => {
        const spaceId = assistantContext.getSpaceId();

        try {
          const must = [
            {
              query_string: {
                query: kql,
                default_operator: 'AND',
              },
            },
          ];

          if (filter && filter.trim().length > 0) {
            must.push({
              query_string: {
                query: filter,
                default_operator: 'AND',
              },
            });
          }

          const response = await esClient.count({
            index,
            querystring: {
              must,
            },
          });

          const count = response.count;

          return JSON.stringify({
            success: true,
            spaceId,
            hasDocuments: count > 0,
            total: count,
          });
        } catch (err) {
          logger.error(`check_documents_tool search failed: ${err}`);
          return JSON.stringify({
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error',
            spaceId,
          });
        }
      },
      {
        name: TOOL_NAME,
        description: params.description || TOOL_DESCRIPTION,
        schema: z.object({
          index: z
            .union([z.string(), z.array(z.string())])
            .describe(
              'Index or indices to search (for example, logs-*, metrics-*, or a specific index name).'
            ),
          kql: z.string().describe('The KQL query that must match.'),
          filter: z
            .string()
            .describe('Optional additional KQL filter combined with AND logic.')
            .optional(),
        }),
        tags: ['search', 'kql', 'documents'],
      }
    );
  },
};
