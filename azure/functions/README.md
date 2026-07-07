# Java Azure Functions

This folder contains the Java Azure Function backend for the anomaly detection platform.

## Main Files

- `pom.xml` defines the Maven Azure Functions project.
- `src/main/java/com/pulseops/functions/FraudAlertFunction.java` handles HTTP alerts from Stream Analytics.
- `src/main/java/com/pulseops/functions/model/FraudAlert.java` maps the Stream Analytics output payload.
- `src/main/java/com/pulseops/functions/model/FraudIncident.java` returns the incident response.
- `host.json` configures the Functions host.
- `local.settings.sample.json` shows local runtime settings.

## Build

```powershell
mvn clean package
```

## Run Locally

```powershell
mvn azure-functions:run
```

Send a POST request using `../sample-events/fraud-alert-output.json`.
