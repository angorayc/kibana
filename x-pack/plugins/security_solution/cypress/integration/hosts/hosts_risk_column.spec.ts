/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { login, visitHostsPage } from '../../tasks/login';

import { cleanKibana } from '../../tasks/common';
import { esArchiverLoad, esArchiverUnload } from '../../tasks/es_archiver';
import { TABLE_CELL } from '../../screens/alerts_details';
import { kqlSearch } from '../../tasks/security_header';

describe('All hosts table', () => {
  before(() => {
    cleanKibana();
    esArchiverLoad('risky_hosts');
    login();
  });

  after(() => {
    esArchiverUnload('risky_hosts');
  });

  it('it renders risk column', () => {
    visitHostsPage();
    kqlSearch('host.name: "siem-kibana" {enter}');
    cy.get('[data-test-subj="loading-spinner"]').should('not.exist');
    cy.get('[data-test-subj="tableHeaderCell_node.risk_4"]').should('exist');
    cy.get(`${TABLE_CELL} .euiTableCellContent`).eq(4).should('have.text', 'Low');
  });
});
