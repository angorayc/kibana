/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import React from 'react';
import type { IntegrationCardMetadata, RenderChildrenType } from '../types';
import { useIntegrationCardList } from '../hooks/use_integration_card_list';
import { IntegrationsCardGridTabsComponent } from './integration_card_grid_tabs_component';

export const DEFAULT_CHECK_COMPLETE_METADATA: IntegrationCardMetadata = {
  installedIntegrationsCount: 0,
  isAgentRequired: false,
  installedIntegrations: [],
};

export const IntegrationsCardGridTabs: RenderChildrenType = ({
  topCalloutRenderer,
  allowedIntegrations,
  availablePackagesResult,
  checkCompleteMetadata = DEFAULT_CHECK_COMPLETE_METADATA,
  selectedTabResult,
}) => {
  const { installedIntegrationsCount, isAgentRequired, installedIntegrations } =
    checkCompleteMetadata;

  const list = useIntegrationCardList({
    integrationsList: allowedIntegrations,
    featuredCardNames: selectedTabResult.selectedTab?.featuredCardNames,
    installedIntegrations,
  });

  return (
    <IntegrationsCardGridTabsComponent
      isAgentRequired={isAgentRequired}
      installedIntegrationsCount={installedIntegrationsCount}
      topCalloutRenderer={topCalloutRenderer}
      integrationList={list}
      availablePackagesResult={availablePackagesResult}
      selectedTabResult={selectedTabResult}
    />
  );
};
