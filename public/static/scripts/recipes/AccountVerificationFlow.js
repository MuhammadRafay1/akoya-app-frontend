export default function AccountVerificationFlow(workflowCtx, portal) {
  return {
    "Overview": {
      name: "Overview",
      stepCallback: async () => {
        return workflowCtx.showContent(`
### Introduction

Your goal is to verify the account number and routing number information that has been retrieved from the end-user. Use the Akoya API endpoints to retrieve the account numbers and routing numbers of a consumer’s account directly from their financial institution’s APIs. Matching the account numbers and routing numbers from the end user with the account numbers and routing numbers from the Akoya API endpoints verifies the account.

### 🗝️ Pre-Requisite

To use this API Recipe you will need an authentication token. Please acquire your Authentication Token from the **Get Auth Token Button** in the top right corner of this page.

**Note**: You only need to Obtain the Token once. If you already have the token you can proceed with the recipe by clicking \`Next\` in the below right corner.
`);
      },
    },
    "Step 1": {
      name: "Retrieve Account Information",
      stepCallback: async (stepState) => {
        await portal.setConfig((defaultConfig) => {
          return {
            ...defaultConfig,
            config: {
              ...defaultConfig.config,
            },
          };
        });
        return workflowCtx.showEndpoint({
          description:
            "This endpoint is used to Get basic account information including accountId, masked account number, type, description, etc.",
          endpointPermalink: "$e/Account%20information/get-accounts-info",
          args: {
            version: "v2",
            providerId: "mikomo",
          },
          verify: (response, setError) => {
            if (response.StatusCode == 200) {
              return true;
            } else {
              setError(
                "API Call wasn't able to get a valid repsonse. Please try again."
              );
              return false;
            }
          },
        });
      },
    },
    "Step 2": {
      name: "Retrieve routing and account numbers from bank",
      stepCallback: async (stepState) => {
        await portal.setConfig((defaultConfig) => {
          return {
            ...defaultConfig,
            config: {
              ...defaultConfig.config,
            },
          };
        });
        return workflowCtx.showEndpoint({
          description:
            "This endpoint is used to get deatils about payment enablement or account opening.",
          endpointPermalink: "$e/Payments/payment-networks",
          args: {
            version: "v2",
            providerId: "mikomo",
            accountId: stepState?.["Step 1"]?.data?.accounts[0]?.depositAccount?.accountId,
          },
          verify: (response, setError) => {
            if (response.StatusCode == 200) {
              return true;
            } else {
              setError(
                "API Call wasn't able to get a valid repsonse. Please try again."
              );
              return false;
            }
          },
        });
      },
    },
    "Step 3": {
      name: "Compare account and routing numbers",
      stepCallback: async () => {
        return workflowCtx.showContent(`
### Compare account and routing numbers

Compare the routing and account numbers submitted by the user with the verified routing and account numbers you obtained from the Akoya endpoints. Matching numbers verify the account.
The bankId is the routing number, and the identifier is the account number.

`);
      },
    }
  };
}
