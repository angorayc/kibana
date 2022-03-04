/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';

import { StatItems } from '../../../../common/components/stat_items';
import { kpiHostArea } from '../../../../common/components/visualization_actions/configs/hosts/kpi_host_area';
import { kpiHostMetric } from '../../../../common/components/visualization_actions/configs/hosts/kpi_host_metric';
import { useHostsKpiHosts } from '../../../containers/kpi_hosts/hosts';
import { HostsKpiBaseComponentManage } from '../common';
import { HostsKpiProps, HostsKpiChartColors } from '../types';
import * as i18n from './translations';

export const fieldsMapping: Readonly<StatItems[]> = [
  {
    key: 'hosts',
    fields: [
      {
        key: 'hosts',
        value: null,
        color: HostsKpiChartColors.hosts,
        icon: 'storage',
        lensAttributes: kpiHostMetric,
      },
    ],
    enableAreaChart: true,
    description: i18n.HOSTS,
    areaChartLensAttributes: kpiHostArea,
  },
];

const HostsKpiHostsComponent: React.FC<HostsKpiProps> = ({
  filterQuery,
  from,
  indexNames,
  to,
  narrowDateRange,
  setQuery,
  skip,
}) => {
  const [loading, { refetch, id, inspect, ...data }] = useHostsKpiHosts({
    filterQuery,
    endDate: to,
    indexNames,
    startDate: from,
    skip,
  });

  return (
    <HostsKpiBaseComponentManage
      data={data}
      id={id}
      inspect={inspect}
      loading={loading}
      fieldsMapping={fieldsMapping}
      from={from}
      to={to}
      narrowDateRange={narrowDateRange}
      refetch={refetch}
      setQuery={setQuery}
      showInspectButton={false}
    />
  );
};

export const HostsKpiHosts = React.memo(HostsKpiHostsComponent);
