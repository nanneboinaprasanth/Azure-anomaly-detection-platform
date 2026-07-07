# Real-Time Data Analytics and Anomaly Detection Platform

This is a browser-based reference project with a Java Azure Function backend sample for a senior Azure streaming architecture. It simulates live transaction events, scores anomalies with a rolling baseline, displays operational metrics, and documents how the same pattern maps to Azure services.

## Business Problem

A company needs to monitor high-throughput financial transactions, IoT readings, or e-commerce events in real time. The system should detect suspicious behavior within seconds and trigger operational action before business impact grows.

## Azure Architecture

- **Azure Event Hubs** ingests high-volume event streams with partitions and consumer groups.
- **Azure Stream Analytics** performs windowed aggregations, joins, and anomaly logic with SQL-like queries.
- **Azure Functions** reacts to anomaly outputs by sending alerts, creating tickets, or triggering Logic Apps.
- **Azure Cosmos DB** stores operational alert state and low-latency lookup data.
- **Azure Data Explorer** stores high-volume historical telemetry for forensic and ad-hoc analysis.
- **Power BI** visualizes real-time metrics and anomaly trends.

## Demo Features

- Live simulated transaction stream
- Adjustable anomaly sensitivity and stream velocity
- Rolling baseline anomaly scoring
- Incident feed for suspicious events
- Throughput and source distribution charts
- Stream Analytics fraud-query reference
- Azure service flow and architecture goal sections
- Azure infrastructure and runtime reference files in `azure/`

## Azure Files

- `azure/infra/main.bicep` provisions Event Hubs, Stream Analytics, Azure Functions, Cosmos DB, Storage, and Application Insights.
- `azure/stream-analytics/fraud-detection-query.sql` contains fraud/anomaly detection logic.
- `azure/functions/` contains the Java Azure Function alert action handler.
- `azure/sample-events/transaction-event.json` contains a sample transaction payload using the same `CardNumber` and `TransactionTimestamp` fields as the Stream Analytics query.
- `azure/sample-events/fraud-alert-output.json` contains the payload sent from Stream Analytics to the Java Function.

## Run

Open `index.html` in a browser. No package install or build step is required.

For full setup steps, see [STARTUP.md](STARTUP.md).

For common problems and fixes, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md).

## Java Function

The Azure Function backend is a Java Maven project in `azure/functions/`.

```powershell
cd azure/functions
mvn clean package
```
