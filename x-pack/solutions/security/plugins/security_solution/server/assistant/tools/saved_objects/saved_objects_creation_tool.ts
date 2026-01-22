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
import type { SavedObjectsCreationToolParams } from './types';
import { getSavedObjectsCreationGraph } from './graph';

export const SAVED_OBJECTS_CREATION_TOOL_DESCRIPTION = `
Create a Lens saved object for security analysis with the following specifications:
- Visualization purpose: Security monitoring and analysis
- Time range: Last 7 days
- Visualization type: Choose the most appropriate type for security analysis
- Security focus: Highlight anomalous patterns, unusual activities, or suspicious events
- Make it useful for a security analyst's daily monitoring workflow
Please follow this process:
1. First use SavedObjectsRetrievalTool to check if similar objects exist before creating new ones
2. Review the results to see duplicates
3. If duplicates found, do not create new objects
4. If no duplicates, use SavedObjectsCreationTool with retrievedSavedObjects parameter
5. Use the retrieved index-pattern saved objects to decide the index pattern id in attribute.references
6. Pick the index pattern that matches smallest indices (don't hardcode a specific data source)
7. Use the inspect_index_mapping tool to get the available fields for the kql query
8. Create with a visualization type that best presents the fields in the selected index pattern from a security analyst's perspective
9. Select relevant fields based on the chosen index pattern that would be most valuable for security analysis
10. Ensure that titles and description don't include specific time ranges (like "last 7 days").
`;

