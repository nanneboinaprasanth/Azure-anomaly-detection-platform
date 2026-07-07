# Startup Guide

Use this guide to run the project locally and understand the Azure deployment path.

## 1. Open the Dashboard

The dashboard is a static browser app.

```powershell
start index.html
```

You can also double-click `index.html` from File Explorer.

## 2. Review the Azure Stream Analytics Query

Open:

```text
azure/stream-analytics/fraud-detection-query.sql
```

The query detects cards with more than three transactions in a five-minute tumbling window and sends the result to an Azure Function output.

## 3. Build the Java Azure Function

Install these first:

- Java 17
- Maven
- Azure Functions Core Tools, if you want to run locally

Then run:

```powershell
cd azure/functions
mvn clean package
```

To run the Function locally:

```powershell
mvn azure-functions:run
```

Use this sample payload for testing:

```text
azure/sample-events/fraud-alert-output.json
```

## 4. Deploy Azure Infrastructure

Install and sign in to Azure CLI first:

```powershell
az login
```

Create the resource group:

```powershell
az group create --name rg-realtime-anomaly --location eastus
```

Deploy the Bicep template:

```powershell
az deployment group create --resource-group rg-realtime-anomaly --template-file azure/infra/main.bicep --parameters azure/infra/main.parameters.json
```

## 5. Connect the Stream Analytics Job

After infrastructure deployment, configure the Stream Analytics job in Azure Portal:

1. Add Event Hubs as the input.
2. Add the Java Azure Function as the alert output.
3. Paste the query from `azure/stream-analytics/fraud-detection-query.sql`.
4. Start the Stream Analytics job.

## 6. Expected Flow

```text
Event producers -> Event Hubs -> Stream Analytics -> Java Azure Function -> Cosmos DB / alerts / dashboards
```
