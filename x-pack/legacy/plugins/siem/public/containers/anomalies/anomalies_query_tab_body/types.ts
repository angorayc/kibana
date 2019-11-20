/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { ESTermQuery } from '../../../../common/typed_json';
import { NarrowDateRange } from '../../../components/ml/types';
import { UpdateDateRange } from '../../../components/charts/common';
import { SetQuery } from '../../../pages/hosts/navigation/types';
import { FlowTarget } from '../../../graphql/types';
import { HostsType } from '../../../store/hosts/model';
import { NetworkType } from '../../../store/network/model';
import { SiemPageName } from '../../../pages/home/types';

interface QueryTabBodyProps {
  type: HostsType | NetworkType;
  filterQuery?: string | ESTermQuery;
}

export type AnomaliesQueryTabBodyProps = QueryTabBodyProps & {
  anomaliesFilterQuery?: object;
  endDate: number;
  flowTarget?: FlowTarget;
  hideHistogramIfEmpty?: boolean;
  ip?: string;
  narrowDateRange: NarrowDateRange;
  page: SiemPageName;
  setQuery: SetQuery;
  skip: boolean;
  startDate: number;
  updateDateRange?: UpdateDateRange;
};
