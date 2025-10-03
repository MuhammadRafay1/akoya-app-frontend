document.addEventListener("DOMContentLoaded", (event) => {
  APIMaticDevPortal.ready(async ({ registerWorkflow }) => {
    const { default: AccountDetailsFlow } = await import("./AccountDetailsFlow.js");
    registerWorkflow("page:recipes/AccountDetailsFlow", "Account Details Flow", AccountDetailsFlow);
    const { default: AccountVerificationFlow } = await import("./AccountVerificationFlow.js");
    registerWorkflow("page:recipes/AccountVerificationFlow", "Account Verification Flow", AccountVerificationFlow);
    const { default: PfmAccountAggregationFlow } = await import("./PfmAccountAggregationFlow.js");
    registerWorkflow("page:recipes/PfmAccountAggregationFlow", "PFM Account Aggregation Flow", PfmAccountAggregationFlow);
  });
});