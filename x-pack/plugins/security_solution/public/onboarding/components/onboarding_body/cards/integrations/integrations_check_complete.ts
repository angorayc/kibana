/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { GetPackagesResponse } from '@kbn/fleet-plugin/public';
import { EPM_PACKAGES_MANY, installationStatuses } from '@kbn/fleet-plugin/public';
import type { HttpSetup } from '@kbn/core/public';
import { i18n } from '@kbn/i18n';
import type { DataPublicPluginStart } from '@kbn/data-plugin/public';
import { lastValueFrom } from 'rxjs';
import type { OnboardingCardCheckComplete } from '../../../../types';
import { AGENT_INDEX } from './const';

export const checkIntegrationsCardComplete: OnboardingCardCheckComplete = async ({
  data,
  http,
}: {
  data: DataPublicPluginStart;
  http: HttpSetup;
}) => {
  const packageData = await http.get<GetPackagesResponse>(EPM_PACKAGES_MANY, {
    version: '2023-10-31',
  });

  const agentsData = await lastValueFrom(
    data.search.search({
      params: { index: AGENT_INDEX, body: { size: 1 } },
    })
  );

  const installed = packageData?.items?.filter(
    (pkg) =>
      pkg.status === installationStatuses.Installed ||
      pkg.status === installationStatuses.InstallFailed
  );
  const isComplete = installed && installed.length > 0;
  const agentsDataAvailable = !!agentsData?.rawResponse?.hits?.total;
  const agentStillRequired = isComplete && !agentsDataAvailable;

  const completeBadgeText = i18n.translate(
    'xpack.securitySolution.onboarding.integrationsCard.badge.completeText',
    {
      defaultMessage: '{count} {count, plural, one {integration} other {integrations}} added',
      values: { count: installed.length },
    }
  );

  if (!isComplete) {
    return {
      isComplete,
      metadata: {
        integrationsInstalled: 0,
        agentStillRequired: false,
      },
    };
  }

  return {
    isComplete,
    completeBadgeText,
    metadata: {
      integrationsInstalled: installed.length,
      agentStillRequired,
    },
  };
};
