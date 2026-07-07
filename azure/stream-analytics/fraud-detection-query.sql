-- Stream Analytics Query Language (SAQL)
-- Detect potential fraud when one card has more than 3 transactions
-- inside a 5-minute tumbling window.

WITH PotentialFraud AS (
  SELECT
    CardNumber,
    COUNT(*) AS TransactionCount,
    System.Timestamp() AS WindowEnd
  FROM
    [your-event-hub-input]
  TIMESTAMP BY TransactionTimestamp
  GROUP BY
    CardNumber,
    TumblingWindow(minute, 5)
  HAVING
    COUNT(*) > 3
)

-- Output to an Azure Function for alerting.
SELECT
  CardNumber,
  TransactionCount,
  WindowEnd
INTO
  [alert-output-to-function]
FROM
  PotentialFraud;
