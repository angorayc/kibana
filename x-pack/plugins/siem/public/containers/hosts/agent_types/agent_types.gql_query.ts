/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import gql from 'graphql-tag';

export const HostAgentTypesGqlQuery = gql`
  query GetHostAgentTypesQuery(
    $sourceId: ID!
    $timerange: TimerangeInput!
    $defaultIndex: [String!]!
  ) {
    source(id: $sourceId) {
      id
      HostAgentTypes(timerange: $timerange, defaultIndex: $defaultIndex) {
        hostAuditbeatCount
        hostWinlogbeatsCount
        hostFilebeatsCount
      }
    }
  }
`;
