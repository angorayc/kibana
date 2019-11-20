/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React from 'react';
import { EuiSpacer } from '@elastic/eui';
import { AnomaliesQueryTabBodyProps } from './types';
import { manageQuery } from '../../../components/page/manage_query';
import { AnomaliesOverTimeHistogram } from '../../../components/anomalies_over_time';
import { AnomaliesOverTimeQuery } from '../anomalies_over_time';
import { getAnomaliesFilterQuery } from './utils';
import { useSiemJobs } from '../../../components/ml_popover/hooks/use_siem_jobs';
import { useKibanaUiSetting } from '../../../lib/settings/use_kibana_ui_setting';
import { DEFAULT_ANOMALY_SCORE } from '../../../../common/constants';
import { SiemPageName } from '../../../pages/home/types';
import { NetworkType } from '../../../store/network/model';
import { AnomaliesNetworkTable } from '../../../components/ml/tables/anomalies_network_table';
import { AnomaliesHostTable } from '../../../components/ml/tables/anomalies_host_table';
import { HostsType } from '../../../store/hosts/model';

const AnomaliesOverTimeManage = manageQuery(AnomaliesOverTimeHistogram);

export const AnomaliesQueryTabBody = ({
  anomaliesFilterQuery,
  endDate,
  filterQuery,
  flowTarget,
  hideHistogramIfEmpty,
  ip,
  narrowDateRange,
  page,
  setQuery,
  skip,
  startDate,
  type,
  updateDateRange = () => {},
}: AnomaliesQueryTabBodyProps) => {
  const [siemJobsLoading, siemJobs] = useSiemJobs(true);
  const [anomalyScore] = useKibanaUiSetting(DEFAULT_ANOMALY_SCORE);
  const isNetwork = (
    pageName: SiemPageName,
    pageType: HostsType | NetworkType
  ): pageType is NetworkType => {
    return pageName === SiemPageName.network;
  };

  const isHosts = (
    pageName: SiemPageName,
    pageType: HostsType | NetworkType
  ): pageType is HostsType => {
    return pageName === SiemPageName.hosts;
  };
  const mergedFilterQuery = getAnomaliesFilterQuery(
    filterQuery,
    anomaliesFilterQuery,
    siemJobs,
    anomalyScore,
    flowTarget,
    ip
  );

  return (
    <>
      <AnomaliesOverTimeQuery
        endDate={endDate}
        filterQuery={mergedFilterQuery}
        sourceId="default"
        startDate={startDate}
        type={type}
      >
        {({ anomaliesOverTime, loading, id, inspect, refetch, totalCount }) => {
          if (hideHistogramIfEmpty && !anomaliesOverTime.length) {
            return <div />;
          }

          return (
            <>
              <AnomaliesOverTimeManage
                data={anomaliesOverTime!}
                endDate={endDate}
                id={id}
                inspect={inspect}
                loading={siemJobsLoading || loading}
                refetch={refetch}
                setQuery={setQuery}
                startDate={startDate}
                totalCount={totalCount}
                updateDateRange={updateDateRange}
              />
              <EuiSpacer />
            </>
          );
        }}
      </AnomaliesOverTimeQuery>

      {isNetwork(page, type) && (
        <AnomaliesNetworkTable
          startDate={startDate}
          endDate={endDate}
          skip={skip}
          type={type}
          narrowDateRange={narrowDateRange}
          flowTarget={flowTarget}
          ip={ip}
        />
      )}
      {isHosts(page, type) && (
        <AnomaliesHostTable
          startDate={startDate}
          endDate={endDate}
          skip={skip}
          type={type}
          narrowDateRange={narrowDateRange}
        />
      )}
    </>
  );
};

AnomaliesQueryTabBody.displayName = 'AnomaliesQueryTabBody';
