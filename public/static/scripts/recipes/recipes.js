// recipes.js (in /public/static/scripts/recipes/recipes.js)
console.log("recipes module loaded");
import('./AccountDetailsFlow.js')
// run immediately (APIMaticDevPortal.ready will wait for portal)
APIMaticDevPortal.ready(async ({ registerWorkflow }) => {
  console.log("Registering workflows from recipes module");
  const { default: AccountDetailsFlow } = await import('./AccountDetailsFlow.js');
  registerWorkflow("page:recipes/AccountDetailsFlow", "Account Details Flow", AccountDetailsFlow);
  const { default: AccountVerificationFlow } = await import("./AccountVerificationFlow.js");
    registerWorkflow("page:recipes/AccountVerificationFlow", "Account Verification Flow", AccountVerificationFlow);
    const { default: PfmAccountAggregationFlow } = await import("./PfmAccountAggregationFlow.js");
    registerWorkflow("page:recipes/PfmAccountAggregationFlow", "PFM Account Aggregation Flow", PfmAccountAggregationFlow);
  // ... other imports/registers
});
