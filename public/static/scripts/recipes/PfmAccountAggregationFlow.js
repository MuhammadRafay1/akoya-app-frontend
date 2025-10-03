export default function PfmAccountAggregationFlow(workflowCtx,portal) {
  return {
    Guide: {
      name: "Introduction Guide",
      stepCallback: async () => {
        return workflowCtx.showContent(`
## Introduction
This API Recipe will showcase retrieving accounts information to get the transactions history. Once you go through the walkthrough details, click on **Next** to start with **Step 1**.

## 🗝️ Pre-Requisite
To use this API Recipe you will need an authentication token. Please acquire your Authentication Token from the **Get Auth Token Button** in the top right corner of this page. 
**Note**: You only need to Obtain the Token once. If you already have the token you can proceed with the recipe by clicking \`Next\` in the below right corner.

## Recipe Details

### Step 1 - Retrieve accounts Information
1. In Step 1, you will be retrieving the accounts information.
2. There are two required parameters for this endpoint, namely \`version\` and \`providerId\`, and two optional parameters, namely \`accountIds\` and \`x-akoya-interaction-type\`.
3. If you don't wish to change the parameters, the default values will be used.
4. Click on **Try it Out** button to retrieve the accounts information.

### Step 2 - Retrieve Transactions History
1. In Step 2, you will be retrieving the transactions history.
2. There are three required parameters for this endpoint, namely \`version\`, \`providerId\` and \`accountId\`. For the purpose of this walkthrough, the accountId of the first account retrieved  in Step 1 will be used as the \accountId\.
3. There are four optional parameters which can be used for pagination, \`startTime\`, \`endTime\`, \`offset\` and \`limit\`.
4. If you don't wish to change the parameters, the default values will be used.
5. Click on **Try it Out** button to retrieve the investments information.`);
      },
    },
    "Step 1": {
      name: "Retrieve Investments Information",
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
            "This endpoint is used to retrieve investments information.",
          endpointPermalink: "$e/Account%20information/get-accounts-info",
          args: {
            version: "v2",
            providerId: "mikomo"
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
      name: "Retrieve Transactions History",
      stepCallback: async (stepState) => {
        const step2State = stepState?.["Step 1"];
        await portal.setConfig((defaultConfig) => {
          return {
            ...defaultConfig,
          };
        });
        return workflowCtx.showEndpoint({
          description: "This endpoint is used to retrieve transactions history",
          endpointPermalink: "$e/Transactions/get-transactions",
          args: {
            version: "v2",
            providerId: "mikomo",
            accountId: step2State?.data?.accounts[0]?.depositAccount?.accountId,
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
  };
}
