/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import React from 'react';
import { unmountComponentAtNode } from 'react-dom';
import { Router } from 'react-router-dom';
import { i18n } from '@kbn/i18n';

import { createAction } from '@kbn/ui-actions-plugin/public';
import { isErrorEmbeddable } from '@kbn/embeddable-plugin/public';

import { EuiThemeProvider } from '@kbn/kibana-react-plugin/common';
import { KibanaThemeProvider, toMountPoint } from '@kbn/kibana-react-plugin/public';

import type { CaseUI } from '../../../../common';
import { CommentType } from '../../../../common';
import {
  hasCasePermissions,
  isLensEmbeddable,
  hasInput,
  getCaseOwner,
  getCasePermissions,
} from './utils';
import { KibanaContextProvider } from '../../../common/lib/kibana';

import CasesProvider from '../../cases_context';
import type { ActionContext, CaseUIActionProps, DashboardVisualizationEmbeddable } from './types';
import { useCasesAddToExistingCaseModal } from '../../all_cases/selector_modal/use_cases_add_to_existing_case_modal';

export const ACTION_ID = 'embeddable_addToExistingCase';
export const DEFAULT_DARK_MODE = 'theme:darkMode' as const;

interface Props {
  embeddable: DashboardVisualizationEmbeddable;
  onSuccess: () => void;
  onClose: (theCase?: CaseUI) => void;
}

const AddExistingCaseModalWrapper: React.FC<Props> = ({ embeddable, onClose, onSuccess }) => {
  const { attributes, timeRange } = embeddable.getInput();
  const modal = useCasesAddToExistingCaseModal({
    onClose,
    onSuccess,
  });

  const attachments = [
    {
      comment: `!{lens${JSON.stringify({
        timeRange,
        attributes,
      })}}`,
      type: CommentType.user as const,
    },
  ];
  modal.open({ getAttachments: () => attachments });

  return null;
};

AddExistingCaseModalWrapper.displayName = 'AddExistingCaseModalWrapper';

export const createAddToExistingCaseLensAction = ({
  core,
  plugins,
  storage,
  history,
  caseContextProps,
}: CaseUIActionProps) => {
  const { application: applicationService, theme, uiSettings } = core;
  let currentAppId: string | undefined;
  applicationService?.currentAppId$.subscribe((appId) => {
    currentAppId = appId;
  });

  const owner = getCaseOwner(currentAppId);
  const casePermissions = getCasePermissions(applicationService.capabilities, owner);

  return createAction<ActionContext>({
    id: ACTION_ID,
    type: 'actionButton',
    getIconType: () => 'casesApp',
    getDisplayName: () =>
      i18n.translate('xpack.cases.actions.visualizationActions.addToExistingCase.displayName', {
        defaultMessage: 'Add to existing case',
      }),
    isCompatible: async ({ embeddable }) =>
      !isErrorEmbeddable(embeddable) &&
      isLensEmbeddable(embeddable) &&
      hasCasePermissions(casePermissions) &&
      hasInput(embeddable),
    execute: async ({ embeddable }) => {
      const targetDomElement = document.createElement('div');
      document.body.appendChild(targetDomElement);

      const cleanupDom = (shouldCleanup?: boolean) => {
        if (targetDomElement != null && shouldCleanup) {
          unmountComponentAtNode(targetDomElement);
        }
      };

      const onClose = (theCase?: CaseUI, isCreateCase?: boolean) => {
        const shouldCleanup = theCase == null && !isCreateCase;
        cleanupDom(shouldCleanup);
      };

      const onSuccess = () => {
        cleanupDom(true);
      };
      const mount = toMountPoint(
        <KibanaThemeProvider theme$={theme.theme$}>
          <KibanaContextProvider
            services={{
              ...core,
              ...plugins,
              storage,
            }}
          >
            <EuiThemeProvider darkMode={uiSettings.get(DEFAULT_DARK_MODE)}>
              <Router history={history}>
                <CasesProvider
                  value={{
                    ...caseContextProps,
                    owner,
                    permissions: casePermissions,
                  }}
                >
                  <AddExistingCaseModalWrapper
                    embeddable={embeddable}
                    onClose={onClose}
                    onSuccess={onSuccess}
                  />
                </CasesProvider>
              </Router>
            </EuiThemeProvider>
          </KibanaContextProvider>
        </KibanaThemeProvider>
      );

      mount(targetDomElement);
    },
  });
};
