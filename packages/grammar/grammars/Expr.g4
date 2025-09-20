grammar Expr;

prog   : expr EOF ;

expr
  : expr op=('*'|'/') expr
  | expr op=('+'|'-') expr
  | INT
  | '(' expr ')'
  ;

INT    : [0-9]+ ;
WS     : [ \t\r\n]+ -> skip ;
