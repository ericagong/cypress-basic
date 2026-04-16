# Cypress → Playwright 마이그레이션 — 아키텍처 관점

> **"설계 시점의 전제가 달라졌는데, 아키텍처는 못 바꿨다."**

## 1. 같은 구도가 반복되고 있다

|              | Unit/Integration         | E2E                           |
| ------------ | ------------------------ | ----------------------------- |
| **AS-IS 강자** | Jest (2014~, Meta)       | Cypress (2017~, Cypress.io)   |
| **TO-BE 대세** | Vitest (2021~, Vite 생태계) | Playwright (2020~, Microsoft) |
| **전환 원인**    | CJS 아키텍처 한계              | 브라우저 내부 실행 아키텍처 한계            |

둘 다 **원래 강자의 아키텍처적 제약**이 시대 변화를 못 따라간 게 핵심이다.

---

## 2. 아키텍처 차이 — 이게 모든 장단점의 근원

### Cypress: 브라우저 안에서 실행

```
┌────────────────────────────────┐
│            브라우저              │
│  ┌────────────┐ ┌────────────┐ │
│  │ 테스트 코드  │ │   앱 코드   │ │
│  │ (Cypress)  │ │  (iframe)  │ │
│  └────────────┘ └────────────┘ │
└────────────────────────────────┘
```

테스트 코드가 **앱과 같은 브라우저 안에서** 돈다. 덕분에 DOM에 직접 접근할 수 있고, Time Travel 같은 혁신적 디버깅이 가능했다. 하지만 브라우저 샌드박스 안에 갇혀 있기 때문에, 다른 도메인이나 다른 탭에는 구조적으로 접근할 수 없다.

### Playwright: 브라우저 밖에서 제어

```
┌──────────────┐                  ┌──────────────┐
│   Node.js    │  ── CDP/Protocol ──▶  브라우저     │
│  테스트 코드   │     (원격 제어)      │  (앱 코드)   │
└──────────────┘                  └──────────────┘
```

Node.js 프로세스가 브라우저를 **외부에서 원격 제어**한다. Chrome DevTools Protocol(CDP) 같은 네이티브 디버깅 프로토콜을 직접 쓰기 때문에, 브라우저가 할 수 있는 건 다 할 수 있다 — 멀티 탭, 멀티 브라우저, 다른 도메인, 파일 업로드/다운로드 전부.

---

## 3. 이 아키텍처 차이에서 뻗어 나오는 모든 것

### 3-1. 크로스 브라우저

|                 | Cypress     | Playwright |
| --------------- | ----------- | ---------- |
| Chromium        | 완전 지원       | 완전 지원      |
| Firefox         | 부분 지원 (불안정) | 완전 지원      |
| WebKit (Safari) | 실험적         | 완전 지원      |

Cypress가 WebKit을 제대로 못 하는 이유? 테스트 코드를 브라우저 안에 주입하는 방식이라, 브라우저 엔진마다 주입 메커니즘을 다르게 구현해야 한다. Playwright는 각 브라우저의 네이티브 프로토콜을 써서 제어하므로 엔진에 무관하게 동일한 방식으로 동작한다.

### 3-2. 멀티 오리진 / 멀티 탭

```js
// Playwright — 자연스럽게 멀티 탭 제어
const [newPage] = await Promise.all([
  context.waitForEvent('page'),
  page.click('a[target="_blank"]')
]);
await newPage.waitForLoadState();
// newPage에서 다른 도메인의 내용을 검증 가능
```

```js
// Cypress — cy.origin()으로 멀티 도메인 접근은 가능하나 제약이 많고, 새 "탭"은 불가
cy.origin('https://auth.other-domain.com', () => {
  cy.get('button').contains('Authorize').click();
});
```

OAuth 로그인, 결제 리다이렉트, 이메일 인증 링크 같은 **현실 세계의 멀티 도메인 플로우**를 Cypress로 테스트하려면 우회가 복잡하다.

