/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { AIMessage, HumanMessage, SystemMessage, ToolMessage } from '@langchain/core/messages';
import { getFinalizeMatchNode, getMatchPrebuiltRuleAgentNode } from './match_prebuilt_rule';
import { MAX_TOOL_CALL_ATTEMPTS, type MatchPrebuiltRuleState } from '../state';

const mockRule = {
  rule_id: 'test-rule',
  name: 'Suspicious MS Office Child Process',
  description: 'test-description',
};

const mockOtherRule = {
  rule_id: 'other-rule',
  name: 'wrong-name',
  description: 'other-description',
};

const baseState = {
  original_rule: {
    title: 'Office Document Executing Macro Code',
    description: 'Detects macro execution from office documents',
    vendor: 'splunk',
    query: '`sysmon` EventCode=7',
  },
  nl_query: '',
  match_prebuilt_rules_messages: [],
} as unknown as MatchPrebuiltRuleState;

const toolCallMessage = (query: string) =>
  new AIMessage({
    content: '',
    tool_calls: [{ type: 'tool_call', id: 'call-1', name: 'searchPrebuiltRules', args: { query } }],
  });

const finalMessage = (match: string, summary = '## Prebuilt Rule Matching Summary\nfoo') =>
  new AIMessage({ content: `\`\`\`json\n${JSON.stringify({ match, summary })}\n\`\`\`` });

// What `getMatchPrebuiltRuleAgentNode`'s `invokeAndValidateFinalAnswer` would have parsed out of a
// `finalMessage(match, summary)` and stashed in `state.match_prebuilt_rules_result`.
const matchResult = (match: string, summary = '## Prebuilt Rule Matching Summary\nfoo') => ({
  match,
  summary,
});

const malformedMessage = () => new AIMessage({ content: 'not valid json' });

const searchToolMessage = (candidates: (typeof mockRule)[]) =>
  new ToolMessage({
    tool_call_id: 'call-1',
    name: 'searchPrebuiltRules',
    content: JSON.stringify(
      candidates.map((rule) => ({ name: rule.name, description: rule.description }))
    ),
    artifact: candidates,
  });

