/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { getOr } from 'lodash/fp';
import { EuiFlexItem, EuiPanel, EuiSelect, EuiSpacer } from '@elastic/eui';

import { NetworkDnsTable } from '../../components/network_dns_table';
import { useNetworkDns } from '../../containers/network_dns';
import { manageQuery } from '../../../common/components/page/manage_query';

import { NetworkComponentQueryProps } from './types';

import {
  MatrixHistogramOption,
  MatrixHistogramConfigs,
} from '../../../common/components/matrix_histogram/types';
import * as i18n from '../translations';
import { MatrixHistogram } from '../../../common/components/matrix_histogram';
import { MatrixHistogramType } from '../../../../common/search_strategy/security_solution';
import { networkSelectors } from '../../store';
import { useDeepEqualSelector, useShallowEqualSelector } from '../../../common/hooks/use_selector';
import { STACK_BY } from '../../../common/components/matrix_histogram/translations';
import { useSourcererDataView } from '../../../common/containers/sourcerer';
import { dnsTopDomainsAttrs } from '../../configs/dns_top_domains';
import { EmbeddableHistogram } from '../../../common/components/matrix_histogram/embeddable_histogram';
import { inputsSelectors } from '../../../common/store/inputs';

const HISTOGRAM_ID = 'networkDnsHistogramQuery';

const NetworkDnsTableManage = manageQuery(NetworkDnsTable);

const dnsStackByOptions: MatrixHistogramOption[] = [
  {
    text: 'dns.question.registered_domain',
    value: 'dns.question.registered_domain',
  },
];

const DEFAULT_STACK_BY = 'dns.question.registered_domain';

export const histogramConfigs: Omit<MatrixHistogramConfigs, 'title'> = {
  defaultStackByOption:
    dnsStackByOptions.find((o) => o.text === DEFAULT_STACK_BY) ?? dnsStackByOptions[0],
  errorMessage: i18n.ERROR_FETCHING_DNS_DATA,
  histogramType: MatrixHistogramType.dns,
  stackByOptions: dnsStackByOptions,
  subtitle: undefined,
  lensAttributes: dnsTopDomainsAttrs,
};

const DnsQueryTabBodyComponent: React.FC<NetworkComponentQueryProps> = ({
  deleteQuery,
  docValueFields,
  endDate,
  filterQuery,
  indexNames,
  skip,
  startDate,
  setQuery,
  type,
}) => {
  const getNetworkDnsSelector = networkSelectors.dnsSelector();

  const isPtrIncluded = useShallowEqualSelector(
    (state) => getNetworkDnsSelector(state).isPtrIncluded
  );

  const [selectedStackByOption, setSelectedStackByOption] = useState<MatrixHistogramOption>(
    histogramConfigs.defaultStackByOption
  );

  const setSelectedChartOptionCallback = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      setSelectedStackByOption(
        histogramConfigs.stackByOptions.find((co) => co.value === event.target.value) ??
          histogramConfigs.defaultStackByOption
      );
    },
    []
  );

  useEffect(() => {
    return () => {
      if (deleteQuery) {
        deleteQuery({ id: HISTOGRAM_ID });
      }
    };
  }, [deleteQuery]);

  const [
    loading,
    { totalCount, networkDns, pageInfo, loadPage, id, inspect, isInspected, refetch },
  ] = useNetworkDns({
    docValueFields: docValueFields ?? [],
    endDate,
    filterQuery,
    indexNames,
    skip,
    startDate,
    type,
  });

  const title = useMemo(
    () => i18n.DOMAINS_COUNT_BY(selectedStackByOption.text),
    [selectedStackByOption.text]
  );

  const dnsHistogramConfigs: MatrixHistogramConfigs = useMemo(
    () => ({
      ...histogramConfigs,
      title,
    }),
    [title]
  );

  const appendTitle = useMemo(
    () => (
      <EuiFlexItem grow={false}>
        {histogramConfigs.stackByOptions.length > 1 && (
          <EuiSelect
            onChange={setSelectedChartOptionCallback}
            options={histogramConfigs.stackByOptions}
            prepend={STACK_BY}
            value={selectedStackByOption?.value}
            compressed={true}
          />
        )}
      </EuiFlexItem>
    ),
    [selectedStackByOption?.value, setSelectedChartOptionCallback]
  );
  return (
    <>
      <MatrixHistogram
        id={HISTOGRAM_ID}
        isPtrIncluded={isPtrIncluded}
        docValueFields={docValueFields}
        endDate={endDate}
        filterQuery={filterQuery}
        indexNames={indexNames}
        setQuery={setQuery}
        showLegend={true}
        startDate={startDate}
        showInspectButton={false}
        {...dnsHistogramConfigs}
      />
      <EuiPanel color="transparent" hasBorder style={{ height: 300 }}>
        <EmbeddableHistogram
          appendTitle={appendTitle}
          title={title}
          customLensAttrs={dnsTopDomainsAttrs}
          customTimeRange={{ from: startDate, to: endDate }}
          isSingleMetric={false}
        />
      </EuiPanel>

      <EuiSpacer />
      <NetworkDnsTableManage
        data={networkDns}
        fakeTotalCount={getOr(50, 'fakeTotalCount', pageInfo)}
        id={id}
        inspect={inspect}
        isInspect={isInspected}
        loading={loading}
        loadPage={loadPage}
        refetch={refetch}
        setQuery={setQuery}
        showMorePagesIndicator={getOr(false, 'showMorePagesIndicator', pageInfo)}
        totalCount={totalCount}
        type={type}
      />
    </>
  );
};

DnsQueryTabBodyComponent.displayName = 'DnsQueryTabBodyComponent';

export const DnsQueryTabBody = React.memo(DnsQueryTabBodyComponent);
