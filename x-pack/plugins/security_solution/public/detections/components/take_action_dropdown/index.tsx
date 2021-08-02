/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { EuiContextMenu, EuiButton, EuiPopover } from '@elastic/eui';
import type { ExceptionListType } from '@kbn/securitysolution-io-ts-list-types';

import { find, get } from 'lodash/fp';
import { TAKE_ACTION } from '../alerts_table/alerts_utility_bar/translations';

import { TimelineEventsDetailsItem, TimelineNonEcsData } from '../../../../common';
import { Ecs } from '../../../../common/ecs';
import { useExceptionActions } from '../alerts_table/timeline_actions/use_add_exception_actions';
import { useAlertsActions } from '../alerts_table/timeline_actions/use_alerts_actions';
import { useInvestigateInTimeline } from '../alerts_table/timeline_actions/use_investigate_in_timeline';
/* Todo: Uncomment case action after getAddToCaseAction is split into action and modal
import {
    ACTION_ADD_TO_CASE
} from '../alerts_table/translations';
import { useGetUserCasesPermissions, useKibana } from '../../../common/lib/kibana';
import { useInsertTimeline } from '../../../cases/components/use_insert_timeline';
import { addToCaseActionItem } from './helpers'; */
import { useEventFilterAction } from '../alerts_table/timeline_actions/use_event_filter_action';
import { useHostIsolationAction } from '../host_isolation/use_host_isolation_action';
import { CHANGE_ALERT_STATUS } from './translations';
import { getFieldValue } from '../host_isolation/helpers';

export const TakeActionDropdown = React.memo(
  ({
    detailsData,
    ecsData,
    handleOnEventClosed,
    isHostIsolationPanelOpen,
    loadingEventDetails,
    nonEcsData,
    onAddEventFilterClick,
    onAddExceptionTypeClick,
    onAddIsolationStatusClick,
    refetch,
    timelineId,
  }: {
    detailsData: TimelineEventsDetailsItem[] | null;
    ecsData?: Ecs;
    handleOnEventClosed: () => void;
    isHostIsolationPanelOpen: boolean;
    loadingEventDetails: boolean;
    nonEcsData?: TimelineNonEcsData[];
    refetch: (() => void) | undefined;
    onAddEventFilterClick: () => void;
    onAddExceptionTypeClick: (type: ExceptionListType) => void;
    onAddIsolationStatusClick: (action: 'isolateHost' | 'unisolateHost') => void;
    timelineId: string;
  }) => {
    /* Todo: Uncomment case action after getAddToCaseAction is split into action and modal
    const casePermissions = useGetUserCasesPermissions();
    const { timelines: timelinesUi } = useKibana().services;
    const insertTimelineHook = useInsertTimeline;
    */
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);

    const eventKind = useMemo(
      () => getFieldValue({ category: 'event', field: 'event.kind' }, detailsData),
      [detailsData]
    );

    const alertIds = useMemo(() => find({ category: '_id', field: '_id' }, detailsData)?.values, [
      detailsData,
    ]);

    const alertId = get(0, alertIds);

    const ruleId = useMemo(
      () => getFieldValue({ category: 'signal', field: 'signal.rule.id' }, detailsData),
      [detailsData]
    );

    const alertStatus = useMemo(
      () => getFieldValue({ category: 'signal', field: 'signal.status' }, detailsData),
      [detailsData]
    );

    const isEvent = eventKind === 'event';

    const togglePopoverHandler = useCallback(() => {
      setIsPopoverOpen(!isPopoverOpen);
    }, [isPopoverOpen]);

    const closePopoverHandler = useCallback(() => {
      setIsPopoverOpen(false);
    }, []);

    const closePopoverAndFlyout = useCallback(() => {
      handleOnEventClosed();
      setIsPopoverOpen(false);
    }, [handleOnEventClosed]);

    const handleOnAddIsolationStatusClick = useCallback(
      (action: 'isolateHost' | 'unisolateHost') => {
        onAddIsolationStatusClick(action);
        setIsPopoverOpen(false);
      },
      [onAddIsolationStatusClick]
    );

    const hostIsolationAction = useHostIsolationAction({
      closePopover: closePopoverHandler,
      detailsData,
      onAddIsolationStatusClick: handleOnAddIsolationStatusClick,
      isHostIsolationPanelOpen,
    });

    const handleOnAddExceptionTypeClick = useCallback(
      (type: ExceptionListType) => {
        onAddExceptionTypeClick(type);
        setIsPopoverOpen(false);
      },
      [onAddExceptionTypeClick]
    );

    const exceptionActions = useExceptionActions({
      ecsData,
      onAddExceptionTypeClick: handleOnAddExceptionTypeClick,
    });

    const handleOnAddEventFilterClick = useCallback(() => {
      onAddEventFilterClick();
      setIsPopoverOpen(false);
    }, [onAddEventFilterClick]);

    const eventFilterActions = useEventFilterAction({
      onAddEventFilterClick: handleOnAddEventFilterClick,
    });

    const { statusActions } = useAlertsActions({
      alertStatus,
      eventId: alertId,
      timelineId,
      closePopover: closePopoverAndFlyout,
    });

    const { investigateInTimelineAction } = useInvestigateInTimeline({
      ecsRowData: ecsData,
      nonEcsRowData: nonEcsData ?? [],
      onInvestigateInTimelineAlertClick: closePopoverHandler,
      alertIds,
    });

    const alertsActionItems = useMemo(
      () =>
        !isEvent && ruleId
          ? [
              {
                name: CHANGE_ALERT_STATUS,
                panel: 1,
              },
              ...exceptionActions,
            ]
          : [eventFilterActions],
      [eventFilterActions, exceptionActions, isEvent, ruleId]
    );

    const panels = useMemo(
      () => [
        {
          id: 0,
          items: [
            ...alertsActionItems,
            /* Todo: Uncomment case action after getAddToCaseAction is split into action and modal
            ...addToCaseActionItem(timelineId),*/
            ...hostIsolationAction,
            ...investigateInTimelineAction,
          ],
        },
        {
          id: 1,
          title: CHANGE_ALERT_STATUS,
          items: statusActions,
        },
        /* Todo: Uncomment case action after getAddToCaseAction is split into action and modal
        {
          id: 2,
          title: ACTION_ADD_TO_CASE,
          content: (
            <>
              {ecsData &&
                timelinesUi.getAddToCaseAction({
                  ecsRowData: ecsData,
                  useInsertTimeline: insertTimelineHook,
                  casePermissions,
                  showIcon: false,
                })}
            </>
          ),
        },*/
      ],
      [alertsActionItems, hostIsolationAction, investigateInTimelineAction, statusActions]
    );

    const takeActionButton = useMemo(() => {
      return (
        <EuiButton iconSide="right" fill iconType="arrowDown" onClick={togglePopoverHandler}>
          {TAKE_ACTION}
        </EuiButton>
      );
    }, [togglePopoverHandler]);

    return panels[0].items?.length && !loadingEventDetails ? (
      <>
        <EuiPopover
          id="hostIsolationTakeActionPanel"
          button={takeActionButton}
          isOpen={isPopoverOpen}
          closePopover={closePopoverHandler}
          panelPaddingSize="none"
          anchorPosition="downLeft"
        >
          <EuiContextMenu size="s" initialPanelId={0} panels={panels} />
        </EuiPopover>
      </>
    ) : null;
  }
);
