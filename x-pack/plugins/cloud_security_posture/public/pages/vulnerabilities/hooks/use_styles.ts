/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { useEuiTheme } from '@elastic/eui';
import { css, keyframes } from '@emotion/css';

export const useStyles = () => {
  const { euiTheme } = useEuiTheme();

  const highlight = keyframes`
    0% { background-color: ${euiTheme.colors.warning};}
    50% { background-color: ${euiTheme.colors.emptyShade};}
    75% { background-color: ${euiTheme.colors.warning};}
    100% { background-color: ${euiTheme.colors.emptyShade};}
  `;

  const gridStyle = css`
    & .euiDataGrid__content {
      background: transparent;
    }
    & .euiDataGridHeaderCell__icon {
      display: none;
    }
    & .euiDataGrid__controls {
      border-bottom: none;
      margin-bottom: ${euiTheme.size.s};

      & .euiButtonEmpty {
        font-weight: ${euiTheme.font.weight.bold};
      }
    }
    & .euiDataGrid__leftControls {
      > .euiButtonEmpty:hover:not(:disabled),
      .euiButtonEmpty:focus {
        text-decoration: none;
        cursor: default;
      }
    }
    & .euiButtonIcon {
      color: ${euiTheme.colors.primary};
    }
    & .euiDataGridRowCell {
      font-size: ${euiTheme.size.m};

      // Vertically center content
      .euiDataGridRowCell__content {
        display: flex;
        align-items: center;
      }
    }
    /* EUI QUESTION: Why is this being done via CSS instead of setting isExpandable: false in the columns API? */
    & .euiDataGridRowCell__actions > .euiDataGridRowCell__expandCell {
      display: none;
    }
    & .euiDataGridRowCell.euiDataGridRowCell--numeric {
      text-align: left;
    }
    & .euiDataGridHeaderCell--numeric .euiDataGridHeaderCell__content {
      flex-grow: 0;
      text-align: left;
    }
  `;

  const highlightStyle = css`
    & [data-test-subj='dataGridColumnSortingButton'] .euiButtonEmpty__text {
      animation: ${highlight} 1s ease-out infinite;
      color: ${euiTheme.colors.darkestShade};
    }
  `;

  const groupBySelector = css`
    width: 188px;
    display: inline-block;
    margin-left: 8px;
  `;

  return {
    highlightStyle,
    gridStyle,
    groupBySelector,
  };
};
