/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React, { useEffect } from 'react';
import { EuiSpacer } from '@elastic/eui';
import gql from 'graphql-tag';
import { StatefulEventsViewer } from '../../../components/events_viewer';
import { HostsComponentsQueryProps } from './types';
import { hostsModel } from '../../../store/hosts';
import { eventsDefaultModel } from '../../../components/events_viewer/default_model';
import { MatrixHistogramOption } from '../../../containers/matrix_histogram/types';
import { MatrixHistogramContainer } from '../../../containers/matrix_histogram';
import { getMatrixHistogramQuery } from '../../../containers/helpers';

const HOSTS_PAGE_TIMELINE_ID = 'hosts-page';
const EVENTS_HISTOGRAM_ID = 'eventsOverTimeQuery';
export const EventsOverTimeGqlQuery = gql`
  ${getMatrixHistogramQuery('Events')}
`;
const eventsStackByOptions: MatrixHistogramOption[] = [
  {
    text: 'action',
    value: 'event.action',
  },
];

export const EventsQueryTabBody = ({
  deleteQuery,
  endDate,
  filterQuery,
  setQuery,
  skip,
  startDate,
  updateDateRange = () => {},
}: HostsComponentsQueryProps) => {
  useEffect(() => {
    return () => {
      if (deleteQuery) {
        deleteQuery({ id: EVENTS_HISTOGRAM_ID });
      }
    };
  }, []);
  return (
    <>
      <MatrixHistogramContainer
        dataKey="Events"
        defaultStackByOption={eventsStackByOptions[0]}
        deleteQuery={deleteQuery}
        endDate={endDate}
        filterQuery={filterQuery}
        query={EventsOverTimeGqlQuery}
        setQuery={setQuery}
        skip={skip}
        sourceId="default"
        stackByOptions={eventsStackByOptions}
        startDate={startDate}
        type={hostsModel.HostsType.page}
        title="Events"
        updateDateRange={updateDateRange}
        id={EVENTS_HISTOGRAM_ID}
      />
      <EuiSpacer size="l" />
      <StatefulEventsViewer
        defaultModel={eventsDefaultModel}
        end={endDate}
        id={HOSTS_PAGE_TIMELINE_ID}
        start={startDate}
      />
    </>
  );
};

EventsQueryTabBody.displayName = 'EventsQueryTabBody';