export const SAVED_OBJECTS_CREATION_TOOL: AssistantTool = {
  id: 'saved_objects_creation_tool',
  name: 'Saved Objects Creation Tool',
  description: SAVED_OBJECTS_CREATION_TOOL_DESCRIPTION,
  sourceRegister: APP_UI_ID,
  isSupported: (params: AssistantToolParams): params is SavedObjectsCreationToolParams => {
    const { request, savedObjectsClient, esClient } = params;
    return (
      requestHasRequiredAnonymizationParams(request) &&
      savedObjectsClient != null &&
      esClient != null
    );
  },
  async getTool(params: AssistantToolParams) {
    if (!this.isSupported(params)) return null;

    const { savedObjectsClient, contentReferencesStore, assistantContext, logger, esClient } =
      params as SavedObjectsCreationToolParams;

    // Create the LangGraph instance
    const graph = await getSavedObjectsCreationGraph({
      savedObjectsClient,
      esClient,
      logger,
    });

    return tool(
      async (input) => {
        const spaceId = assistantContext.getSpaceId();

        // Invoke the graph with initial state
        const finalState = await graph.invoke({
          fields: input.fields || {},
          savedObject: input.savedObject,
          retrievedSavedObjects: input.retrievedSavedObjects || [],
          spaceId,
        });

        // Handle analysis stopping creation (duplicates found)
        if (finalState.analysisResult && !finalState.analysisResult.shouldProceed) {
          // const warningMessage = `Analysis suggests not proceeding: ${finalState.analysisResult.recommendations.join(
          //   ', '
          // )}`;
          // logger.warn(warningMessage);
          return JSON.stringify({
            success: false,
            // warning: warningMessage,
            analysisResult: finalState.analysisResult,
          });
        }

        // Handle validation errors
        if (!finalState.validated || finalState.validationErrors.length > 0) {
          const errorMessage = `Validation failed: ${finalState.validationErrors.join(', ')}`;
          logger.error(errorMessage);
          return JSON.stringify({
            success: false,
            error: errorMessage,
            validationErrors: finalState.validationErrors,
          });
        }

        // Handle creation errors
        if (finalState.error) {
          logger.error(`Creation failed: ${finalState.error}`);
          return JSON.stringify({
            success: false,
            error: finalState.error,
          });
        }

        // Success - track references and return result
        if (finalState.result != null) {
          const savedObjectContentReference = contentReferencesStore.add((p) =>
            savedObjectReference({
              id: p.id,
              savedObjectType: finalState.result?.type,
              savedObjectId: finalState.result?.id,
              savedObjectTitle: finalState.result?.attributes?.title,
            })
          );

          const reference = `\n${contentReferenceString(savedObjectContentReference)}`;

          return `${JSON.stringify({
            result: finalState.result,
            success: true,
            // generatedReferencesArray: finalState.generatedReferencesArray,
          })}${reference}`;
        }

        // Unexpected state
        return JSON.stringify({
          success: false,
          error: 'Unexpected error: No result or error in final state',
        });
      },
      {
        name: 'SavedObjectsCreationTool',
        description: params.description || SAVED_OBJECTS_CREATION_TOOL_DESCRIPTION,
        schema: z.object({
          fields: z.record(z.unknown()).default({}),
          retrievedSavedObjects: z
            .array(z.any())
            .optional()
            .describe(
              'Optional array of saved objects retrieved from the saved objects retrieval tool. Used to detect duplicates and analyze relationships before creation.'
            ),
          savedObject: z.object({
            /** Optional ID of the object to create (the ID is generated by default) */
            id: z
              .string()
              .describe('Optional ID of the object to create (the ID is generated by default)'),
            /** The type of object to create */
            type: z.string().describe('The type of object to create'),
            /** The attributes for the object to create */
            attributes: z
              .record(z.unknown())
              .default({})
              .describe('The attributes for the object to create'),
            /** The version string for the object to create */
            version: z.string().describe('The version string for the object to create').optional(),
            /** Array of references to other saved objects */
            references: z
              .array(
                z.object({
                  id: z.string(),
                  type: z.string(),
                  name: z.string(),
                })
              )
              .describe('Array of references to other saved objects')
              .optional(),
            /**
             * {@inheritDoc SavedObjectsMigrationVersion}
             * @deprecated
             */
            migrationVersion: z
              .record(z.string())
              .describe('Deprecated: use typeMigrationVersion instead')
              .optional(),
            /**
             * A semver value that is used when upgrading objects between Kibana versions. If undefined, this will be automatically set to the current
             * Kibana version when the object is created. If this is set to a non-semver value, or it is set to a semver value greater than the
             * current Kibana version, it will result in an error.
             *
             * @remarks
             * Do not attempt to set this manually. It should only be used if you retrieved an existing object that had the `coreMigrationVersion`
             * field set and you want to create it again.
             */
            coreMigrationVersion: z
              .string()
              .describe('A semver value used when upgrading objects between Kibana versions')
              .optional(),
            /** A semver value that is used when migrating documents between Kibana versions. */
            typeMigrationVersion: z
              .string()
              .describe('A semver value used when migrating documents between Kibana versions')
              .optional(),
            /** Optional ID of the original saved object, if this object's `id` was regenerated */
            originId: z
              .string()
              .describe(
                "Optional ID of the original saved object, if this object's `id` was regenerated"
              )
              .optional(),
            /**
             * Optional initial namespaces for the object to be created in. If this is defined, it will supersede the namespace ID that is in
             * {@link SavedObjectsCreateOptions}.
             *
             * * For shareable object types (registered with `namespaceType: 'multiple'`): this option can be used to specify one or more spaces,
             *   including the "All spaces" identifier (`'*'`).
             * * For isolated object types (registered with `namespaceType: 'single'` or `namespaceType: 'multiple-isolated'`): this option can only
             *   be used to specify a single space, and the "All spaces" identifier (`'*'`) is not allowed.
             * * For global object types (registered with `namespaceType: 'agnostic'`): this option cannot be used.
             */
            initialNamespaces: z
              .array(z.string())
              .describe('Optional initial namespaces for the object to be created in')
              .optional(),
            /**
             * Flag indicating if a saved object is managed by Kibana (default=false)
             *
             * This can be leveraged by applications to e.g. prevent edits to a managed
             * saved object. Instead, users can be guided to create a copy first and
             * make their edits to the copy.
             */
            managed: z
              .boolean()
              .describe('Flag indicating if a saved object is managed by Kibana')
              .default(false)
              .optional(),
            /**
             * The access control settings for the object
             *
             * We specifically exclude the owner property, as that is set during the operation
             * using the current user's profile ID.
             */
            accessControl: z
              .object({
                accessMode: z
                  .enum(['write_restricted', 'default'])
                  .describe('The access mode for the object'),
              })
              .describe('The access control settings for the object')
              .optional(),
          }),
        }),
        tags: ['saved_objects', 'saved-objects-creation-tool'],
      }
    );
  },
};
