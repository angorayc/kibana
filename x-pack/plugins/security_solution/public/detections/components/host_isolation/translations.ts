/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { i18n } from '@kbn/i18n';

export const ADD_ENDPOINT_EXCEPTION = i18n.translate(
  'xpack.securitySolution.endpoint.takeAction.addEndpointException',
  {
    defaultMessage: 'Add Endpoint exception',
  }
);

export const ADD_RULE_EXCEPTION = i18n.translate(
  'xpack.securitySolution.endpoint.takeAction.addRuleException',
  {
    defaultMessage: 'Add Rule exception',
  }
);

export const ADD_TO_CASE = i18n.translate('xpack.securitySolution.endpoint.takeAction.addToCase', {
  defaultMessage: 'Add to case',
});

export const INVESTIGATE_IN_TIMELINE = i18n.translate(
  'xpack.securitySolution.endpoint.takeAction.investigateInTimeline',
  {
    defaultMessage: 'Investigate in timeline',
  }
);

export const CHANGE_ALERT_STATUS = i18n.translate(
  'xpack.securitySolution.endpoint.takeAction.changeAlertStatus',
  {
    defaultMessage: 'Change alert status',
  }
);

export const ISOLATE_HOST = i18n.translate(
  'xpack.securitySolution.endpoint.takeAction.isolateHost',
  {
    defaultMessage: 'Isolate host',
  }
);

export const UNISOLATE_HOST = i18n.translate(
  'xpack.securitySolution.endpoint.takeAction.unisolateHost',
  {
    defaultMessage: 'Release host',
  }
);

export const MARK_AS_OPEN = i18n.translate(
  'xpack.securitySolution.endpoint.takeAction.markAsOpen',
  {
    defaultMessage: 'Mark as open',
  }
);

export const MARK_AS_INPROGRESS = i18n.translate(
  'xpack.securitySolution.endpoint.takeAction.markAsInprogress',
  {
    defaultMessage: 'Mark as in progress',
  }
);

export const MARK_AS_CLOSE = i18n.translate(
  'xpack.securitySolution.endpoint.takeAction.markAsInprogress',
  {
    defaultMessage: 'Mark as close',
  }
);

export const CASES_ASSOCIATED_WITH_ALERT = (caseCount: number): string =>
  i18n.translate(
    'xpack.securitySolution.endpoint.hostIsolation.isolateHost.casesAssociatedWithAlert',
    {
      defaultMessage:
        '{caseCount} {caseCount, plural, one {case} other {cases}} associated with this host',
      values: { caseCount },
    }
  );

export const RETURN_TO_ALERT_DETAILS = i18n.translate(
  'xpack.securitySolution.endpoint.hostIsolation.returnToAlertDetails',
  { defaultMessage: 'Return to alert details' }
);