describe('getMatchPrebuiltRuleAgentNode', () => {
  const mockInvoke = jest.fn();
  const model = { bindTools: () => ({ invoke: mockInvoke }) } as never;
  const tool = { name: 'searchPrebuiltRules' } as never;

  const node = getMatchPrebuiltRuleAgentNode({ model, tool });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('builds system + human prompt on the first turn (empty messages)', async () => {
    const aiMessage = toolCallMessage('office macro child process');
    mockInvoke.mockResolvedValueOnce(aiMessage);

    const result = await node(baseState);

    expect(mockInvoke).toHaveBeenCalledTimes(1);
    const firstTurnMessages = mockInvoke.mock.calls[0][0];
    // system message + human message only
    expect(firstTurnMessages).toHaveLength(2);
    expect(SystemMessage.isInstance(firstTurnMessages[0])).toBe(true);
    expect(HumanMessage.isInstance(firstTurnMessages[1])).toBe(true);

    // system message contains query guidelines, matching guidelines, and output format
    const systemContent = String(firstTurnMessages[0].content);
    expect(systemContent).toContain('<query_guidelines>');
    expect(systemContent).toContain('<matching_guidelines>');
    expect(systemContent).toContain('<expected_output>');

    // human message has rule context and static "call the tool" directive — no dynamic injection
    const humanContent = String(firstTurnMessages[1].content);
    expect(humanContent).toContain('Call the searchPrebuiltRules tool with your best query');
    expect(humanContent).not.toContain('<previous_search_attempts>');

    expect(result.match_prebuilt_rules_messages).toHaveLength(3);
    expect(result.match_prebuilt_rules_messages?.at(-1)).toBe(aiMessage);
    expect(result.match_prebuilt_rules_result).toBeUndefined();
  });

  it('passes accumulated messages as-is on subsequent turns without injecting anything', async () => {
    const priorMessages = [
      new SystemMessage('system'),
      new HumanMessage('human'),
      toolCallMessage('office macro child process'),
      searchToolMessage([mockRule]),
    ];
    const aiMessage = finalMessage('Suspicious MS Office Child Process');
    mockInvoke.mockResolvedValueOnce(aiMessage);

    const result = await node({ ...baseState, match_prebuilt_rules_messages: priorMessages });

    const [invokedMessages] = mockInvoke.mock.calls[0];
    // exactly the prior messages — nothing appended
    expect(invokedMessages).toHaveLength(priorMessages.length);
    expect(invokedMessages).toEqual(priorMessages);

    // only the model's reply is added to state
    expect(result.match_prebuilt_rules_messages).toHaveLength(1);
    expect(result.match_prebuilt_rules_messages?.at(0)).toBe(aiMessage);
    expect(result.match_prebuilt_rules_result).toEqual(
      matchResult('Suspicious MS Office Child Process')
    );
  });

  it('uses splunk matching criteria in system prompt for splunk vendor', async () => {
    mockInvoke.mockResolvedValueOnce(toolCallMessage('office macro child process'));

    await node(baseState); // baseState has vendor: 'splunk'

    const systemContent = String(mockInvoke.mock.calls[0][0][0].content);
    expect(systemContent).toContain('almost identical');
    expect(systemContent).not.toContain('threat category or security objective');
  });

  it('uses generic matching criteria in system prompt for non-splunk vendors', async () => {
    mockInvoke.mockResolvedValueOnce(toolCallMessage('office macro child process'));

    await node({
      ...baseState,
      original_rule: { ...baseState.original_rule, vendor: 'qradar' },
    });

    const systemContent = String(mockInvoke.mock.calls[0][0][0].content);
    expect(systemContent).toContain('threat category or security objective');
  });

  it('system prompt states the search cap so the model can track it from conversation history', async () => {
    mockInvoke.mockResolvedValueOnce(toolCallMessage('office macro child process'));

    await node(baseState);

    const systemContent = String(mockInvoke.mock.calls[0][0][0].content);
    expect(systemContent).toContain(
      `You may call searchPrebuiltRules at most ${MAX_TOOL_CALL_ATTEMPTS} times in total`
    );
    expect(systemContent).toContain('counting your own tool calls in the conversation history');
  });

  it('retries with a corrective message when the final answer is not valid JSON, then returns the parsed retry', async () => {
    const priorMessages = [
      new SystemMessage('system'),
      new HumanMessage('human'),
      toolCallMessage('office macro child process'),
      searchToolMessage([mockRule]),
    ];
    const badMessage = malformedMessage();
    const goodMessage = finalMessage('Suspicious MS Office Child Process');
    mockInvoke.mockResolvedValueOnce(badMessage).mockResolvedValueOnce(goodMessage);

    const result = await node({ ...baseState, match_prebuilt_rules_messages: priorMessages });

    expect(mockInvoke).toHaveBeenCalledTimes(2);
    // second invoke sees the first (invalid) answer plus a corrective nudge appended
    const [secondInvokeMessages] = mockInvoke.mock.calls[1];
    expect(secondInvokeMessages.at(-2)).toBe(badMessage);
    expect(HumanMessage.isInstance(secondInvokeMessages.at(-1))).toBe(true);

    // only the winning AIMessage is persisted to state
    expect(result.match_prebuilt_rules_messages).toHaveLength(1);
    expect(result.match_prebuilt_rules_messages?.at(-1)).toBe(goodMessage);
    expect(result.match_prebuilt_rules_result).toEqual(
      matchResult('Suspicious MS Office Child Process')
    );
  });

  it('gives up with no match_prebuilt_rules_result once retries are exhausted', async () => {
    const priorMessages = [
      new SystemMessage('system'),
      new HumanMessage('human'),
      toolCallMessage('office macro child process'),
      searchToolMessage([mockRule]),
    ];
    const firstBadMessage = malformedMessage();
    const secondBadMessage = malformedMessage();
    mockInvoke.mockResolvedValueOnce(firstBadMessage).mockResolvedValueOnce(secondBadMessage);

    const result = await node({ ...baseState, match_prebuilt_rules_messages: priorMessages });

    expect(mockInvoke).toHaveBeenCalledTimes(2);
    expect(result.match_prebuilt_rules_messages).toHaveLength(1);
    expect(result.match_prebuilt_rules_messages?.at(-1)).toBe(secondBadMessage);
    expect(result.match_prebuilt_rules_result).toBeUndefined();
  });
});

