grammar Language;

// Entrypoint
program : (functionDecl)* EOF ;

functionDecl
  : 'function' Identifier '(' (Identifier (',' Identifier)*)? ')' block
  ;

block : '{' statement* '}' ;

statement
  : variableDecl ';'
  | forStmt
  | returnStmt ';'
  ;

variableDecl
  : 'let' Identifier '=' expr
  ;

forStmt
  : 'for' '(' variableDecl ';' expr ';' assign ')' block
  ;

returnStmt
  : 'return' expr
  ;

assign
  : Identifier '=' expr
  ;

expr
  : expr ('+'|'-') expr
  | expr ('*'|'/') expr
  | Identifier
  | Number
  | ArrayAccess
  | '(' expr ')'
  ;

ArrayAccess : Identifier '[' Identifier ']' ;

// Léxico
Identifier : [a-zA-Z_][a-zA-Z_0-9]* ;
Number     : [0-9]+ ;
WS         : [ \t\r\n]+ -> skip ;
