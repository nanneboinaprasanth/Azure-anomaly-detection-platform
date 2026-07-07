package com.pulseops.functions.model;

public record FraudIncident(
    String incidentId,
    String cardNumber,
    int transactionCount,
    String windowEnd,
    String severity,
    String detectedAt,
    String recommendedAction) {
}