### 3-3. 병렬 실행 & 비용

|       | Cypress                | Playwright            |
| ----- | ---------------------- | --------------------- |
| 병렬 실행 | **유료** (Cypress Cloud) | **무료 내장** (worker 기반) |
| 샤딩    | Cloud 의존               | `--shard=1/3` 내장      |

Playwright는 무료 병렬 실행을 내장하고 있어서, 테스트 스위트가 커질수록 비용 차이가 벌어진다.

### 3-4. 문법: async/await vs 커스텀 체이닝

```ts
// Playwright — 네이티브 async/await, 일반 JS 감각 그대로
test('장바구니 추가', async ({ page }) => {
  await page.goto('/products');
  await page.getByRole('button', { name: '담기' }).click();
  const count = await page.getByTestId('cart-count').textContent();
  expect(count).toBe('1');
});
```

```js
// Cypress — 독자적 체이닝, 일반 JS와 다른 감각
it('장바구니 추가', () => {
  cy.visit('/products');
  cy.contains('button', '담기').click();
  cy.get('[data-testid="cart-count"]').should('have.text', '1');
});
```

async/await + 일반 JS 감각을 중시하는 스타일이면, Cypress의 독자적 체이닝이 상당히 거슬릴 수 있다. Playwright는 그냥 평범한 async/await이다.

### 3-5. 속도

| 환경           | Cypress       | Playwright        |
| ------------ | ------------- | ----------------- |
| 10개 테스트 (직렬) | 비슷            | 비슷                |
| 50개 테스트 (병렬) | 직렬만 (무료) → 느림 | worker 4개 병렬 → 빠름 |
| CI 대규모       | Cloud 없으면 병목  | 샤딩 + 병렬로 선형 스케일   |

소규모에서는 차이가 미미한데, **스위트가 커질수록 격차가 벌어진다.** 무료 병렬이 되느냐 안 되느냐의 차이.

---

## 4. 그래도 Cypress가 강한 영역

무조건 Playwright이 우위는 아니다. Cypress만의 장점이 분명히 있다.

**Time Travel 디버깅** — 이건 Cypress가 압도적이다. 각 단계별 DOM 스냅샷을 GUI에서 마우스로 훑으면서 되감기 가능. Playwright의 Trace Viewer도 강력하지만, Cypress의 실시간 되감기 UX는 직관성에서 아직 한 수 위다.

**진입 장벽** — `npm install cypress` → `npx cypress open`이면 끝. 설정 파일 없이도 바로 테스트를 쓸 수 있다. Playwright는 config, 브라우저 설치, async/await 이해가 전제된다.

**단일 페이지 앱에서의 DX** — 간단한 인터랙션 테스트에서는 여전히 빠르고 직관적이다. 이 프로젝트(Counter 앱)가 정확히 이 영역에 해당한다.

---

## 5. 바꿔야 하는 경우 vs 안 바꿔도 되는 경우

### 바꿔야 하는 경우

- 멀티 도메인(OAuth, 결제, SSO)이 있는데 `cy.origin()`으로 한계를 느꼈다
- CI에서 E2E가 병목인데 Cypress Cloud 비용을 쓰기 싫다
- `cy.get().should()` 체이닝이 일반 JS 코드와 이질적이라 불편하다
- Safari/Firefox 테스트가 실제로 필요하다

### 안 바꿔도 되는 경우

- Chromium만 테스트해도 충분하다 (내부 어드민 등)
- 테스트 수가 적어서 병렬 필요 없다
- Time Travel 디버깅에 크게 의존하고 있다
- 팀이 Cypress에 이미 익숙하고 불만이 없다

### 이 프로젝트는?

**안 바꿔도 된다.** 테스트 5개, 단일 페이지, API 호출 없음. Cypress의 아키텍처 한계에 닿는 지점이 없다.

