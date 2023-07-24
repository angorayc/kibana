/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import type { EuiIconProps } from '@elastic/eui';
import type React from 'react';
import type { ProductLine } from '../../common/product';

export interface HeaderSection {
  description?: string;
  icon: EuiIconProps;
  id: string;
  title: string;
}
export interface Section {
  cards?: Card[];
  description?: string;
  icon?: EuiIconProps;
  id: SectionId;
  title: string;
}

export interface Badge {
  name: string;
  id: string;
}

export type StepId = IntroductionSteps | ConfigureSteps | ExploreSteps;

export interface Step {
  badges: Badge[];
  description?: string[];
  id: StepId;
  splitPanel?: React.ReactNode;
  title: string;
  timeInMinutes?: number;
}

export type CardId = GetSetUpCardId | GetMoreFromElasticSecurityCardId;

export interface Card {
  productLineRequired?: ProductLine[];
  description?: string | React.ReactNode;
  icon?: EuiIconProps;
  id: CardId;
  steps?: Step[];
  title: string;
  timeInMins?: number;
  stepsLeft?: number;
}

export type ActiveCards = Record<SectionId, Record<CardId, ActiveCard>>;

export enum SectionId {
  getSetUp = 'getSetUp',
  getMoreFromElasticSecurity = 'getMoreFromElasticSecurity',
}

export enum GetSetUpCardId {
  configure = 'configure',
  introduction = 'introduction',
  explore = 'explore',
}

export enum BadgeId {
  analytics = 'analytics',
  cloud = 'cloud',
  edr = 'edr',
}

export enum IntroductionSteps {
  getToKnowElasticSecurity = 'getToKnowElasticSecurity',
}

export enum ConfigureSteps {
  learnAbout = 'learnAbout',
  deployElasticAgent = 'deployElasticAgent',
  connectToDataSources = 'connectToDataSources',
  enablePrebuiltRules = 'enablePrebuiltRules',
}

export enum ExploreSteps {
  viewAlerts = 'viewAlerts',
  analyzeData = 'analyzeData',
}

export enum GetMoreFromElasticSecurityCardId {
  masterTheInvestigationsWorkflow = 'masterTheInvestigationsWorkflow',
  optimizeYourWorkSpace = 'optimizeYourWorkSpace',
  respondToThreats = 'respondToThreats',
}

export interface ActiveCard {
  id: CardId;
  timeInMins: number;
  stepsLeft: number;
}
export interface TogglePanelReducer {
  activeProducts: Set<ProductLine>;
  finishedSteps: Record<CardId, Set<StepId>>;
  activeCards: Record<SectionId, Record<CardId, ActiveCard>> | null;
}

export interface ToggleProductAction {
  type: GetStartedPageActions.ToggleProduct;
  payload: { section: ProductLine };
}

export interface AddFinishedStepAction {
  type: GetStartedPageActions.AddFinishedStep;
  payload: { stepId: StepId; cardId: CardId; sectionId: SectionId };
}

export interface Switch {
  id: ProductLine;
  label: string;
}

export enum GetStartedPageActions {
  AddFinishedStep = 'addFinishedStep',
  ToggleProduct = 'toggleProduct',
}
