/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React, { useEffect } from 'react';
import { EuiSpacer } from '@elastic/eui';
import * as i18n from './translations';
import { AnomaliesQueryTabBodyProps } from './types';
import { getAnomaliesFilterQuery } from './utils';
import { useSiemJobs } from '../../../components/ml_popover/hooks/use_siem_jobs';
import { useUiSetting$ } from '../../../lib/kibana';
import { DEFAULT_ANOMALY_SCORE } from '../../../../common/constants';
import { MatrixHistogramContainer } from '../../matrix_histogram';
import { MatrixHistogramOption, HistogramType } from '../../../components/matrix_histogram/types';

const ID = 'anomaliesOverTimeQuery';
const anomaliesStackByOptions: MatrixHistogramOption[] = [
  {
    text: i18n.ANOMALIES_STACK_BY_JOB_ID,
    value: 'job_id',
  },
];

export const AnomaliesQueryTabBody = ({
  deleteQuery,
  endDate,
  setQuery,
  skip,
  startDate,
  type,
  narrowDateRange,
  filterQuery,
  anomaliesFilterQuery,
  updateDateRange = () => {},
  AnomaliesTableComponent,
  flowTarget,
  ip,
}: AnomaliesQueryTabBodyProps) => {
  const [, siemJobs] = useSiemJobs(true);
  const [anomalyScore] = useUiSetting$<number>(DEFAULT_ANOMALY_SCORE);

  const mergedFilterQuery = getAnomaliesFilterQuery(
    filterQuery,
    anomaliesFilterQuery,
    siemJobs,
    anomalyScore,
    flowTarget,
    ip
  );

  useEffect(() => {
    return () => {
      if (deleteQuery) {
        deleteQuery({ id: ID });
      }
    };
  }, []);

  return (
    <>
      <MatrixHistogramContainer
        defaultStackByOption={anomaliesStackByOptions[0]}
        endDate={endDate}
        errorMessage={i18n.ERROR_FETCHING_ANOMALIES_DATA}
        filterQuery={mergedFilterQuery}
        hideHistogramIfEmpty={true}
        histogramType={HistogramType.anomalies}
        id={ID}
        setQuery={setQuery}
        sourceId="default"
        stackByOptions={anomaliesStackByOptions}
        startDate={startDate}
        title={i18n.ANOMALIES_TITLE}
        type={type}
        updateDateRange={updateDateRange}
      />
      <EuiSpacer />
      <AnomaliesTableComponent
        startDate={startDate}
        endDate={endDate}
        skip={skip}
        type={type as never}
        narrowDateRange={narrowDateRange}
        flowTarget={flowTarget}
        ip={ip}
      />
    </>
  );
};

AnomaliesQueryTabBody.displayName = 'AnomaliesQueryTabBody';
