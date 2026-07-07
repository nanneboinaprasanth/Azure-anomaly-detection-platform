package com.pulseops.functions.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class FraudAlert {
  @JsonProperty("CardNumber")
  private String cardNumber;

  @JsonProperty("TransactionCount")
  private int transactionCount;

  @JsonProperty("WindowEnd")
  private String windowEnd;

  public String getCardNumber() {
    return cardNumber;
  }

  public void setCardNumber(String cardNumber) {
    this.cardNumber = cardNumber;
  }

  public int getTransactionCount() {
    return transactionCount;
  }

  public void setTransactionCount(int transactionCount) {
    this.transactionCount = transactionCount;
  }

  public String getWindowEnd() {
    return windowEnd;
  }

  public void setWindowEnd(String windowEnd) {
    this.windowEnd = windowEnd;
  }
}
