package com.pulseops.functions;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.microsoft.azure.functions.ExecutionContext;
import com.microsoft.azure.functions.HttpMethod;
import com.microsoft.azure.functions.HttpRequestMessage;
import com.microsoft.azure.functions.HttpResponseMessage;
import com.microsoft.azure.functions.HttpStatus;
import com.microsoft.azure.functions.annotation.AuthorizationLevel;
import com.microsoft.azure.functions.annotation.FunctionName;
import com.microsoft.azure.functions.annotation.HttpTrigger;
import com.pulseops.functions.model.FraudAlert;
import com.pulseops.functions.model.FraudIncident;

import java.time.Instant;
import java.util.Optional;

public class FraudAlertFunction {
  private static final ObjectMapper MAPPER = new ObjectMapper();

  @FunctionName("fraud-alert-handler")
  public HttpResponseMessage handleAlert(
      @HttpTrigger(
          name = "req",
          methods = {HttpMethod.POST},
          authLevel = AuthorizationLevel.FUNCTION)
      HttpRequestMessage<Optional<String>> request,
      ExecutionContext context) {

    String body = request.getBody().orElse("");
    if (body.isBlank()) {
      return request
          .createResponseBuilder(HttpStatus.BAD_REQUEST)
          .body(new ErrorResponse("Request body is required"))
          .build();
    }

    try {
      FraudAlert alert = MAPPER.readValue(body, FraudAlert.class);
      if (alert.getCardNumber() == null || alert.getCardNumber().isBlank()) {
        return request
            .createResponseBuilder(HttpStatus.BAD_REQUEST)
            .body(new ErrorResponse("CardNumber is required"))
            .build();
      }

      FraudIncident incident = toIncident(alert);
      context.getLogger().info("Fraud alert incident: " + MAPPER.writeValueAsString(incident));

      return request
          .createResponseBuilder(HttpStatus.ACCEPTED)
          .header("Content-Type", "application/json")
          .body(incident)
          .build();
    } catch (Exception ex) {
      context.getLogger().warning("Could not process fraud alert: " + ex.getMessage());
      return request
          .createResponseBuilder(HttpStatus.BAD_REQUEST)
          .body(new ErrorResponse("Invalid fraud alert payload"))
          .build();
    }
  }

  private FraudIncident toIncident(FraudAlert alert) {
    int transactionCount = alert.getTransactionCount();
    String severity = transactionCount >= 5 ? "critical" : "warning";
    String action = "critical".equals(severity)
        ? "hold-card-and-page-fraud-team"
        : "create-review-ticket";

    return new FraudIncident(
        alert.getCardNumber() + "-" + alert.getWindowEnd(),
        alert.getCardNumber(),
        transactionCount,
        alert.getWindowEnd(),
        severity,
        Instant.now().toString(),
        action);
  }

  public record ErrorResponse(String error) {
  }
}
