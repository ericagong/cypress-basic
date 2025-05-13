describe('ui-counter', () => {
  beforeEach(() => {
    // 페이지 접속. 띄워진 서버 port를 작성해주세요.
    cy.visit('http://localhost:5500/');
  });

  it('생성 시 버튼과 초기값(10)을 렌더링한다.', () => {
    cy.get('.btn-dec').should('exist');
    cy.get('.btn-inc').should('exist');
    cy.get('.count-display').should('have.value', '10');
  });

  it('+ 버튼 클릭시 count가 1 증가한다.', () => {
    cy.get('.btn-inc').click();
    cy.get('.count-display').should('have.value', '11');
  });

  it('- 버튼 클릭 시 count가 1 감소한다.', () => {
    cy.get('.btn-dec').click();
    cy.get('.count-display').should('have.value', '9');
  });

  it('+ 버튼을 눌렀을 때 count가 12가 넘는 경우 더이상 증가하지 못한다. (Max 값이 12)', () => {
    cy.get('.btn-inc').click();
    cy.get('.btn-inc').click();
    cy.get('.btn-inc').click();
    cy.get('.count-display').should('have.value', '12');

    cy.get('.btn-inc').click();
    cy.get('.count-display').should('have.value', '12');
  });

  it(' 버튼을 눌렀을 때 count는 8보다 작아지는 경우 감소하지 못한다. (Min 값이 8)', () => {
    cy.get('.btn-dec').click();
    cy.get('.btn-dec').click();
    cy.get('.btn-dec').click();
    cy.get('.count-display').should('have.value', '8');

    cy.get('.btn-dec').click();
    cy.get('.count-display').should('have.value', '8');
  });
});
