# analyze_open.feature
Feature: Analyze open endpoint
  El endpoint POST /analyze/open analiza complejidad de pseudocódigo.

  Scenario: Analizar bucle iterativo simple
    When envio POST a "/analyze/open" con source bucle FOR simple y mode "worst"
    Then el codigo de respuesta es 200
    And el analisis es exitoso
    And la respuesta tiene byLine no vacio

  Scenario: Analizar algoritmo con WHILE
    When envio POST a "/analyze/open" con source WHILE lineal y mode "worst"
    Then el codigo de respuesta es 200
    And el analisis es exitoso

  Scenario: Payload invalido devuelve error
    When envio POST a "/analyze/open" con body invalido
    Then el codigo de respuesta es 422
