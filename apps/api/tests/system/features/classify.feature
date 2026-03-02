# classify.feature
Feature: Classify endpoint
  El endpoint /classify distingue algoritmos iterativos y recursivos.

  Scenario: Clasificar algoritmo iterativo por source
    When envio POST a "/classify" con body source con FOR simple
    Then el codigo de respuesta es 200
    And responde ok True
    And la respuesta tiene kind "iterative"

  Scenario: Clasificar algoritmo recursivo por source
    When envio POST a "/classify" con body source con factorial recursivo
    Then el codigo de respuesta es 200
    And si ok entonces kind es recursive o hybrid
