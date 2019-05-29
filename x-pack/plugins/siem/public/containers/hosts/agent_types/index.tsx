/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import ApolloClient from 'apollo-client';
import { useEffect, useState } from 'react';
import chrome from 'ui/chrome';
import { get } from 'lodash/fp';
import { DEFAULT_INDEX_KEY } from '../../../../common/constants';
import { HostAgentTypesGqlQuery } from './agent_types.gql_query';
import { GetHostAgentTypesQuery } from '../../../graphql/types';

export function useAgentTypesHostQuery<TCache = object>(
  // hostName: string,
  sourceId: string,
  startDate: number,
  endDate: number,
  apolloClient: ApolloClient<TCache>
) {
  const [loading, updateLoading] = useState(false);
  const [auditbeatCount, updateAuditbeatCount] = useState(null);
  const [errorMessage, updateErrorMessage] = useState(null);

  async function fetchAgentTypes() {
    updateLoading(true);
    return apolloClient
      .query<GetHostAgentTypesQuery.Query, GetHostAgentTypesQuery.Variables>({
        query: HostAgentTypesGqlQuery,
        fetchPolicy: 'cache-first',
        variables: {
          sourceId,
          // hostName,
          timerange: {
            interval: '12h',
            from: startDate,
            to: endDate,
          },
          defaultIndex: chrome.getUiSettingsClient().get(DEFAULT_INDEX_KEY),
        },
      })
      .then(
        result => {
          updateLoading(false);
          updateAuditbeatCount(get('data.source.HostFirstLastSeen.firstSeen', result));
          updateErrorMessage(null);
          return result;
        },
        error => {
          updateLoading(false);
          updateErrorMessage(error.message);
          return error;
        }
      );
  }

  useEffect(() => {
    try {
      fetchAgentTypes();
    } catch (err) {
      updateAuditbeatCount(null);
      updateErrorMessage(err.toString());
    }
  }, []);

  return { auditbeatCount, loading, errorMessage };
}
