/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */
import { isEmpty } from 'lodash/fp';
import { TimelineSavedObject, TimelineStatus } from '../../../../../common/types/timeline';

export const UPDATE_TIMELINE_ERROR_MESSAGE =
  'CREATE timeline with PATCH is not allowed, please use POST instead';
export const UPDATE_TEMPLATE_TIMELINE_ERROR_MESSAGE =
  "CREATE template timeline with PATCH is not allowed, please use POST instead (Given template timeline doesn't exist)";
export const NO_MATCH_VERSION_ERROR_MESSAGE =
  'TimelineVersion conflict: The given version doesn not match with existing timeline';
export const NO_MATCH_ID_ERROR_MESSAGE =
  "Timeline id doesn't match with existing template timeline";
export const TEMPLATE_TIMELINE_VERSION_CONFLICT_MESSAGE = 'Template timelineVersion conflict';
export const CREATE_TIMELINE_ERROR_MESSAGE =
  'UPDATE timeline with POST is not allowed, please use PATCH instead';
export const CREATE_TEMPLATE_TIMELINE_ERROR_MESSAGE =
  'UPDATE template timeline with POST is not allowed, please use PATCH instead';
export const CREATE_TEMPLATE_TIMELINE_WITHOUT_ID_ERROR_MESSAGE =
  'Create template timeline without a template timeline ID is not allowed';
export const EMPTY_TITLE_ERROR_MESSAGE = 'Title cannot be empty';
export const UPDATE_STATUS_ERROR_MESSAGE = 'Update an immutiable timeline is is not allowed';
export const CREATE_TEMPLATE_TIMELINE_WITHOUT_VERSION_ERROR_MESSAGE =
  'Create template timeline without a valid templateTimelineVersion is not allowed. Please start from 1 to create a new template timeline';
const isUpdatingStatus = (
  isHandlingTemplateTimeline: boolean,
  status: TimelineStatus | null | undefined,
  existTimeline: TimelineSavedObject | null,
  existTemplateTimeline: TimelineSavedObject | null
) => {
  const obj = isHandlingTemplateTimeline ? existTemplateTimeline : existTimeline;

  return obj?.status === TimelineStatus.immutiable ? UPDATE_STATUS_ERROR_MESSAGE : null;
};

const isGivenTitleExists = (title: string | null | undefined) => {
  return title == null ? EMPTY_TITLE_ERROR_MESSAGE : null;
};

export const getImportExistingTimelineError = (id: string) =>
  `savedObjectId: "${id}" already exists`;

export const commonFailureChecker = (title: string | null | undefined) => {
  const error = [isGivenTitleExists(title)].filter((msg) => msg != null).join(',');
  return !isEmpty(error)
    ? {
        body: error,
        statusCode: 405,
      }
    : null;
};

const commonUpdateCases = (
  isHandlingTemplateTimeline: boolean,
  status: TimelineStatus | null | undefined,
  version: string | null,
  templateTimelineVersion: number | null,
  templateTimelineId: string | null | undefined,
  existTimeline: TimelineSavedObject | null,
  existTemplateTimeline: TimelineSavedObject | null
) => {
  if (isHandlingTemplateTimeline) {
    if (templateTimelineId == null) {
      return {
        body: CREATE_TEMPLATE_TIMELINE_WITHOUT_ID_ERROR_MESSAGE,
        statusCode: 403,
      };
    }
    if (existTemplateTimeline == null && templateTimelineVersion != null) {
      // template timeline !exists
      // Throw error to create template timeline in patch
      return {
        body: UPDATE_TEMPLATE_TIMELINE_ERROR_MESSAGE,
        statusCode: 405,
      };
    }

    if (
      existTimeline != null &&
      existTemplateTimeline != null &&
      existTimeline.savedObjectId !== existTemplateTimeline.savedObjectId
    ) {
      // Throw error you can not have a no matching between your timeline and your template timeline during an update
      return {
        body: NO_MATCH_ID_ERROR_MESSAGE,
        statusCode: 409,
      };
    }

    if (
      existTemplateTimeline != null &&
      existTemplateTimeline.templateTimelineVersion == null &&
      existTemplateTimeline.version !== version
    ) {
      // throw error 409 conflict timeline
      return {
        body: NO_MATCH_VERSION_ERROR_MESSAGE,
        statusCode: 409,
      };
    }

    return null;
  } else {
    if (existTimeline == null) {
      // timeline !exists
      return {
        body: UPDATE_TIMELINE_ERROR_MESSAGE,
        statusCode: 405,
      };
    }

    if (existTimeline?.version !== version) {
      // throw error 409 conflict timeline
      return {
        body: NO_MATCH_VERSION_ERROR_MESSAGE,
        statusCode: 409,
      };
    }

    return null;
  }
};

