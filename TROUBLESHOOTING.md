# Troubleshooting

## Dashboard Does Not Open

Make sure you are opening the root `index.html` file, not a file inside the `azure/` folder.

```powershell
start index.html
```

## Dashboard Opens But Charts Are Empty

Refresh the browser. The dashboard uses simulated live data from `app.js`, so no Azure connection is required for the local UI.

## `java` Is Not Recognized

Java is not installed or not on PATH.

Fix:

1. Install JDK 17.
2. Restart the terminal.
3. Check:

```powershell
java -version
```

## `mvn` Is Not Recognized

Maven is not installed or not on PATH.

Fix:

1. Install Apache Maven.
2. Restart the terminal.
3. Check:

```powershell
mvn -version
```

## Maven Build Fails

Run Maven from the Java Function folder:

```powershell
cd azure/functions
mvn clean package
```

Also confirm Java 17 is active:

```powershell
java -version
```

## Azure CLI Is Not Recognized

Install Azure CLI, restart the terminal, then run:

```powershell
az version
az login
```

## Bicep Deployment Fails Because A Name Already Exists

Some Azure resource names must be globally unique. Change the `environment` value or add a custom `uniqueSuffix` parameter.

Example:

```powershell
az deployment group create --resource-group rg-realtime-anomaly --template-file azure/infra/main.bicep --parameters azure/infra/main.parameters.json uniqueSuffix=myunique123
```

## Stream Analytics Query Field Errors

The query expects these event fields:

- `CardNumber`
- `TransactionTimestamp`

Check the sample event:

```text
azure/sample-events/transaction-event.json
```

## Azure Function Receives Bad Request

The Java Function expects alert output from Stream Analytics with:

- `CardNumber`
- `TransactionCount`
- `WindowEnd`

Check the sample alert:

```text
azure/sample-events/fraud-alert-output.json
```

## Git Push Fails

Confirm the remote:

```powershell
git remote -v
```

If authentication fails, sign in with GitHub credentials or use GitHub Desktop / Git Credential Manager.
