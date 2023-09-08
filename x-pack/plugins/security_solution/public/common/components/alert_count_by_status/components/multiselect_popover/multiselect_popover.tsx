/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React, { useCallback, useMemo, useState } from 'react';

import type { EuiSelectableOption } from '@elastic/eui';
import { EuiFilterButton, EuiFilterGroup, EuiSelectable, EuiPopover } from '@elastic/eui';
import { css } from '@emotion/react';
export interface MultiSelectPopoverProps {
  title: string;
  allItems: readonly EuiSelectableOption[];
  selectedItems: string[];
  onSelectedItemsChange: (newItems: string[]) => void;
}

export const MultiSelectPopover = React.memo(
  ({ allItems, selectedItems, title, onSelectedItemsChange }: MultiSelectPopoverProps) => {
    const [isItemPopoverOpen, setIsItemPopoverOpen] = useState(false);

    const onChangeSelectable = useCallback(
      (opts: EuiSelectableOption[]) => {
        if (opts != null && opts.length > 0) {
          onSelectedItemsChange(
            opts.reduce<string[]>((acc, option) => {
              if (option.checked === 'on' && option.key != null) {
                acc.push(option.key);
              }
              return acc;
            }, [])
          );
        }
      },
      [onSelectedItemsChange]
    );

    const options = useMemo(
      () =>
        allItems.map((item, index) => ({
          label: item.label,
          checked: (item.key != null && selectedItems.includes(item.key)
            ? 'on'
            : undefined) as EuiSelectableOption['checked'],
          key: `${item.key}-${index}`,
        })),
      [allItems, selectedItems]
    );

    const togglePopover = useCallback(
      (toState?: boolean) => {
        setIsItemPopoverOpen((s) => (toState ? toState : !s));
      },
      [setIsItemPopoverOpen]
    );

    return (
      <EuiPopover
        ownFocus
        button={
          <EuiFilterGroup>
            <EuiFilterButton
              grow={false}
              data-test-subj={'multiselect-popover-button'}
              iconType="arrowDown"
              onClick={() => togglePopover()}
              numFilters={allItems.length}
              isSelected={isItemPopoverOpen}
              hasActiveFilters={selectedItems.length > 0}
              numActiveFilters={selectedItems.length}
            >
              {title}
            </EuiFilterButton>
          </EuiFilterGroup>
        }
        isOpen={isItemPopoverOpen}
        closePopover={() => togglePopover(false)}
        panelPaddingSize="none"
      >
        <EuiSelectable
          css={css`
            width: 160px;
          `}
          onChange={onChangeSelectable}
          options={options}
        >
          {(list) => list}
        </EuiSelectable>
      </EuiPopover>
    );
  }
);

MultiSelectPopover.displayName = 'MultiSelectPopover';