export const checkIsUpdateViaImportFailureCases = (
  isHandlingTemplateTimeline: boolean,
  status: TimelineStatus | null | undefined,
  version: string | null,
  templateTimelineVersion: number | null,
  templateTimelineId: string | null | undefined,
  existTimeline: TimelineSavedObject | null,
  existTemplateTimeline: TimelineSavedObject | null
) => {
  const error = commonUpdateCases(
    isHandlingTemplateTimeline,
    status,
    version,
    templateTimelineVersion,
    templateTimelineId,
    existTimeline,
    existTemplateTimeline
  );
  if (error) {
    return error;
  }
  if (
    templateTimelineVersion != null &&
    existTemplateTimeline != null &&
    existTemplateTimeline.templateTimelineVersion != null &&
    existTemplateTimeline.templateTimelineVersion >= templateTimelineVersion
  ) {
    // Throw error you can not update a template timeline version with an old version
    return {
      body: TEMPLATE_TIMELINE_VERSION_CONFLICT_MESSAGE,
      statusCode: 409,
    };
  }
};

export const checkIsUpdateFailureCases = (
  isHandlingTemplateTimeline: boolean,
  status: TimelineStatus | null | undefined,
  version: string | null,
  templateTimelineVersion: number | null,
  templateTimelineId: string | null | undefined,
  existTimeline: TimelineSavedObject | null,
  existTemplateTimeline: TimelineSavedObject | null
) => {
  const error = isUpdatingStatus(
    isHandlingTemplateTimeline,
    status,
    existTimeline,
    existTemplateTimeline
  );
  if (error) {
    return {
      body: error,
      statusCode: 403,
    };
  }
  return commonUpdateCases(
    isHandlingTemplateTimeline,
    status,
    version,
    templateTimelineVersion,
    templateTimelineId,
    existTimeline,
    existTemplateTimeline
  );
};

export const checkIsCreateFailureCases = (
  isHandlingTemplateTimeline: boolean,
  status: TimelineStatus | null | undefined,
  version: string | null,
  templateTimelineVersion: number | null,
  templateTimelineId: string | null | undefined,
  existTimeline: TimelineSavedObject | null,
  existTemplateTimeline: TimelineSavedObject | null
) => {
  if (!isHandlingTemplateTimeline && existTimeline != null) {
    return {
      body: CREATE_TIMELINE_ERROR_MESSAGE,
      statusCode: 405,
    };
  } else if (isHandlingTemplateTimeline && existTemplateTimeline != null) {
    // Throw error to create template timeline in patch
    return {
      body: CREATE_TEMPLATE_TIMELINE_ERROR_MESSAGE,
      statusCode: 405,
    };
  } else if (isHandlingTemplateTimeline && templateTimelineId == null) {
    return {
      body: CREATE_TEMPLATE_TIMELINE_WITHOUT_ID_ERROR_MESSAGE,
      statusCode: 403,
    };
  } else if (isHandlingTemplateTimeline && templateTimelineVersion == null) {
    return {
      body: CREATE_TEMPLATE_TIMELINE_WITHOUT_VERSION_ERROR_MESSAGE,
      statusCode: 403,
    };
  } else {
    return null;
  }
};

export const checkIsCreateViaImportFailureCases = (
  isHandlingTemplateTimeline: boolean,
  status: TimelineStatus | null | undefined,
  version: string | null,
  templateTimelineVersion: number | null,
  templateTimelineId: string | null | undefined,
  existTimeline: TimelineSavedObject | null,
  existTemplateTimeline: TimelineSavedObject | null
) => {
  if (!isHandlingTemplateTimeline && existTimeline != null) {
    return {
      body: getImportExistingTimelineError(existTimeline.savedObjectId),
      statusCode: 405,
    };
  } else if (isHandlingTemplateTimeline && existTemplateTimeline != null) {
    // Throw error to create template timeline in patch
    return {
      body: getImportExistingTimelineError(existTemplateTimeline.savedObjectId),
      statusCode: 405,
    };
  } else if (isHandlingTemplateTimeline && templateTimelineId == null) {
    return {
      body: CREATE_TEMPLATE_TIMELINE_WITHOUT_ID_ERROR_MESSAGE,
      statusCode: 405,
    };
  } else {
    return null;
  }
};