```
"Cypress가 아프다" → 바꿔. 아키텍처 한계는 설정으로 해결 안 됨.
"Cypress가 안 아프다" → 안 바꿔도 됨. 다만 신규 프로젝트는 Playwright로 시작.
```

---

## 6. 2026년 E2E 생태계 현황

| 지표                   | Cypress | Playwright |
| -------------------- | ------- | ---------- |
| QA 시장 점유율            | 14.4%   | 45.1%      |
| State of JS 2025 만족도 | 72%     | 91%        |
| npm 주간 다운로드          | 추월당함    | 2000~3000만 |

Playwright가 다운로드와 멀티 브라우저 지원에서 Cypress를 넘어섰고, 대부분의 팀이 신규 프로젝트에서 Playwright을 선택하고 있다. Jest → Vitest 전환보다 마이그레이션 비용이 더 크긴 하지만 (E2E는 테스트 자체가 복잡하니까), 방향성은 같다.

---

## 7. 만약 마이그레이션한다면 — 이 프로젝트 기준 가이드

### 7-1. 설치 및 설정

```bash
npm install -D @playwright/test
npx playwright install
```

### 7-2. API 매핑표 (이 프로젝트에서 사용하는 것만)

| Cypress                       | Playwright                                |
| ----------------------------- | ----------------------------------------- |
| `describe()`                  | `test.describe()`                         |
| `it()`                        | `test()`                                  |
| `beforeEach()`                | `test.beforeEach()`                       |
| `cy.visit('/')`               | `await page.goto('/')`                    |
| `cy.get('[data-cy="..."]')`   | `page.locator('[data-cy="..."]')`         |
| `.click()`                    | `await locator.click()`                   |
| `.should('be.visible')`       | `await expect(locator).toBeVisible()`     |
| `.should('have.value', '10')` | `await expect(locator).toHaveValue('10')` |

### 7-3. 변환 예시 — 증가 테스트

**Cypress (현재)**

```js
it('+ 버튼 클릭 시 count가 1 증가한다', () => {
  // Given: 초기값 10이 표시되어 있다
  cy.get('[data-cy="count-display"]').should('have.value', '10');

  // When: 사용자가 + 버튼을 클릭한다
  cy.get('[data-cy="increase-button"]').click();

  // Then: count가 11로 증가한다
  cy.get('[data-cy="count-display"]').should('have.value', '11');
});
```

**Playwright (변환 후)**

```ts
test('+ 버튼 클릭 시 count가 1 증가한다', async ({ page }) => {
  // Given: 초기값 10이 표시되어 있다
  await expect(page.locator('[data-cy="count-display"]')).toHaveValue('10');

  // When: 사용자가 + 버튼을 클릭한다
  await page.locator('[data-cy="increase-button"]').click();

  // Then: count가 11로 증가한다
  await expect(page.locator('[data-cy="count-display"]')).toHaveValue('11');
});
```

### 7-4. 파일 구조 변경

```
Before (Cypress):              After (Playwright):
  cypress.config.js              playwright.config.ts
  cypress/e2e/basic.cy.js        tests/basic.spec.ts
  cypress/support/e2e.js         (불필요)
  cypress/support/commands.js    (불필요)
```

### 7-5. package.json 스크립트 변경

```json
{
  "scripts": {
    "start": "npx http-server -p 5500 -s",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

---

## 참고 자료

- [cy2pw](https://www.cy2pw.com/) — Cypress → Playwright 자동 변환 도구
- [Playwright 공식 문서](https://playwright.dev/)
- [Cypress to Playwright Migration Guide (TestDino)](https://testdino.com/blog/cypress-to-playwright-migration/)
- [Performance Benchmark 2026 (TestDino)](https://testdino.com/blog/performance-benchmarks/)
- [Playwright vs Cypress vs Selenium 2026](https://tech-insider.org/playwright-vs-cypress-vs-selenium-2026/)
