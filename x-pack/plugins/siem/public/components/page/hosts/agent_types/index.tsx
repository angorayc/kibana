/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { EuiIcon, EuiLoadingSpinner, EuiText, EuiToolTip } from '@elastic/eui';
// import moment from 'moment';
import React from 'react';
import { ApolloConsumer } from 'react-apollo';
import { Refetch } from '../../../../store/inputs/model';
import { useAgentTypesHostQuery } from '../../../../containers/hosts/agent_types';

// import { getEmptyTagValue } from '../../../empty_value';
// import { PreferenceFormattedDate } from '../../../formatted_date';
// import { LocalizedDateTooltip } from '../../../localized_date_tooltip';

export const AgentTypesHost = React.memo<{
  endDate: number;
  startDate: number;
  setQuery: {
    id: string;
    loading: boolean;
    refresh: Refetch;
  };
}>(({ endDate, startDate, setQuery }) => {
  return (
    <ApolloConsumer>
      {client => {
        const { auditbeatCount, errorMessage } = useAgentTypesHostQuery(
          'default',
          startDate,
          endDate,
          client
        );
        if (errorMessage != null) {
          return (
            <EuiToolTip
              position="top"
              content={auditbeatCount}
              data-test-subj="agentTypesBeatsAnalyticToolTip"
              aria-label={`agentTypesBeatsAnalyticToolTip`}
              id={`agentTypesBeatsAnalyticToolTip`}
            >
              <EuiIcon aria-describedby={`agentTypesBeatsAnalyticToolTip`} type="alert" />
            </EuiToolTip>
          );
        }

        return <>Beats Ingest Analytics</>;
      }}
    </ApolloConsumer>
  );
});
