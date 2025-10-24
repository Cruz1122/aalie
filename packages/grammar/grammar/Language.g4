grammar Language;

// ---------- parser ----------
program
  : classDef* (procDef | stmt)* EOF
  ;

// Sintaxis: Class Nombre { attr1 attr2 ... }
classDef
  : CLASS_KW ID LBRACE attrList? RBRACE
  ;

attrList
  : ID+
  ;

// ====== procedimientos/subrutinas ======
// Sintaxis: nombre(param1, param2, A[n]..[m], Clase Obj) BEGIN ... END
procDef
  : ID LPAREN paramList? RPAREN block
  ;

paramList
  : param (',' param)*
  ;

param
  : arrayParam
  | objectParam
  | ID                    // escalar
  ;

// A[n]..[m] con soporte multi-dim por repetición de corchetes
arrayParam
  : ID LBRACK arrayIndex RBRACK (RANGE LBRACK arrayIndex RBRACK)?   // p.ej. A[1]..[n] o A[n]
  ;

arrayIndex
  : ID
  | INT
  ;

arrayDim
  : LBRACK (ID | INT) RBRACK
  ;

// Clase Nombre
objectParam
  : ID ID                 // Clase + nombre_objeto
  ;

// ---------- sentencias ----------
stmt
  : assignmentStmt
  | callStmt
  | ifStmt
  | whileStmt
  | repeatStmt            // NUEVO: repeat...until
  | forStmt
  | returnStmt            // NUEVO: return expr ;
  | block
  | declVectorStmt
  | ';'
  ;

block
  : LBRACE stmt* RBRACE
  | BEGIN_KW stmt* END_KW
  ;

assignmentStmt : lvalue ASSIGN expr ';'? ;
declVectorStmt : ID indexSuffix+ ';'? ;

// Llamada como sentencia (con CALL)
callStmt       : CALL_KW ID LPAREN argList? RPAREN ';'? ;
argList        : expr (',' expr)* ;

// NUEVO: repeat…until (do-while)
repeatStmt     : REPEAT_KW stmt+ UNTIL_KW LPAREN expr RPAREN ';'? ;

// Return de procedimientos
returnStmt     : RETURN_KW expr ';' ;

ifStmt         : IF_KW LPAREN expr RPAREN THEN_KW block (ELSE_KW block)? ;
whileStmt      : WHILE_KW LPAREN expr RPAREN DO_KW block ;
forStmt        : FOR_KW ID ASSIGN expr TO_KW expr DO_KW block ;

lvalue         : ID ( fieldAccess | indexSuffix )* ;
fieldAccess    : '.' ID ;
indexSuffix    : LBRACK expr (RANGE expr)? RBRACK ; // [i] | [1..j]

// ---------- expr precedence ----------
expr       : orExpr ;
orExpr     : andExpr (OR_KW andExpr)* ;
andExpr    : relExpr (AND_KW relExpr)* ;
relExpr    : addExpr ((EQ|NEQ|LT|LE|GT|GE) addExpr)* ;
addExpr    : mulExpr ((PLUS|MINUS) mulExpr)* ;
mulExpr    : unaryExpr ((MUL|DIV_KW|MOD_KW|DIVOP) unaryExpr)* ;
unaryExpr  : NOT_KW unaryExpr
           | MINUS unaryExpr
           | primary ;
primary    : INT
           | TRUE_KW
           | FALSE_KW
           | NULL_KW
           | lengthCall
           | callExpr                 // llamada como EXPRESIÓN (sin CALL)
           | lvalue
           | LPAREN expr RPAREN ;
lengthCall : LENGTH_KW LPAREN expr RPAREN ;
callExpr   : ID LPAREN argList? RPAREN ;

// ---------- lexer ----------
LPAREN: '(' ; RPAREN: ')' ; LBRACE: '{' ; RBRACE: '}' ; LBRACK: '[' ; RBRACK: ']' ;
RANGE: '..' ; SEMI: ';' ;

ASSIGN: '<-' | ':=' ;
PLUS:'+' ; MINUS:'-' ; MUL:'*' ; DIVOP:'/' ;
EQ:'=' ; NEQ:'!=' | '<>' | '≠' ; LE:'<=' | '≤' ; GE:'>=' | '≥' ; LT:'<' ; GT:'>' ;

fragment A:[Aa]; fragment B:[Bb]; fragment C:[Cc]; fragment D:[Dd];
fragment E:[Ee]; fragment F:[Ff]; fragment G:[Gg]; fragment H:[Hh];
fragment I:[Ii]; fragment L:[Ll]; fragment M:[Mm]; fragment N:[Nn];
fragment O:[Oo]; fragment P:[Pp]; fragment R:[Rr]; fragment S:[Ss];
fragment T:[Tt]; fragment U:[Uu]; fragment V:[Vv]; fragment W:[Ww]; fragment Y:[Yy];

FOR_KW: F O R ; WHILE_KW: W H I L E ; IF_KW: I F ; THEN_KW: T H E N ; ELSE_KW: E L S E ;
BEGIN_KW: B E G I N ; END_KW: E N D ; TO_KW: T O ; DO_KW: D O ;
CALL_KW: C A L L ; AND_KW: A N D ; OR_KW: O R ; NOT_KW: N O T ;
TRUE_KW: T ; FALSE_KW: F ; NULL_KW: N U L L ; LENGTH_KW: L E N G T H ;
DIV_KW: D I V ; MOD_KW: M O D ;

// ====== NUEVOS keywords ======
CLASS_KW : C L A S S ;
RETURN_KW: R E T U R N ;
REPEAT_KW: R E P E A T ;
UNTIL_KW : U N T I L ;

ID  : [A-Za-z_][A-Za-z_0-9]* ;
INT : [0-9]+ ;

WS           : [ \t\r\n\u000C]+ -> skip ;
LINE_COMMENT : '►' ~[\r\n]* -> skip ;
SL_COMMENT   : '//' ~[\r\n]* -> skip ;
