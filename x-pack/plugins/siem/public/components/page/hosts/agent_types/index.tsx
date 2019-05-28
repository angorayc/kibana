/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { EuiIcon, EuiLoadingSpinner, EuiText, EuiToolTip } from '@elastic/eui';
// import moment from 'moment';
import React from 'react';
import { ApolloConsumer } from 'react-apollo';
import { pure } from 'recompose';
import { useAgentTypesHostQuery } from '../../../../containers/hosts/agent_types';
import { TimerangeInput } from '../../../../graphql/types';

// import { getEmptyTagValue } from '../../../empty_value';
// import { PreferenceFormattedDate } from '../../../formatted_date';
// import { LocalizedDateTooltip } from '../../../localized_date_tooltip';

export enum AgentTypesHostType {
  FIRST_SEEN = 'first-seen',
  LAST_SEEN = 'last-seen',
}

export const AgentTypesHost = pure<{
  loading: boolean;
  hostname: string;
  timerange: TimerangeInput;
}>(({ hostname, type }) => {
  return (
    <ApolloConsumer>
      {client => {
        const { loading, timerange, errorMessage } = useAgentTypesHostQuery(
          hostname,
          'default',
          timerange,
          client
        );
        if (errorMessage != null) {
          return (
            <EuiToolTip
              position="top"
              content={errorMessage}
              data-test-subj="agentTypesErrorToolTip"
              aria-label={`agentTypesError-${type}`}
              id={`agentTypesError-${hostname}-${type}`}
            >
              <EuiIcon aria-describedby={`agentTypesError-${hostname}-${type}`} type="alert" />
            </EuiToolTip>
          );
        }

        return <>Beats Ingest Analytics</>;
      }}
    </ApolloConsumer>
  );
});
