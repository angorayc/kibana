/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styled from 'styled-components';

import { EuiFlexGroup, EuiFlexItem, EuiSelect, EuiSpacer } from '@elastic/eui';
import type { AggregationsTermsAggregateBase } from '@elastic/elasticsearch/lib/api/types';
import { isString } from 'lodash/fp';
import * as i18n from './translations';
import { HeaderSection } from '../header_section';
import { Panel } from '../panel';

import type {
  MatrixHistogramProps,
  MatrixHistogramOption,
  MatrixHistogramQueryProps,
  GetTitle,
  GetSubTitle,
} from './types';

import type {
  GetLensAttributes,
  LensAttributes,
  VisualizationResponse,
} from '../visualization_actions/types';
import { useQueryToggle } from '../../containers/query_toggle';

import { VisualizationEmbeddable } from '../visualization_actions/visualization_embeddable';
import { useVisualizationResponse } from '../visualization_actions/use_visualization_response';

export type MatrixHistogramComponentProps = MatrixHistogramProps &
  Omit<MatrixHistogramQueryProps, 'stackByField'> & {
    defaultStackByOption: MatrixHistogramOption;
    getLensAttributes?: GetLensAttributes;
    headerChildren?: React.ReactNode;
    hideHistogramIfEmpty?: boolean;
    id: string;
    lensAttributes?: LensAttributes;
    showSpacer?: boolean;
    stackByOptions: MatrixHistogramOption[];
    subtitle?: string | GetSubTitle;
    title: string | GetTitle;
    hideQueryToggle?: boolean;
    applyGlobalQueriesAndFilters?: boolean;
  };

const DEFAULT_PANEL_HEIGHT = 300;

const HistogramPanel = styled(Panel)<{ height?: number }>`
  display: flex;
  flex-direction: column;
  ${({ height }) => (height != null ? `min-height: ${height}px;` : '')}
`;

const CHART_HEIGHT = 150;

const visualizationResponseHasData = (response: VisualizationResponse): boolean =>
  Object.values<AggregationsTermsAggregateBase<unknown[]>>(response.aggregations ?? {}).some(
    ({ buckets }) => buckets.length > 0
  );

export const MatrixHistogramComponent: React.FC<MatrixHistogramComponentProps> = ({
  chartHeight,
  defaultStackByOption,
  endDate,
  filterQuery,
  getLensAttributes,
  headerChildren,
  hideHistogramIfEmpty = false,
  id,
  isPtrIncluded,
  lensAttributes,
  paddingSize = 'm',
  panelHeight = DEFAULT_PANEL_HEIGHT,
  showSpacer = true,
  stackByOptions,
  startDate,
  subtitle,
  title,
  titleSize,
  hideQueryToggle = false,
  applyGlobalQueriesAndFilters = true,
}) => {
  const visualizationId = `${id}-embeddable`;

  const [selectedStackByOption, setSelectedStackByOption] =
    useState<MatrixHistogramOption>(defaultStackByOption);

  const titleWithStackByField = useMemo(
    () => (title != null && typeof title === 'function' ? title(selectedStackByOption) : title),
    [title, selectedStackByOption]
  );

  useEffect(() => {
    setSelectedStackByOption(defaultStackByOption);
  }, [defaultStackByOption]);

  const setSelectedChartOptionCallback = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      setSelectedStackByOption(
        stackByOptions.find((co) => co.value === event.target.value) ?? defaultStackByOption
      );
    },
    [defaultStackByOption, stackByOptions]
  );

  const { toggleStatus, setToggleStatus } = useQueryToggle(id);

  const toggleQuery = useCallback(
    (status: boolean) => {
      setToggleStatus(status);
    },
    [setToggleStatus]
  );

  const visualizationResponse = useVisualizationResponse({ visualizationId });
  const subtitleWithCounts = useMemo(() => {
    if (typeof subtitle === 'function') {
      if (!visualizationResponse || !visualizationResponseHasData(visualizationResponse[0])) {
        return subtitle(0);
      }
      const visualizationCount = visualizationResponse[0].hits.total;
      return visualizationCount >= 0 ? subtitle(visualizationCount) : null;
    }

    return subtitle;
  }, [subtitle, visualizationResponse]);

  const hideHistogram = hideHistogramIfEmpty ? true : false;

  const timerange = useMemo(() => ({ from: startDate, to: endDate }), [startDate, endDate]);
  const extraVisualizationOptions = useMemo(
    () => ({
      dnsIsPtrIncluded: isPtrIncluded ?? false,
      filters: filterQuery
        ? [
            {
              query: isString(filterQuery) ? JSON.parse(filterQuery) : filterQuery,
              meta: {},
            },
          ]
        : undefined,
    }),
    [isPtrIncluded, filterQuery]
  );

  if (hideHistogram) {
    return null;
  }

  return (
    <>
      <HistogramPanel
        data-test-subj={`${id}Panel`}
        height={toggleStatus ? panelHeight : undefined}
        paddingSize={paddingSize}
      >
        <HeaderSection
          id={id}
          height={toggleStatus ? undefined : 0}
          title={titleWithStackByField}
          titleSize={titleSize}
          toggleStatus={toggleStatus}
          toggleQuery={hideQueryToggle ? undefined : toggleQuery}
          subtitle={subtitleWithCounts}
          inspectMultiple
          showInspectButton={false}
          isInspectDisabled={filterQuery === undefined}
        >
          <EuiFlexGroup alignItems="center" gutterSize="none">
            <EuiFlexItem grow={false}>
              {stackByOptions.length > 1 && (
                <EuiSelect
                  onChange={setSelectedChartOptionCallback}
                  options={stackByOptions}
                  prepend={i18n.STACK_BY}
                  value={selectedStackByOption?.value}
                />
              )}
            </EuiFlexItem>
            <EuiFlexItem grow={false}>{headerChildren}</EuiFlexItem>
          </EuiFlexGroup>
        </HeaderSection>
        {toggleStatus ? (
          <VisualizationEmbeddable
            applyGlobalQueriesAndFilters={applyGlobalQueriesAndFilters}
            data-test-subj="embeddable-matrix-histogram"
            extraOptions={extraVisualizationOptions}
            getLensAttributes={getLensAttributes}
            height={chartHeight ?? CHART_HEIGHT}
            id={visualizationId}
            inspectTitle={title as string}
            lensAttributes={lensAttributes}
            stackByField={selectedStackByOption.value}
            timerange={timerange}
          />
        ) : null}
      </HistogramPanel>
      {showSpacer && <EuiSpacer data-test-subj="spacer" size="l" />}
    </>
  );
};

export const MatrixHistogram = React.memo(MatrixHistogramComponent);
