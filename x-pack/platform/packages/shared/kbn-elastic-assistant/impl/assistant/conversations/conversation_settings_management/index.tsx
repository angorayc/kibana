/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  EuiPanel,
  EuiSpacer,
  EuiConfirmModal,
  EuiBasicTable,
  EuiTitle,
  EuiText,
  EuiLoadingSpinner,
} from '@elastic/eui';
import React, { useCallback, useMemo, useState } from 'react';
import { snakeCase } from 'lodash';

import { css } from '@emotion/react';
import { PromptTypeEnum } from '@kbn/elastic-assistant-common';
import { useConversationsUpdater } from '../../settings/use_settings_updater/use_conversations_updater';
import { Conversation } from '../../../assistant_context/types';
import { useConversationsTable } from './use_conversations_table';
import { ConversationStreamingSwitch } from '../conversation_settings/conversation_streaming_switch';
import { AIConnector } from '../../../connectorland/connector_selector';
import * as i18n from './translations';

import {
  ConversationsBulkActions,
  useFetchCurrentUserConversations,
  useFetchPrompts,
} from '../../api';
import { useAssistantContext } from '../../../assistant_context';
import { useFlyoutModalVisibility } from '../../common/components/assistant_settings_management/flyout/use_flyout_modal_visibility';
import { Flyout } from '../../common/components/assistant_settings_management/flyout';
import { CANCEL, DELETE, SETTINGS_UPDATED_TOAST_TITLE } from '../../settings/translations';
import { ConversationSettingsEditor } from '../conversation_settings/conversation_settings_editor';
import { CONVERSATION_TABLE_SESSION_STORAGE_KEY } from '../../../assistant_context/constants';
import {
  getDefaultTableOptions,
  useSessionPagination,
} from '../../common/components/assistant_settings_management/pagination/use_session_pagination';
import { AssistantSettingsBottomBar } from '../../settings/assistant_settings_bottom_bar';
import { Toolbar } from './tool_bar_component';
import { ConversationTableItem } from './types';

interface Props {
  connectors: AIConnector[] | undefined;
  defaultConnector?: AIConnector;
  isDisabled?: boolean;
}

const DEFAULT_EMPTY_DELETED_CONVERSATIONS_ARRAY: ConversationTableItem[] = [];
const EMPTY_CONVERSATIONS_ARRAY: ConversationTableItem[] = [];

