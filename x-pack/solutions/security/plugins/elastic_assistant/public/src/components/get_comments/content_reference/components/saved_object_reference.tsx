/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { SavedObjectContentReference } from '@kbn/elastic-assistant-common';
import React from 'react';
import { EuiLink, euiTextTruncate } from '@elastic/eui';
import { css } from '@emotion/react';
import type { ResolvedContentReferenceNode } from '../content_reference_parser';
import { PopoverReference } from './popover_reference';
import { useKibana } from '../../../../context/typed_kibana_context/typed_kibana_context';

interface Props {
  contentReferenceNode: ResolvedContentReferenceNode<SavedObjectContentReference>;
}

export const SavedObjectReference: React.FC<Props> = ({ contentReferenceNode }) => {
  const { getUrlForApp } = useKibana().services.application;
  const savedObjectUrl = getUrlForApp('management', {
    path: `/management/kibana/objects/${contentReferenceNode.contentReference.type}/${contentReferenceNode.contentReference.id}`,
  });

  return (
    <PopoverReference
      contentReferenceCount={contentReferenceNode.contentReferenceCount}
      data-test-subj="savedObjectReference"
    >
      <EuiLink
        href={savedObjectUrl}
        target="_blank"
        css={css`
          ${euiTextTruncate(`300px`)}
        `}
      >
        {`${contentReferenceNode.contentReference.id} ${contentReferenceNode.contentReference.type}`}
      </EuiLink>
    </PopoverReference>
  );
};
