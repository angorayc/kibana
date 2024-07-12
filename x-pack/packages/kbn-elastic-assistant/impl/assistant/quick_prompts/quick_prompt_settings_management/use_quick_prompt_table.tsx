/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { EuiBadge, EuiBasicTableColumn, EuiLink } from '@elastic/eui';
import React, { useCallback } from 'react';
import { PromptResponse } from '@kbn/elastic-assistant-common';
import { FormattedDate } from '@kbn/i18n-react';
import { BadgesColumn } from '../../common/components/assistant_settings_management/badges';
import { RowActions } from '../../common/components/assistant_settings_management/row_actions';
import { PromptContextTemplate } from '../../prompt_context/types';
import * as i18n from './translations';

export const useQuickPromptTable = () => {
  const getColumns = useCallback(
    ({
      isActionsDisabled,
      basePromptContexts,
      onEditActionClicked,
      onDeleteActionClicked,
    }: {
      isActionsDisabled: boolean;
      basePromptContexts: PromptContextTemplate[];
      onEditActionClicked: (prompt: PromptResponse) => void;
      onDeleteActionClicked: (prompt: PromptResponse) => void;
    }): Array<EuiBasicTableColumn<PromptResponse>> => [
      {
        align: 'left',
        name: i18n.QUICK_PROMPTS_TABLE_COLUMN_NAME,
        render: (prompt: PromptResponse) =>
          prompt?.name ? (
            <EuiLink onClick={() => onEditActionClicked(prompt)} disabled={isActionsDisabled}>
              {prompt?.name}
            </EuiLink>
          ) : null,
        sortable: ({ name }: PromptResponse) => name,
      },
      {
        align: 'left',
        name: i18n.QUICK_PROMPTS_TABLE_COLUMN_CONTEXTS,
        render: (prompt: PromptResponse) => {
          const selectedPromptContexts = (
            basePromptContexts.filter((bpc) =>
              prompt?.categories?.some((cat) => bpc?.category === cat)
            ) ?? []
          ).map((bpc) => bpc?.description);
          return selectedPromptContexts ? (
            <BadgesColumn items={selectedPromptContexts} prefix={prompt.name} />
          ) : null;
        },
      },
      {
        align: 'left',
        field: 'updatedAt',
        name: i18n.QUICK_PROMPTS_TABLE_COLUMN_DATE_UPDATED,
        render: (updatedAt: PromptResponse['updatedAt']) =>
          updatedAt ? (
            <EuiBadge color="hollow">
              <FormattedDate
                value={new Date(updatedAt)}
                year="numeric"
                month="2-digit"
                day="numeric"
              />
            </EuiBadge>
          ) : null,
        sortable: true,
      },
      {
        align: 'center',
        name: i18n.QUICK_PROMPTS_TABLE_COLUMN_ACTIONS,
        width: '120px',
        render: (prompt: PromptResponse) => {
          if (!prompt) {
            return null;
          }
          const isDeletable = !prompt.isDefault;
          return (
            <RowActions<PromptResponse>
              disabled={isActionsDisabled}
              rowItem={prompt}
              onDelete={isDeletable ? onDeleteActionClicked : undefined}
              onEdit={onEditActionClicked}
              isDeletable={isDeletable}
            />
          );
        },
      },
    ],
    []
  );

  return { getColumns };
};
