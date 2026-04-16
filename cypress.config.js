const { defineConfig } = require('cypress');

module.exports = defineConfig({
  projectId: '3puhj1',
  e2e: {
    baseUrl: 'http://localhost:5500',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});
