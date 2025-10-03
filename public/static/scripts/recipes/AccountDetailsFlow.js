export default function AccountDetailsFlow(workflowCtx, portal) {
  return {
    "Overview": {
      name: "Overview",
      stepCallback: async () => {
        return workflowCtx.showContent(`
## Introduction
This API recipe demonstrates how to access and summarize financial account data through a sequence of API calls.It walks you through retrieving account information, fetching account balances, and accessing transaction history — culminating in a structured account summary. This recipe helps you implement a complete flow for personal financial management use cases.


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
      name: "Get Account Balance",
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
            "This endpoint is used to get Account information that includes balances and rates of bank accounts, credit cards, loans, investments, and more.",
          endpointPermalink: "$e/Balances/get-balances",
          args: {
            accountIds:
            stepState?.["Step 1"]?.data?.accounts[3]?.depositAccount?.accountId,
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
    "Step 3": {
      name: "Get Account Transactions History",
      stepCallback: async (stepState) => {
        const startDate = new Date("2022-01-01");
        const endDate = new Date("2022-12-30");
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
            "This endpoint allows you to retrieve transaction history of consumer-permissioned accounts.",
          endpointPermalink: "$e/Transactions/get-transactions",
          args: {
            accountId:
              stepState?.["Step 1"]?.data?.accounts[3]?.depositAccount
                ?.accountId,
            version: "v2",
            providerId: "mikomo",
            startTime: startDate.toISOString(),
            endTime: endDate.toISOString(),
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
    "Account Summary": {
      name: "Finish",
      stepCallback: async (stepState) => {
        setTimeout(() => {
          // Update all available balance elements
          document.querySelectorAll('[data-balance="current"]').forEach(element => {
            element.textContent = formatCurrency(stepState?.["Step 2"]?.data?.accounts[0]?.depositAccount?.availableBalance);
          });
          document.querySelectorAll('[data-balance="available"]').forEach(element => {
            element.textContent = formatCurrency(stepState?.["Step 2"]?.data?.accounts[0]?.depositAccount?.availableBalance);
          });
          populateTransactionTable(stepState?.["Step 3"]?.data);
        }, 1000);
        return workflowCtx.showContent(`

<div class="container py-5">
<!-- Header -->
<header class="mb-5">
<h1 class="mb-4">Dashboard</h1>
<p class="text-muted">here are your account details</p>
<hr>
</header>

<!-- Account Balance Section -->
<section class="mb-5">
<h2 class="h4 mb-4">Account Summary</h2>
<div class="row">
<div class="col-md-6 mb-4">
<div class="card custom-balance-card shadow-sm">
<div class="card-body">
<h5 class="card-title text-muted">Current Balance</h5>
<h2 class="card-text display-5 fw-bold custom-current-balance"><span data-balance="current">$0.00</span></h2>
<p class="card-text text-muted">Available: <span data-balance="available">$0.00</span></p>
</div>
</div>
</div>
</div>
</section>

<!-- Transaction History Section -->
<section>
<div class="d-flex justify-content-between align-items-center mb-4">
<h2 class="h4 mb-0">Recent Transactions</h2>
</div>

<div class="card shadow-sm">
<div class="card-body p-0">
<div class="table-responsive custom-table" data-container="transactions">
<table class="table table-hover mb-0">
<thead class="table-light">
<tr>
<th scope="col">Date</th>
<th scope="col">Description</th>
<th scope="col">Category</th>
<th scope="col" class="text-end">Amount</th>
</tr>
</thead>
<tbody>
<!-- Transaction rows will be populated by JavaScript -->
</tbody>
</table>
</div>
</div>
</div>
</section>
</div>
`);
      },
    },
  };
}

// Function to format date from ISO string to readable format
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// Function to format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(Math.abs(amount));
}

// Function to get icon based on transaction category
function getCategoryIcon(category) {
  const categoryMap = {
    Groceries: "cart",
    "Shopping/Entertainment: General Merchandise": "bag",
    "Fast Food": "cup-hot",
    "Income: Paychecks/Salary": "briefcase",
    Deposit: "download",
    "Phone, Internet/Cable": "wifi",
    "Other Outgoing Transfers": "arrow-up-right",
    "Alcohol, Wine/Bars": "glass-water",
    "Other Miscellaneous": "box",
    "Health: Healthcare/Medical": "activity",
    Services: "tool",
    "Cash, Checks/Misc: ATM/Cash Withdrawals": "cash",
    "Gas/Fuel": "fuel",
    "Life Insurance": "shield",
    "Energy/Gas/Electric": "zap",
    "Mortgage Payments": "home",
    "Online payment service": "credit-card",
  };

  // Extract the main category if it contains a colon
  const mainCategory = category.split(":")[0].trim();

  // Try to match the full category first, then the main category, or default to 'file-text'
  return categoryMap[category] || categoryMap[mainCategory] || "file-text";
}

// Function to populate transaction table
function populateTransactionTable(transactionData) {
  try {
    // First, find the container that holds the table
    const transactionContainer = document.querySelector('[data-container="transactions"]');
    
    if (!transactionContainer) {
      console.error('Transaction container not found. Make sure there is a div with data-container="transactions" attribute.');
      return;
    }
    
    // Find the table within the container
    const transactionTable = transactionContainer.querySelector('table');
    
    if (!transactionTable) {
      console.error('No table found within the transaction container.');
      return;
    }
    
    // Find or create tbody
    let tableBody = transactionTable.querySelector('tbody');
    
    if (!tableBody) {
      console.log('No tbody found, creating one');
      tableBody = document.createElement('tbody');
      transactionTable.appendChild(tableBody);
    }
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    // Sort transactions by date (newest first)
    const sortedTransactions = [...transactionData.transactions]
      .sort((a, b) => {
        return new Date(b.depositTransaction.transactionTimestamp) - 
               new Date(a.depositTransaction.transactionTimestamp);
      });
    
    // Add rows for each transaction
    sortedTransactions.forEach(item => {
      const transaction = item.depositTransaction;
      const amount = transaction.amount;
      
      // Create new row
      const row = document.createElement('tr');
      
      // Format the transaction date
      const date = formatDate(transaction.transactionTimestamp);
      
      // Determine transaction class based on amount
      const transactionClass = amount >= 0 ? 
        'custom-transaction-positive' : 'custom-transaction-negative';
      
      // Get appropriate icon
      const icon = getCategoryIcon(transaction.subCategory);
      
      // Format amount with sign
      const formattedAmount = amount >= 0 ? 
        `+${formatCurrency(amount)}` : 
        `-${formatCurrency(amount)}`;
      
      // Create row HTML
      row.innerHTML = `
        <td>${date}</td>
        <td>
          <div class="d-flex align-items-center">
            <div class="bg-light rounded-circle p-2 me-3">
              <i class="bi bi-${icon}"></i>
            </div>
            <div>
              <p class="mb-0 fw-medium">${transaction.description.trim()}</p>
            </div>
          </div>
        </td>
        <td><span class="badge bg-light text-dark">${transaction.subCategory}</span></td>
        <td class="text-end ${transactionClass}">${formattedAmount}</td>
      `;
      
      tableBody.appendChild(row);
    });
    
    console.log('Transaction table populated successfully with', sortedTransactions.length, 'transactions');
  } catch (error) {
    console.error('Error populating transaction table:', error);
  }
}
