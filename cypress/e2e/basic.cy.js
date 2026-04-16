describe('UI Counter', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('생성 시 감소 버튼, 증가 버튼, 초기값(10)을 렌더링한다', () => {
    // Given: 사용자가 카운터 페이지에 접속하면 (beforeEach)

    // Then: 감소 버튼, 증가 버튼, 초기값 10이 화면에 보인다
    cy.get('[data-cy="decrease-button"]').should('be.visible');
    cy.get('[data-cy="increase-button"]').should('be.visible');
    cy.get('[data-cy="count-display"]').should('have.value', '10');
  });

  it('+ 버튼 클릭 시 count가 1 증가한다', () => {
    // Given: 초기값 10이 표시되어 있다
    cy.get('[data-cy="count-display"]').should('have.value', '10');

    // When: 사용자가 + 버튼을 클릭한다
    cy.get('[data-cy="increase-button"]').click();

    // Then: count가 11로 증가한다
    cy.get('[data-cy="count-display"]').should('have.value', '11');
  });

  it('- 버튼 클릭 시 count가 1 감소한다', () => {
    // Given: 초기값 10이 표시되어 있다
    cy.get('[data-cy="count-display"]').should('have.value', '10');

    // When: 사용자가 - 버튼을 클릭한다
    cy.get('[data-cy="decrease-button"]').click();

    // Then: count가 9로 감소한다
    cy.get('[data-cy="count-display"]').should('have.value', '9');
  });

  it('+ 버튼을 눌러도 count는 최대값(12)을 초과하지 않는다', () => {
    // Given: count가 최대값 12에 도달해 있다
    cy.get('[data-cy="increase-button"]').click();
    cy.get('[data-cy="increase-button"]').click();
    cy.get('[data-cy="count-display"]').should('have.value', '12');

    // When: 사용자가 + 버튼을 한 번 더 클릭한다
    cy.get('[data-cy="increase-button"]').click();

    // Then: count는 12에서 변하지 않는다
    cy.get('[data-cy="count-display"]').should('have.value', '12');
  });

  it('- 버튼을 눌러도 count는 최소값(8) 미만으로 감소하지 않는다', () => {
    // Given: count가 최소값 8에 도달해 있다
    cy.get('[data-cy="decrease-button"]').click();
    cy.get('[data-cy="decrease-button"]').click();
    cy.get('[data-cy="count-display"]').should('have.value', '8');

    // When: 사용자가 - 버튼을 한 번 더 클릭한다
    cy.get('[data-cy="decrease-button"]').click();

    // Then: count는 8에서 변하지 않는다
    cy.get('[data-cy="count-display"]').should('have.value', '8');
  });
});
