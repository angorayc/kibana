/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import * as React from 'react';
import { ExploratoryViewContextProvider, ExploratoryView } from '../../../../observability/public';
import {
  getSecurityKPIConfig,
  getSecurityEventOutcomeKPIConfig,
  getSecurityUniqueIpsKPIConfig,
} from './kpi_over_time_config';
import { RenderAppProps } from '../types';
import { getSecurityAlertsKPIConfig } from './alert_kpi_over_time_config';

export const reportConfigMap = {
  security: [getSecurityKPIConfig, getSecurityEventOutcomeKPIConfig, getSecurityUniqueIpsKPIConfig],
  securityAlerts: [getSecurityAlertsKPIConfig],
};

export const indexPatternList = {
  security:
    'apm-*-transaction*,traces-apm*,remote_cluster:auditbeat-*,endgame-*,remote_cluster:filebeat-*,remote_cluster:logs-*,packetbeat-*,winlogbeat-*,.alerts-security.alerts-default',
  securityAlerts: '.alerts-security.alerts-default-*',
};

export const dataTypes: any = [
  {
    id: 'security',
    label: 'Security',
  },
  {
    id: 'securityAlerts',
    label: 'Security alerts',
  },
];

export const reportTypes = [
  { reportType: 'kpi-over-time', label: 'KPI over time' },
  { reportType: 'event_outcome', label: 'bar' },
  { reportType: 'unique_ip', label: 'Unique IPs' },
];

export const SecurityExploratoryView = ({
  setHeaderActionMenu,
}: {
  setHeaderActionMenu: RenderAppProps['setHeaderActionMenu'];
}) => {
  return (
    <ExploratoryViewContextProvider
      reportTypes={reportTypes}
      dataTypes={dataTypes}
      indexPatterns={indexPatternList}
      reportConfigMap={reportConfigMap}
      setHeaderActionMenu={setHeaderActionMenu}
      asPanel={false}
    >
      <ExploratoryView app={{ id: 'security', label: 'Security' }} />
    </ExploratoryViewContextProvider>
  );
};