const ConversationSettingsManagementComponent: React.FC<Props> = ({
  connectors,
  defaultConnector,
  isDisabled,
}) => {
  const {
    actionTypeRegistry,
    assistantAvailability: { isAssistantEnabled },
    http,
    nameSpace,
    toasts,
  } = useAssistantContext();

  const { data: allPrompts, refetch: refetchPrompts } = useFetchPrompts();
  const [totalItemCount, setTotalItemCount] = useState(5);

  const [deletedConversations, setDeletedConversations] = useState(EMPTY_CONVERSATIONS_ARRAY);

  const { onTableChange, pagination, sorting } = useSessionPagination<Conversation, false>({
    nameSpace,
    storageKey: CONVERSATION_TABLE_SESSION_STORAGE_KEY,
    defaultTableOptions: getDefaultTableOptions<Conversation>({ sortField: 'updatedAt' }),
    inMemory: false,
    totalItemCount,
  });

  const deletedConversationsIds = useMemo(
    () => deletedConversations.map((item) => item.id),
    [deletedConversations]
  );

  const allSystemPrompts = useMemo(
    () => allPrompts.data.filter((p) => p.promptType === PromptTypeEnum.system),
    [allPrompts.data]
  );

  const {
    data: conversations,
    isFetched: conversationsLoaded,
    refetch: refetchConversations,
  } = useFetchCurrentUserConversations({
    http,
    isAssistantEnabled,
    // pagination index starts at 0, page starts as one
    page: pagination.pageIndex + 1,
    perPage: pagination.pageSize,
    setTotalItemCount,
    ...(sorting?.sort?.field
      ? // @ts-ignore field can be Title field column gets entire conversation and is labeled Title
        { sortField: sorting.sort.field === 'Title' ? 'title' : snakeCase(sorting.sort.field) }
      : {}),
    ...(sorting?.sort?.direction ? { sortOrder: sorting.sort.direction } : {}),
  });

  const refetchAll = useCallback(() => {
    refetchPrompts();
    refetchConversations();
  }, [refetchPrompts, refetchConversations]);

  const {
    assistantStreamingEnabled,
    conversationsSettingsBulkActions,
    onConversationsBulkDeleted,
    onConversationDeleted,
    resetConversationsSettings,
    saveConversationsSettings,
    setConversationSettings,
    setConversationsSettingsBulkActions,
    setUpdatedAssistantStreamingEnabled,
  } = useConversationsUpdater(conversations, conversationsLoaded);

  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [isDeleteAll, setIsDeleteAll] = useState(false);
  const [isExcludedMode, setIsExcludedMode] = useState(false);
  const [excludedIds, setExcludedIds] = useState<string[]>([]);
  const [totalSelectedConversations, setTotalSelectedConversations] = useState(0);
  const handleSave = useCallback(
    async (param?: { callback?: () => void; bulkActions?: ConversationsBulkActions }) => {
      const { bulkActions, callback } = param ?? {};
      const saveConversationsSettingsParams =
        isDeleteAll || excludedIds.length > 0
          ? { isDeleteAll: true, excludedIds }
          : { isDeleteAll: false, bulkActions };
      const isSuccess = await saveConversationsSettings(saveConversationsSettingsParams);
      if (isSuccess) {
        toasts?.addSuccess({
          iconType: 'check',
          title: SETTINGS_UPDATED_TOAST_TITLE,
        });
        setHasPendingChanges(false);
        setIsDeleteAll(false);
        setDeletedConversations(DEFAULT_EMPTY_DELETED_CONVERSATIONS_ARRAY);
        setTotalSelectedConversations(0);
        callback?.();
      } else {
        resetConversationsSettings();
      }
    },
    [excludedIds, isDeleteAll, resetConversationsSettings, saveConversationsSettings, toasts]
  );

  const setAssistantStreamingEnabled = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (value: any) => {
      setHasPendingChanges(true);
      setUpdatedAssistantStreamingEnabled(value);
    },
    [setUpdatedAssistantStreamingEnabled]
  );

  const onSaveButtonClicked = useCallback(() => {
    handleSave({ callback: refetchAll });
  }, [handleSave, refetchAll]);

  const onCancelClick = useCallback(() => {
    resetConversationsSettings();
    setHasPendingChanges(false);
  }, [resetConversationsSettings]);

  // Local state for saving previously selected items so tab switching is friendlier
  // Conversation Selection State
  const [selectedConversation, setSelectedConversation] = useState<Conversation | undefined>();
  const {
    isFlyoutOpen: editFlyoutVisible,
    openFlyout: openEditFlyout,
    closeFlyout: closeEditFlyout,
  } = useFlyoutModalVisibility();

  const {
    isFlyoutOpen: deleteConfirmModalVisibility,
    openFlyout: openConfirmModal,
    closeFlyout: closeConfirmModal,
  } = useFlyoutModalVisibility();

  const onEditActionClicked = useCallback(
    (rowItem: ConversationTableItem) => {
      setSelectedConversation(rowItem);
      openEditFlyout();
    },
    [openEditFlyout]
  );

  const onDeleteActionClicked = useCallback(
    (rowItem: ConversationTableItem) => {
      setDeletedConversations([rowItem]);
      onConversationDeleted(rowItem.id);

      closeEditFlyout();
      openConfirmModal();
    },
    [closeEditFlyout, onConversationDeleted, openConfirmModal]
  );

  const onBulkDeleteActionClicked = useCallback(() => {
    onConversationsBulkDeleted(deletedConversationsIds);

    closeEditFlyout();
    openConfirmModal();
  }, [closeEditFlyout, deletedConversationsIds, onConversationsBulkDeleted, openConfirmModal]);

  const onDeleteConfirmed = useCallback(() => {
    if (Object.keys(conversationsSettingsBulkActions).length === 0) {
      return;
    }
    closeConfirmModal();
    handleSave({ callback: refetchAll });
    setConversationsSettingsBulkActions({});
  }, [
    closeConfirmModal,
    conversationsSettingsBulkActions,
    handleSave,
    refetchAll,
    setConversationsSettingsBulkActions,
  ]);

  const onDeleteCancelled = useCallback(() => {
    setDeletedConversations(DEFAULT_EMPTY_DELETED_CONVERSATIONS_ARRAY);
    closeConfirmModal();
    onCancelClick();
  }, [closeConfirmModal, onCancelClick]);

  const { getConversationsList, getColumns } = useConversationsTable();

  const conversationOptions = getConversationsList({
    allSystemPrompts,
    actionTypeRegistry,
    connectors,
    conversations,
    defaultConnector,
  });

  const conversationOptionsIds = useMemo(
    () => conversationOptions.map((item) => item.id),
    [conversationOptions]
  );

  const handleRowChecked = useCallback(
    (selectedItem: ConversationTableItem) => {
      if (isExcludedMode) {
        const newExcludedIds = excludedIds.filter((item) => item !== selectedItem.id);
        setExcludedIds(newExcludedIds);
      } else {
        const newDeletedConversations = [...deletedConversations, selectedItem];
        setDeletedConversations(newDeletedConversations);
        if (newDeletedConversations.length === totalItemCount) {
          setIsDeleteAll(true);
        }
      }
      setTotalSelectedConversations((prev) => prev + 1);
    },
    [deletedConversations, excludedIds, isExcludedMode, totalItemCount]
  );

  const handleRowUnChecked = useCallback(
    (selectedItem: ConversationTableItem) => {
      if (isExcludedMode) {
        setExcludedIds((prev) => [...prev, selectedItem.id]);
      } else {
        setDeletedConversations((prev) => prev.filter((item) => item.id !== selectedItem.id));
      }
      setIsDeleteAll(false);
      setTotalSelectedConversations((prev) => (prev || totalItemCount) - 1);
    },
    [isExcludedMode, totalItemCount]
  );

  const handlePageChecked = useCallback(() => {
    if (isExcludedMode) {
      const newExcludedIds = excludedIds.filter((item) => !conversationOptionsIds.includes(item));
      setExcludedIds(newExcludedIds);
    } else {
      const newDeletedConversations = [...deletedConversations, ...conversationOptions];
      setDeletedConversations(newDeletedConversations);
      if (newDeletedConversations.length === totalItemCount) {
        setIsDeleteAll(true);
      }
    }
    setTotalSelectedConversations((prev) => prev + conversationOptionsIds.length);
  }, [
    conversationOptions,
    conversationOptionsIds,
    deletedConversations,
    excludedIds,
    isExcludedMode,
    totalItemCount,
  ]);

  const handlePageUnchecked = useCallback(() => {
    if (isExcludedMode) {
      setExcludedIds((prev) => [...prev, ...conversationOptionsIds]);
    } else {
      setDeletedConversations(
        deletedConversations.filter((item) => !conversationOptionsIds.includes(item.id))
      );
    }
    setTotalSelectedConversations(
      (prev) => (prev || totalItemCount) - conversationOptionsIds.length
    );

    setIsDeleteAll(false);
  }, [conversationOptionsIds, deletedConversations, isExcludedMode, totalItemCount]);

  const handleSelectAll = useCallback(() => {
    setIsDeleteAll(true);
    setIsExcludedMode(true);
    setDeletedConversations(conversationOptions);
    setTotalSelectedConversations(totalItemCount);
    setExcludedIds([]);
  }, [conversationOptions, totalItemCount]);

  const handleUnselectAll = useCallback(() => {
    setIsDeleteAll(false);
    setIsExcludedMode(false);
    setDeletedConversations([]);
    setTotalSelectedConversations(0);
    setExcludedIds([]);
  }, []);

  const onSaveCancelled = useCallback(() => {
    closeEditFlyout();
    onCancelClick();
  }, [closeEditFlyout, onCancelClick]);

  const onSaveConfirmed = useCallback(() => {
    closeEditFlyout();
    handleSave({ callback: refetchAll });
    setConversationsSettingsBulkActions({});
  }, [closeEditFlyout, handleSave, refetchAll, setConversationsSettingsBulkActions]);

  const columns = useMemo(
    () =>
      getColumns({
        conversationOptionsIds,
        deletedConversationsIds,
        excludedIds,
        handlePageChecked,
        handlePageUnchecked,
        handleRowChecked,
        handleRowUnChecked,
        isDeleteAll,
        isDeleteEnabled: () => !isDeleteAll && deletedConversations.length === 0,
        isEditEnabled: () => !isDeleteAll && deletedConversations.length === 0,
        isExcludedMode,
        onDeleteActionClicked,
        onEditActionClicked,
      }),
    [
      conversationOptionsIds,
      deletedConversations.length,
      deletedConversationsIds,
      excludedIds,
      getColumns,
      handlePageChecked,
      handlePageUnchecked,
      handleRowChecked,
      handleRowUnChecked,
      isDeleteAll,
      isExcludedMode,
      onDeleteActionClicked,
      onEditActionClicked,
    ]
  );

  const confirmationTitle = useMemo(() => {
    if (!deletedConversations) {
      return;
    }
    return deletedConversations.length === 1
      ? deletedConversations[0]?.title
        ? i18n.DELETE_CONVERSATION_CONFIRMATION_TITLE(deletedConversations[0]?.title)
        : i18n.DELETE_CONVERSATION_CONFIRMATION_DEFAULT_TITLE
      : i18n.DELETE_MULTIPLE_CONVERSATIONS_CONFIRMATION_TITLE(totalSelectedConversations);
  }, [deletedConversations, totalSelectedConversations]);

  if (!conversationsLoaded) {
    return null;
  }

  return (
    <>
      <EuiPanel hasShadow={false} hasBorder paddingSize="l">
        <EuiTitle size="xs">
          <h2>{i18n.CONVERSATIONS_SETTINGS_TITLE}</h2>
        </EuiTitle>
        <ConversationStreamingSwitch
          assistantStreamingEnabled={assistantStreamingEnabled}
          setAssistantStreamingEnabled={setAssistantStreamingEnabled}
          compressed={false}
        />
        <EuiSpacer size="l" />
        <EuiTitle size="xs">
          <h2>{i18n.CONVERSATIONS_LIST_TITLE}</h2>
        </EuiTitle>
        <EuiSpacer size="xs" />
        <EuiText size="m">{i18n.CONVERSATIONS_LIST_DESCRIPTION}</EuiText>
        <EuiSpacer size="s" />
        <Toolbar
          onConversationsBulkDeleted={onBulkDeleteActionClicked}
          handleSelectAll={handleSelectAll}
          handleUnselectAll={handleUnselectAll}
          totalConversations={totalItemCount}
          totalSelected={totalSelectedConversations}
          isDeleteAll={isDeleteAll}
        />
        <EuiBasicTable
          items={conversationOptions}
          columns={columns}
          pagination={pagination}
          sorting={sorting}
          onChange={onTableChange}
          itemId="id"
        />
      </EuiPanel>
      {editFlyoutVisible && (
        <Flyout
          flyoutVisible={editFlyoutVisible}
          onClose={onSaveCancelled}
          onSaveConfirmed={onSaveConfirmed}
          onSaveCancelled={onSaveCancelled}
          title={selectedConversation?.title ?? i18n.CONVERSATIONS_FLYOUT_DEFAULT_TITLE}
          saveButtonDisabled={
            selectedConversation?.title == null || selectedConversation?.title === ''
          }
        >
          {selectedConversation ? (
            <ConversationSettingsEditor
              allSystemPrompts={allSystemPrompts}
              conversationSettings={conversations}
              conversationsSettingsBulkActions={conversationsSettingsBulkActions}
              http={http}
              isDisabled={isDisabled}
              selectedConversation={selectedConversation}
              setConversationSettings={setConversationSettings}
              setConversationsSettingsBulkActions={setConversationsSettingsBulkActions}
            />
          ) : (
            <EuiLoadingSpinner
              size="l"
              css={css`
                display: block;
                margin: 0 auto;
              `}
            />
          )}
        </Flyout>
      )}
      {deleteConfirmModalVisibility &&
        (deletedConversations?.length > 0 || excludedIds?.length > 0) && (
          <EuiConfirmModal
            aria-labelledby={confirmationTitle}
            title={confirmationTitle}
            onCancel={onDeleteCancelled}
            onConfirm={onDeleteConfirmed}
            cancelButtonText={CANCEL}
            confirmButtonText={DELETE}
            buttonColor="danger"
            defaultFocusedButton="confirm"
          >
            <p />
          </EuiConfirmModal>
        )}
      <AssistantSettingsBottomBar
        hasPendingChanges={hasPendingChanges}
        onCancelClick={onCancelClick}
        onSaveButtonClicked={onSaveButtonClicked}
      />
    </>
  );
};

export const ConversationSettingsManagement = React.memo(ConversationSettingsManagementComponent);

ConversationSettingsManagement.displayName = 'ConversationSettingsManagement';
