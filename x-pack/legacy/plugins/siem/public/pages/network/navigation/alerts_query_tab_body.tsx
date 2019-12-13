/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React from 'react';
import { AlertsView } from '../../../components/alerts_viewer';
import { NetworkComponentQueryProps } from './types';

export const NetworkAlertsQueryTabBody = React.memo((alertsProps: NetworkComponentQueryProps) => (
  <AlertsView
    {...alertsProps}
    pageFilters={[
      {
        bool: {
          should: [
            {
              exists: {
                field: 'source.ip',
              },
            },
          ],
          minimum_should_match: 1,
        },
      },
      {
        bool: {
          should: [
            {
              exists: {
                field: 'destination.ip',
              },
            },
          ],
          minimum_should_match: 1,
        },
      },
    ]}
  />
));

NetworkAlertsQueryTabBody.displayName = 'NetworkAlertsQueryTabBody';
