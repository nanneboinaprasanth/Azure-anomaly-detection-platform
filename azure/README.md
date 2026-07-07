# Azure Deployment Files

This folder contains the Azure-side reference implementation for the real-time anomaly detection platform.

## Contents

- `infra/main.bicep` provisions the core Azure resources.
- `infra/main.parameters.json` provides sample deployment parameters.
- `stream-analytics/fraud-detection-query.sql` contains the Stream Analytics query.
- `functions/` contains a Java HTTP-triggered Azure Function that receives alerts.
- `sample-events/transaction-event.json` shows the expected event payload using `CardNumber` and `TransactionTimestamp`.
- `sample-events/fraud-alert-output.json` shows the Function input created by Stream Analytics.

## Target Architecture

1. Producers send transaction events into Azure Event Hubs.
2. Azure Stream Analytics reads from Event Hubs and runs fraud/anomaly detection queries.
3. Suspicious records are sent to a Java Azure Function output.
4. The Java Azure Function can notify Slack, create tickets, call Logic Apps, or update risk state.
5. Processed and raw data can be stored in Cosmos DB or Azure Data Explorer.
6. Power BI can subscribe to streaming output for real-time dashboards.

## Deploy Infrastructure

```powershell
az group create --name rg-realtime-anomaly --location eastus
az deployment group create --resource-group rg-realtime-anomaly --template-file azure/infra/main.bicep --parameters azure/infra/main.parameters.json
```

## Notes

The Bicep file provisions the foundation. Stream Analytics job inputs and outputs often need connection strings, managed identity permissions, and dashboard workspace details that differ by tenant, so the query and handler are provided as separate files for easy setup.
