/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import React from 'react';
import { IconType } from '@elastic/eui';
import { useKibana } from '../../../../../../../src/plugins/kibana_react/public';

export interface SingleMetricOptions {
  alignLnsMetric?: string;
  disableBorder?: boolean;
  disableShadow?: boolean;
  metricIcon?: IconType;
  metricIconColor?: string;
  metricIconWidth?: string;
  metricPostfix?: string;
  metricPostfixWidth?: string;
}

const configs = {
  alignLnsMetric: 'flex-start',
  appId: 'securitySolutionUI',
  attributes: [
    {
      dataType: 'security',
    },
  ],
  disableBorder: true,
  disableShadow: true,
  customHeight: '100%',
  isSingleMetric: true,
  owner: 'securitySolution',
  reportType: 'singleMetric',
  withActions: ['save', 'addToCase', 'openInLens'],
};

interface EmbeddableHistogramProps {
  appendTitle?: JSX.Element;
  customLensAttrs: {};
  customTimeRange: { from: string; to: string };
  dataTypesIndexPatterns: string;
  isSingleMetric: boolean;
  onBrushEnd?: (param: { range: number[] }) => void;
  title?: string | JSX.Element;
  singleMetricOptions?: SingleMetricOptions;
}

export const EmbeddableHistogram = (props: EmbeddableHistogramProps) => {
  const { observability } = useKibana<StartServices>().services;
  const ExploratoryViewEmbeddable = observability.ExploratoryViewEmbeddable;

  const mergedProps = { ...configs, ...props };
  return <ExploratoryViewEmbeddable {...mergedProps} />;
};

EmbeddableHistogram.displayName = 'EmbeddableHistogram';
