# parse.feature
Feature: Grammar parse endpoint
  El endpoint /grammar/parse parsea pseudocódigo y devuelve AST o errores.

  Scenario: Parsear codigo con asignacion y FOR
    When envio POST a "/grammar/parse" con source valido
    Then el codigo de respuesta es 200
    And responde ok True
    And la respuesta tiene "errors" lista vacia

  Scenario: Parsear codigo con bloque sin cerrar devuelve error
    When envio POST a "/grammar/parse" con source invalido sin cerrar
    Then el codigo de respuesta es 200
    And la respuesta tiene "ok" False
    And la respuesta tiene al menos un error
