/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { useEuiShadow, useEuiTheme } from '@elastic/eui';
import { css } from '@emotion/react';

export const SHADOW_ANIMATION_DURATION = 350;

export const useCardItemStyles = () => {
  const { euiTheme } = useEuiTheme();
  const shadow = useEuiShadow('l');

  return css`
    &.card-item {
      padding: ${euiTheme.size.base};
      border-radius: ${euiTheme.size.s};
      border: 1px solid ${euiTheme.colors.lightShade};
      box-sizing: content-box;

      &:hover,
      &.card-expanded {
        ${shadow};
        transition: box-shadow ${SHADOW_ANIMATION_DURATION}ms ease-out;
      }

      &.card-expanded {
        border: 2px solid #6092c0;
      }
    }
  `;
};
