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
  MatrixHistogramOption,
  MatrixHistogramQueryProps,
  MatrixHistogramConfigs,
} from './types';
import type { GlobalTimeArgs } from '../../containers/use_global_time';
import { HoverVisibilityContainer } from '../hover_visibility_container';
import type { VisualizationResponse } from '../visualization_actions/types';
import { useQueryToggle } from '../../containers/query_toggle';
import { VISUALIZATION_ACTIONS_BUTTON_CLASS } from '../visualization_actions/utils';
import { VisualizationEmbeddable } from '../visualization_actions/visualization_embeddable';
import { useVisualizationResponse } from '../visualization_actions/use_visualization_response';
import type { SourcererScopeName } from '../../store/sourcerer/model';

export type MatrixHistogramComponentProps = MatrixHistogramQueryProps &
  MatrixHistogramConfigs & {
    headerChildren?: React.ReactNode;
    hideHistogramIfEmpty?: boolean;
    id: string;
    showSpacer?: boolean;
    setQuery: GlobalTimeArgs['setQuery'];
    sourcererScopeId?: SourcererScopeName;
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

const visualizationResponseHasData = (response: VisualizationResponse[]): boolean => {
  if (response.length === 0) {
    return false;
  }
  return Object.values<AggregationsTermsAggregateBase<unknown[]>>(
    response[0].aggregations ?? {}
  ).some(({ buckets }) => buckets.length > 0);
};

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
  setQuery,
  showSpacer = true,
  stackByOptions,
  startDate,
  subtitle,
  sourcererScopeId,
  title,
  titleSize,
  hideQueryToggle = false,
  applyGlobalQueriesAndFilters = true,
}) => {
  const visualizationId = `${id}-embeddable`;

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [selectedStackByOption, setSelectedStackByOption] =
    useState<MatrixHistogramOption>(defaultStackByOption);

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

  const titleWithStackByField = useMemo(
    () => (title != null && typeof title === 'function' ? title(selectedStackByOption) : title),
    [title, selectedStackByOption]
  );
  const { responses: visualizationResponse } = useVisualizationResponse({ visualizationId });
  const subtitleWithCounts = useMemo(() => {
    if (isInitialLoading) {
      return null;
    }

    if (typeof subtitle === 'function') {
      if (!visualizationResponse || !visualizationResponseHasData(visualizationResponse)) {
        return subtitle(0);
      }
      const visualizationCount = visualizationResponse[0].hits.total;
      return visualizationCount >= 0 ? subtitle(visualizationCount) : null;
    }

    return subtitle;
  }, [isInitialLoading, subtitle, visualizationResponse]);

  const hideHistogram = useMemo(
    () =>
      (visualizationResponse?.[0].hits.total ?? 0) <= 0 && hideHistogramIfEmpty ? true : false,
    [hideHistogramIfEmpty, visualizationResponse]
  );

  useEffect(() => {
    if (isInitialLoading && !!visualizationResponse) {
      setIsInitialLoading(false);
    }
  }, [id, isInitialLoading, visualizationResponse, setIsInitialLoading, setQuery]);

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
      <HoverVisibilityContainer
        show={!isInitialLoading}
        targetClassNames={[VISUALIZATION_ACTIONS_BUTTON_CLASS]}
      >
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
                    aria-label={i18n.STACK_BY}
                  />
                )}
              </EuiFlexItem>
              <EuiFlexItem grow={false}>{headerChildren}</EuiFlexItem>
            </EuiFlexGroup>
          </HeaderSection>
          {toggleStatus ? (
            <VisualizationEmbeddable
              scopeId={sourcererScopeId}
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
      </HoverVisibilityContainer>
      {showSpacer && <EuiSpacer data-test-subj="spacer" size="l" />}
    </>
  );
};

export const MatrixHistogram = React.memo(MatrixHistogramComponent);
