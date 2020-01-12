/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ScaleType } from '@elastic/charts';

import darkTheme from '@elastic/eui/dist/eui_theme_dark.json';
import lightTheme from '@elastic/eui/dist/eui_theme_light.json';
import { EuiLoadingContent, EuiSelect } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { noop } from 'lodash/fp';
import { BarChart } from '../charts/barchart';
import { HeaderSection } from '../header_section';
import { DEFAULT_DARK_MODE } from '../../../common/constants';
import { useUiSetting$ } from '../../lib/kibana';
import { Loader } from '../loader';
import { Panel } from '../panel';
import { getBarchartConfigs, getCustomChartData } from '../../components/matrix_histogram/utils';
import { useQuery } from '../../containers/matrix_histogram/utils';
import {
  MatrixHistogramProps,
  MatrixHistogramOption,
  HistogramAggregation,
  MatrixHistogramQueryProps,
} from './types';
import { generateTablePaginationOptions } from '../paginated_table/helpers';
import { ChartSeriesData } from '../charts/common';

export const MatrixHistogram = React.memo(
  ({
    activePage,
    alertsType,
    anomaliesType,
    authenticationsType,
    dataKey,
    defaultStackByOption,
    endDate,
    eventsType,
    filterQuery,
    hideHistogramIfEmpty = false,
    id,
    isPtrIncluded,
    isInspected,
    limit,
    mapping,
    query,
    scaleType = ScaleType.Time,
    setQuery,
    showLegend,
    skip,
    stackByOptions,
    startDate,
    subtitle,
    title,
    updateDateRange,
    yTickFormatter,
    sort,
  }: MatrixHistogramProps & MatrixHistogramQueryProps) => {
    const barchartConfigs = getBarchartConfigs({
      from: startDate,
      to: endDate,
      onBrushEnd: updateDateRange,
      scaleType,
      yTickFormatter,
      showLegend,
    });
    const [showInspect, setShowInspect] = useState(false);
    const [darkMode] = useUiSetting$<boolean>(DEFAULT_DARK_MODE);

    const handleOnMouseEnter = useCallback(() => {
      if (!showInspect) {
        setShowInspect(true);
      }
    }, [showInspect]);
    const handleOnMouseLeave = useCallback(() => {
      if (showInspect) {
        setShowInspect(false);
      }
    }, [showInspect]);

    const [selectedStackByOption, setSelectedStackByOption] = useState<MatrixHistogramOption>(
      defaultStackByOption
    );
    const [subtitleWithCounts, setSubtitle] = useState(subtitle);
    const [hideHistogram, setHideHistogram] = useState<boolean>(hideHistogramIfEmpty);
    const [barChartData, setBarChartData] = useState<ChartSeriesData[] | null>(null);
    const setSelectedChatOptionCallback = useCallback(
      (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedStackByOption(
          stackByOptions?.find(co => co.value === event.target.value) ?? defaultStackByOption
        );
      },
      []
    );
    const getPagination = () =>
      activePage != null && limit != null
        ? generateTablePaginationOptions(activePage, limit)
        : undefined;

    const { data, loading, inspect, totalCount, refetch = noop } = useQuery<
      {},
      HistogramAggregation
    >({
      alertsType,
      anomaliesType,
      authenticationsType,
      dataKey,
      endDate,
      eventsType,
      filterQuery,
      query,
      skip,
      startDate,
      sort,
      title,
      isInspected,
      isPtrIncluded,
      isHistogram: true,
      pagination: useMemo(() => getPagination(), [activePage, limit]),
      stackByField: selectedStackByOption.value,
    });

    useEffect(() => {
      const formattedSubTitle = subtitle?.replace('{{totalCount}}', totalCount.toString());
      setSubtitle(formattedSubTitle);

      if (totalCount <= 0) {
        if (hideHistogramIfEmpty) setHideHistogram(true);
        else setHideHistogram(false);
      } else {
        setHideHistogram(false);
      }

      setBarChartData(getCustomChartData(data, mapping));

      setQuery({ id, inspect, loading, refetch });
    }, [totalCount, isInspected, loading, data]);

    return !hideHistogram ? (
      <Panel
        data-test-subj={`${id}Panel`}
        loading={loading}
        onMouseEnter={handleOnMouseEnter}
        onMouseLeave={handleOnMouseLeave}
      >
        <HeaderSection
          id={id}
          title={
            title && selectedStackByOption ? `${title} by ${selectedStackByOption.text}` : null
          }
          showInspect={showInspect}
          subtitle={!loading && (totalCount >= 0 ? subtitleWithCounts : null)}
        >
          {stackByOptions && (
            <EuiSelect
              onChange={setSelectedChatOptionCallback}
              options={stackByOptions}
              prepend={i18n.translate(
                'xpack.siem.detectionEngine.signals.histogram.stackByOptions.stackByLabel',
                {
                  defaultMessage: 'Stack by',
                }
              )}
              value={selectedStackByOption?.value}
            />
          )}
        </HeaderSection>
        {loading ? (
          <EuiLoadingContent data-test-subj="initialLoadingPanelMatrixOverTime" lines={10} />
        ) : (
          <>
            <BarChart barChart={barChartData} configs={barchartConfigs} />

            {loading && (
              <Loader
                overlay
                overlayBackground={
                  darkMode ? darkTheme.euiPageBackgroundColor : lightTheme.euiPageBackgroundColor
                }
                size="xl"
              />
            )}
          </>
        )}
      </Panel>
    ) : null;
  }
);
