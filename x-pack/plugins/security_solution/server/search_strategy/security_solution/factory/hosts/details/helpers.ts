/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { set } from '@elastic/safer-lodash-set/fp';
import { get, has, head } from 'lodash/fp';
import { hostFieldsMap } from '../../../../../../common/ecs/ecs_fields';
import { Direction } from '../../../../../../common/search_strategy/common';
import {
  AggregationRequest,
  EndpointFields,
  HostAggEsItem,
  HostBuckets,
  HostItem,
  HostValue,
} from '../../../../../../common/search_strategy/security_solution/hosts';
import { getHostData } from '../../../../../endpoint/routes/metadata/handlers';
import { EndpointAppContext } from '../../../../../endpoint/types';
import { FrameworkRequest } from '../../../../../lib/framework';

export const HOST_FIELDS = [
  '_id',
  'host.architecture',
  'host.id',
  'host.ip',
  'host.id',
  'host.mac',
  'host.name',
  'host.os.family',
  'host.os.name',
  'host.os.platform',
  'host.os.version',
  'host.type',
  'cloud.instance.id',
  'cloud.machine.type',
  'cloud.provider',
  'cloud.region',
  'endpoint.endpointPolicy',
  'endpoint.policyStatus',
  'endpoint.sensorVersion',
];

export const buildFieldsTermAggregation = (esFields: readonly string[]): AggregationRequest =>
  esFields.reduce<AggregationRequest>(
    (res, field) => ({
      ...res,
      ...getTermsAggregationTypeFromField(field),
    }),
    {}
  );

const getTermsAggregationTypeFromField = (field: string): AggregationRequest => {
  if (field === 'host.ip') {
    return {
      host_ip: {
        terms: {
          script: {
            source: "doc['host.ip']",
            lang: 'painless',
          },
          size: 10,
          order: {
            timestamp: Direction.desc,
          },
        },
        aggs: {
          timestamp: {
            max: {
              field: '@timestamp',
            },
          },
        },
      },
    };
  }

  return {
    [field.replace(/\./g, '_')]: {
      terms: {
        field,
        size: 10,
        order: {
          timestamp: Direction.desc,
        },
      },
      aggs: {
        timestamp: {
          max: {
            field: '@timestamp',
          },
        },
      },
    },
  };
};

export const formatHostItem = (fields: readonly string[], bucket: HostAggEsItem): HostItem =>
  fields.reduce<HostItem>((flattenedFields, fieldName) => {
    const fieldValue = getHostFieldValue(fieldName, bucket);
    if (fieldValue != null) {
      return set(fieldName, fieldValue, flattenedFields);
    }
    return flattenedFields;
  }, {});

const getHostFieldValue = (fieldName: string, bucket: HostAggEsItem): string | string[] | null => {
  const aggField = hostFieldsMap[fieldName]
    ? hostFieldsMap[fieldName].replace(/\./g, '_')
    : fieldName.replace(/\./g, '_');
  if (
    [
      'host.ip',
      'host.mac',
      'cloud.instance.id',
      'cloud.machine.type',
      'cloud.provider',
      'cloud.region',
    ].includes(fieldName) &&
    has(aggField, bucket)
  ) {
    const data: HostBuckets = get(aggField, bucket);
    return data.buckets.map((obj) => obj.key);
  } else if (has(`${aggField}.buckets`, bucket)) {
    return getFirstItem(get(`${aggField}`, bucket));
  } else if (has(aggField, bucket)) {
    const valueObj: HostValue = get(aggField, bucket);
    return valueObj.value_as_string;
  } else if (['host.name', 'host.os.name', 'host.os.version'].includes(fieldName)) {
    switch (fieldName) {
      case 'host.name':
        return get('key', bucket) || null;
      case 'host.os.name':
        return get('os.hits.hits[0]._source.host.os.name', bucket) || null;
      case 'host.os.version':
        return get('os.hits.hits[0]._source.host.os.version', bucket) || null;
    }
  } else if (aggField === '_id') {
    const hostName = get(`host_name`, bucket);
    return hostName ? getFirstItem(hostName) : null;
  }
  return null;
};

const getFirstItem = (data: HostBuckets): string | null => {
  const firstItem = head(data.buckets);
  if (firstItem == null) {
    return null;
  }
  return firstItem.key;
};

export const getHostEndpoint = async (
  request: FrameworkRequest,
  id: string | null,
  endpointContext: EndpointAppContext
): Promise<EndpointFields | null> => {
  const logger = endpointContext.logFactory.get('metadata');
  try {
    const agentService = endpointContext.service.getAgentService();
    if (agentService === undefined) {
      throw new Error('agentService not available');
    }
    const metadataRequestContext = {
      endpointAppContextService: endpointContext.service,
      logger,
      requestHandlerContext: request.context,
    };
    const endpointData =
      id != null && metadataRequestContext.endpointAppContextService.getAgentService() != null
        ? await getHostData(metadataRequestContext, id)
        : null;
    return endpointData != null && endpointData.metadata
      ? {
          endpointPolicy: endpointData.metadata.Endpoint.policy.applied.name,
          policyStatus: endpointData.metadata.Endpoint.policy.applied.status,
          sensorVersion: endpointData.metadata.agent.version,
        }
      : null;
  } catch (err) {
    logger.warn(JSON.stringify(err, null, 2));
    return null;
  }
};
