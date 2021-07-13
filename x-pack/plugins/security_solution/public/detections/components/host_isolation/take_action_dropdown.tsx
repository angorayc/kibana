/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { EuiContextMenuItem, EuiContextMenuPanel, EuiButton, EuiPopover } from '@elastic/eui';
import * as i18n from './translations';
import { TAKE_ACTION } from '../alerts_table/alerts_utility_bar/translations';
import { useHostIsolationStatus } from '../../containers/detection_engine/alerts/use_host_isolation_status';
import { useIsolationPrivileges } from '../../../common/hooks/endpoint/use_isolate_privileges';

const IsolationHost = React.memo(
  ({
    isolationStatus,
    isolateHostHandler,
  }: {
    isolationStatus: boolean;
    isolateHostHandler: () => void;
  }) =>
    isolationStatus === false ? (
      <EuiContextMenuItem key="isolateHost" onClick={isolateHostHandler}>
        {i18n.ISOLATE_HOST}
      </EuiContextMenuItem>
    ) : (
      <EuiContextMenuItem key="unisolateHost" onClick={isolateHostHandler}>
        {i18n.UNISOLATE_HOST}
      </EuiContextMenuItem>
    )
);

IsolationHost.displayName = 'IsolationHost';

export const TakeActionDropdown = React.memo(
  ({
    onChange,
    agentId,
    isEndpointAlert,
    isolationSupported,
    isHostIsolationPanelOpen,
  }: {
    onChange: (action: 'isolateHost' | 'unisolateHost') => void;
    agentId: string;
    isEndpointAlert: boolean;
    isolationSupported: boolean;
    isHostIsolationPanelOpen: boolean;
  }) => {
    const { loading, isIsolated: isolationStatus } = useHostIsolationStatus({ agentId });
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);

    const closePopoverHandler = useCallback(() => {
      setIsPopoverOpen(false);
    }, []);

    const isolateHostHandler = useCallback(() => {
      setIsPopoverOpen(false);
      if (isolationStatus === false) {
        onChange('isolateHost');
      } else {
        onChange('unisolateHost');
      }
    }, [onChange, isolationStatus]);

    const { isAllowed: isIsolationAllowed } = useIsolationPrivileges();

    const items = useMemo(
      () => [
        ...(isIsolationAllowed &&
        isEndpointAlert &&
        isolationSupported &&
        isHostIsolationPanelOpen === false
          ? [
              <IsolationHost
                isolationStatus={isolationStatus}
                isolateHostHandler={isolateHostHandler}
              />,
            ]
          : []),
      ],
      [
        isEndpointAlert,
        isHostIsolationPanelOpen,
        isIsolationAllowed,
        isolateHostHandler,
        isolationStatus,
        isolationSupported,
      ]
    );

    const onTakeActionClick = useCallback(() => {
      setIsPopoverOpen(!isPopoverOpen);
    }, [isPopoverOpen]);

    const takeActionButton = useMemo(() => {
      return (
        <EuiButton
          iconSide="right"
          fill
          iconType="arrowDown"
          disabled={loading || items.length === 0}
          onClick={onTakeActionClick}
        >
          {TAKE_ACTION}
        </EuiButton>
      );
    }, [items.length, loading, onTakeActionClick]);

    return (
      <EuiPopover
        id="hostIsolationTakeActionPanel"
        button={takeActionButton}
        isOpen={isPopoverOpen}
        closePopover={closePopoverHandler}
        panelPaddingSize="none"
        anchorPosition="upCenter"
      >
        <EuiContextMenuPanel size="m" items={items} />
      </EuiPopover>
    );
  }
);

TakeActionDropdown.displayName = 'TakeActionDropdown';
