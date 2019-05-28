/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { HostAgentTypesRequestOptions } from './types';

export const buildHostAgentTypesQuery = ({
  fields,
  hostName,
  defaultIndex,
  sourceConfiguration: {
    fields: { timestamp },
  },
  timerange: { from, to },
}: HostAgentTypesRequestOptions) => {
  const filter = [
    { term: { 'host.name': hostName } },
    {
      range: {
        [timestamp]: {
          gte: from,
          lte: to,
        },
      },
    },
    { exists: { field: 'agent.type' } },
  ];

  const dslQuery = {
    allowNoIndices: true,
    index: defaultIndex,
    ignoreUnavailable: true,
    body: {
      aggregations: {
        agentTypes: { terms: { field: 'agent.type' } },
      },
      query: { bool: { filter } },
      size: 0,
      track_total_hits: false,
    },
  };

  return dslQuery;
};
