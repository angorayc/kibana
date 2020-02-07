/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { getOr, noop } from 'lodash/fp';
import React, { useEffect, useMemo } from 'react';
import { AuthenticationTable } from '../../../components/page/hosts/authentications_table';
import { manageQuery } from '../../../components/page/manage_query';
import { AuthenticationsQuery } from '../../../containers/authentications';
import { HostsComponentsQueryProps } from './types';
import { hostsModel } from '../../../store/hosts';
import {
  MatrixHistogramOption,
  MatrixHistogramMappingTypes,
  HistogramType,
} from '../../../components/matrix_histogram/types';
import { MatrixHistogramContainer } from '../../../components/matrix_histogram';
import { KpiHostsChartColors } from '../../../components/page/hosts/kpi_hosts/types';
import * as i18n from '../translations';

const AuthenticationTableManage = manageQuery(AuthenticationTable);
const ID = 'authenticationsOverTimeQuery';
const authStackByOptions: MatrixHistogramOption[] = [
  {
    text: 'event.type',
    value: 'event.type',
  },
];

enum AuthMatrixDataGroup {
  authSuccess = 'authentication_success',
  authFailure = 'authentication_failure',
}

export const authMatrixDataMappingFields: MatrixHistogramMappingTypes = {
  [AuthMatrixDataGroup.authSuccess]: {
    key: AuthMatrixDataGroup.authSuccess,
    value: null,
    color: KpiHostsChartColors.authSuccess,
  },
  [AuthMatrixDataGroup.authFailure]: {
    key: AuthMatrixDataGroup.authFailure,
    value: null,
    color: KpiHostsChartColors.authFailure,
  },
};

const histogramConfigs = {
  defaultStackByOption: authStackByOptions[0],
  errorMessage: i18n.ERROR_FETCHING_AUTHENTICATIONS_DATA,
  histogramType: 'authentications' as HistogramType,
  mapping: authMatrixDataMappingFields,
  stackByOptions: authStackByOptions,
  title: i18n.NAVIGATION_AUTHENTICATIONS_TITLE,
  updateDateRange: noop,
};

export const AuthenticationsQueryTabBody = ({
  deleteQuery,
  endDate,
  filterQuery,
  skip,
  setQuery,
  startDate,
  type,
  updateDateRange = noop,
}: HostsComponentsQueryProps) => {
  useEffect(() => {
    return () => {
      if (deleteQuery) {
        deleteQuery({ id: ID });
      }
    };
  }, [deleteQuery]);

  const authHistogramConfigs = useMemo(
    () => ({
      ...histogramConfigs,
      updateDateRange,
    }),
    [updateDateRange]
  );
  return (
    <>
      <MatrixHistogramContainer
        endDate={endDate}
        filterQuery={filterQuery}
        id={ID}
        setQuery={setQuery}
        sourceId="default"
        startDate={startDate}
        type={hostsModel.HostsType.page}
        {...authHistogramConfigs}
      />
      <AuthenticationsQuery
        endDate={endDate}
        filterQuery={filterQuery}
        skip={skip}
        sourceId="default"
        startDate={startDate}
        type={type}
      >
        {({
          authentications,
          totalCount,
          loading,
          pageInfo,
          loadPage,
          id,
          inspect,
          isInspected,
          refetch,
        }) => (
          <AuthenticationTableManage
            data={authentications}
            deleteQuery={deleteQuery}
            fakeTotalCount={getOr(50, 'fakeTotalCount', pageInfo)}
            id={id}
            inspect={inspect}
            isInspect={isInspected}
            loading={loading}
            loadPage={loadPage}
            refetch={refetch}
            showMorePagesIndicator={getOr(false, 'showMorePagesIndicator', pageInfo)}
            setQuery={setQuery}
            totalCount={totalCount}
            type={type}
          />
        )}
      </AuthenticationsQuery>
    </>
  );
};

AuthenticationsQueryTabBody.displayName = 'AuthenticationsQueryTabBody';
