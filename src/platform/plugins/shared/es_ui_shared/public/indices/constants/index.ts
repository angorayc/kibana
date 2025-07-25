/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { ILLEGAL_CHARACTERS_VISIBLE } from '@kbn/data-view-validation';

export const INDEX_ILLEGAL_CHARACTERS_VISIBLE = [...ILLEGAL_CHARACTERS_VISIBLE, '*'];

// Insert the comma into the middle, so it doesn't look as if it has grammatical meaning when
// these characters are rendered in the UI.
const insertionIndex = Math.floor(ILLEGAL_CHARACTERS_VISIBLE.length / 2);
INDEX_ILLEGAL_CHARACTERS_VISIBLE.splice(insertionIndex, 0, ',');
