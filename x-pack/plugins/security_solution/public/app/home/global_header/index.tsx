/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */
import {
  EuiHeaderSection,
  EuiHeaderLinks,
  EuiHeaderLink,
  EuiHeaderSectionItem,
} from '@elastic/eui';
import React, { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { createPortalNode, OutPortal, InPortal } from 'react-reverse-portal';
import { i18n } from '@kbn/i18n';

import { AppMountParameters } from '../../../../../../../src/core/public';
import { toMountPoint } from '../../../../../../../src/plugins/kibana_react/public';
import { MlPopover } from '../../../common/components/ml_popover/ml_popover';
import { useKibana } from '../../../common/lib/kibana';
import { ADD_DATA_PATH, SecurityPageName } from '../../../../common/constants';
import { isDetectionsPath } from '../../../../public/helpers';
import { Sourcerer } from '../../../common/components/sourcerer';
import { SourcererScopeName } from '../../../common/store/sourcerer/model';
import { useRouteSpy } from '../../../common/utils/route/use_route_spy';
import { TimelineId } from '../../../../common/types/timeline';
import { timelineDefaults } from '../../../timelines/store/timeline/defaults';
import { timelineSelectors } from '../../../timelines/store/timeline';
import { useShallowEqualSelector } from '../../../common/hooks/use_selector';

const BUTTON_ADD_DATA = i18n.translate('xpack.securitySolution.globalHeader.buttonAddData', {
  defaultMessage: 'Add data',
});

export const pagesWithSourcerer = [
  SecurityPageName.alerts,
  SecurityPageName.detections,
  SecurityPageName.events,
  SecurityPageName.hosts,
  SecurityPageName.network,
  SecurityPageName.overview,
];

/**
 * This component uses the reverse portal to add the Add Data and ML job settings buttons on the
 * right hand side of the Kibana global header
 */
export const GlobalHeader = React.memo(
  ({ setHeaderActionMenu }: { setHeaderActionMenu: AppMountParameters['setHeaderActionMenu'] }) => {
    const portalNode = useMemo(() => createPortalNode(), []);
    const {
      http: {
        basePath: { prepend },
      },
    } = useKibana().services;
    const { pathname } = useLocation();
    const [{ pageName, detailName }] = useRouteSpy();

    const getTimeline = useMemo(() => timelineSelectors.getTimelineByIdSelector(), []);
    const showTimeline = useShallowEqualSelector(
      (state) => (getTimeline(state, TimelineId.active) ?? timelineDefaults).show
    );

    const isAlertsOrRulesDetailsPage =
      pageName === SecurityPageName.alerts ||
      (pageName === SecurityPageName.rules && detailName != null);
    const sourcererScope = isAlertsOrRulesDetailsPage
      ? SourcererScopeName.detections
      : SourcererScopeName.default;
    const showSourcerer = useMemo(
      () => pagesWithSourcerer.find((page) => page === pageName) || isAlertsOrRulesDetailsPage,
      [isAlertsOrRulesDetailsPage, pageName]
    );
    const href = useMemo(() => prepend(ADD_DATA_PATH), [prepend]);

    useEffect(() => {
      setHeaderActionMenu((element) => {
        const mount = toMountPoint(<OutPortal node={portalNode} />);
        return mount(element);
      });

      return () => {
        portalNode.unmount();
        setHeaderActionMenu(undefined);
      };
    }, [portalNode, setHeaderActionMenu]);

    return (
      <InPortal node={portalNode}>
        <EuiHeaderSection side="right">
          {isDetectionsPath(pathname) && (
            <EuiHeaderSectionItem>
              <MlPopover />
            </EuiHeaderSectionItem>
          )}
          <EuiHeaderSectionItem>
            <EuiHeaderLinks>
              <EuiHeaderLink
                color="primary"
                data-test-subj="add-data"
                href={href}
                iconType="indexOpen"
              >
                {BUTTON_ADD_DATA}
              </EuiHeaderLink>
              {showSourcerer && !showTimeline && (
                <Sourcerer scope={sourcererScope} data-test-subj="sourcerer" />
              )}
            </EuiHeaderLinks>
          </EuiHeaderSectionItem>
        </EuiHeaderSection>
      </InPortal>
    );
  }
);
GlobalHeader.displayName = 'GlobalHeader';
