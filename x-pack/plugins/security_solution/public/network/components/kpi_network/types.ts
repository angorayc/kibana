/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { UpdateDateRange } from '../../../common/components/charts/common';
import { GlobalTimeArgs } from '../../../common/containers/use_global_time';
import { InputsModelId } from '../../../common/store/inputs/constants';

export interface NetworkKpiProps {
  filterQuery?: string;
  from: string;
  indexNames: string[];
  to: string;
  narrowDateRange: UpdateDateRange;
  setQuery: GlobalTimeArgs['setQuery'];
  skip: boolean;
}

export interface NetworkKpiEmbessablesProps {
  filterQuery?: string;
  from: string;
  to: string;
  inputsModelId?: InputsModelId;
}
