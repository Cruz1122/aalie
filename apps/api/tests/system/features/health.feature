# health.feature
Feature: Health endpoint
  El endpoint /health debe indicar que el servicio está operativo.

  Scenario: GET /health responde ok
    When envio GET a "/health"
    Then el codigo de respuesta es 200
    And el cuerpo contiene status "ok"

  Scenario: POST /health no permitido
    When envio POST a "/health"
    Then el codigo de respuesta es 405