describe('getFinalizeMatchNode', () => {
  const mockReportPrebuiltRulesMatch = jest.fn();
  const telemetryClient = { reportPrebuiltRulesMatch: mockReportPrebuiltRulesMatch } as never;
  const node = getFinalizeMatchNode({ telemetryClient });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('resolves the match from search ToolMessage artifacts', async () => {
    const state = {
      ...baseState,
      match_prebuilt_rules_messages: [
        new SystemMessage('system'),
        new HumanMessage('human'),
        toolCallMessage('office macro child process'),
        searchToolMessage([mockRule]),
        finalMessage('Suspicious MS Office Child Process'),
      ],
      match_prebuilt_rules_result: matchResult('Suspicious MS Office Child Process'),
    };

    const result = await node(state);

    expect(result.elastic_rule?.prebuilt_rule_id).toBe('test-rule');
    expect(result.translation_result).toBe('full');
    expect(mockReportPrebuiltRulesMatch).toHaveBeenCalledWith({
      preFilterRules: [mockRule],
      postFilterRule: mockRule,
    });
  });

  it('uses the most recent search results when the model searched more than once', async () => {
    const state = {
      ...baseState,
      match_prebuilt_rules_messages: [
        new SystemMessage('system'),
        new HumanMessage('human'),
        toolCallMessage('office macro child process'),
        searchToolMessage([mockOtherRule]),
        toolCallMessage('office document macro execution sysmon'),
        searchToolMessage([mockRule]),
        finalMessage('Suspicious MS Office Child Process'),
      ],
      match_prebuilt_rules_result: matchResult('Suspicious MS Office Child Process'),
    };

    const result = await node(state);

    expect(result.elastic_rule?.prebuilt_rule_id).toBe('test-rule');
    expect(mockReportPrebuiltRulesMatch).toHaveBeenCalledWith({
      preFilterRules: [mockOtherRule, mockRule],
      postFilterRule: mockRule,
    });
  });

  it('resolves a match named from an earlier search after a later search returned different candidates', async () => {
    const state = {
      ...baseState,
      match_prebuilt_rules_messages: [
        new SystemMessage('system'),
        new HumanMessage('human'),
        toolCallMessage('office macro child process'),
        searchToolMessage([mockRule]),
        toolCallMessage('office document macro execution sysmon'),
        searchToolMessage([mockOtherRule]),
        finalMessage('Suspicious MS Office Child Process'),
      ],
      match_prebuilt_rules_result: matchResult('Suspicious MS Office Child Process'),
    };

    const result = await node(state);

    expect(result.elastic_rule?.prebuilt_rule_id).toBe('test-rule');
    expect(mockReportPrebuiltRulesMatch).toHaveBeenCalledWith({
      preFilterRules: [mockRule, mockOtherRule],
      postFilterRule: mockRule,
    });
  });

  it('returns a no-match summary with no elastic_rule when the model declines to match', async () => {
    const state = {
      ...baseState,
      match_prebuilt_rules_messages: [
        new SystemMessage('system'),
        new HumanMessage('human'),
        finalMessage(''),
      ],
      match_prebuilt_rules_result: matchResult(''),
    };

    const result = await node(state);

    expect(result.elastic_rule).toBeUndefined();
    expect(result.comments?.[0].message).toContain('foo');
    expect(mockReportPrebuiltRulesMatch).toHaveBeenCalledWith({ preFilterRules: [] });
  });

  it('falls back to the default no-match summary when there is no parsed match_prebuilt_rules_result', async () => {
    const state = {
      ...baseState,
      match_prebuilt_rules_messages: [
        new SystemMessage('system'),
        new HumanMessage('human'),
        toolCallMessage('office macro child process'),
        searchToolMessage([mockRule]),
        new AIMessage({ content: 'not json' }),
      ],
      match_prebuilt_rules_result: undefined,
    };

    const result = await node(state);

    expect(result.elastic_rule).toBeUndefined();
    expect(result.comments?.[0].message).toContain('No related prebuilt rule found');
  });

  it("returns a no-match summary when the model's matched name isn't in any search candidates", async () => {
    const state = {
      ...baseState,
      match_prebuilt_rules_messages: [
        new SystemMessage('system'),
        new HumanMessage('human'),
        toolCallMessage('office macro child process'),
        searchToolMessage([mockOtherRule]),
        finalMessage('Suspicious MS Office Child Process'),
      ],
      match_prebuilt_rules_result: matchResult('Suspicious MS Office Child Process'),
    };

    const result = await node(state);

    expect(result.elastic_rule).toBeUndefined();
    expect(mockReportPrebuiltRulesMatch).toHaveBeenCalledWith({ preFilterRules: [mockOtherRule] });
  });
});
