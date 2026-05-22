export const lexer = `
:- [library(dcg/basics)].

% keywords
type(int,    'palabra reservada').
type(float,  'palabra reservada').
type(double, 'palabra reservada').
type(bool,   'palabra reservada').
type(string, 'palabra reservada').
type(void,   'palabra reservada').
type(main,   'palabra reservada').
type(if,     'palabra reservada').
type(else,   'palabra reservada').
type(do,     'palabra reservada').
type(while,  'palabra reservada').
type(for,    'palabra reservada').
type(return, 'palabra reservada').
type(true,   'palabra reservada').
type(false,  'palabra reservada').

% arithmetic operators
type(+,   aritmetico).
type(-,   aritmetico).
type(*,   aritmetico).
type(/,   aritmetico).
type('%', aritmetico).

% logical operators
type('&&', 'lógico').
type('||', 'lógico').
type('!',  'lógico').

% comparison operators
type(==,   'comparación').
type('!=', 'comparación').
type(<,    'comparación').
type(<=,   'comparación').
type(>,    'comparación').
type(>=,   'comparación').

% math
type('++', incremento).
type('--', decremento).

% assigment
type('=',  'asignación').

% steam
type('>>', iostream).
type('<<', ostream).

% punctuation
type('(', 'puntuación').
type(')', 'puntuación').
type('{', 'puntuación').
type('}', 'puntuación').
type('[', 'puntuación').
type(']', 'puntuación').
type(;,   'puntuación').
type(',', 'puntuación').

% literals
type(Atom, real):- float(Atom).
type(Atom, entero):- integer(Atom).
type(Atom, cadena):-
    atom_codes(Atom, [34 | Rest]),
    last(Rest, 34).

% identifiers
type(Atom, identificador):-
    atom_codes(Atom, [First | Rest]),
    identifier_start(First),
    maplist(identifier_content, Rest).

identifier_start(Code):- is_alpha(Code).         % a-z, A-Z
identifier_start(95).                            % underscore _

identifier_content(Code):- is_alnum(Code).       % a-z, A-Z, 0-9
identifier_content(95).  

% ------------------------------------------------------------
% HELPERS
% ------------------------------------------------------------
%   check if given code belongs to a digit
is_digit(D):- D >= 48, D =< 57.

%   check if given code belongs to a letter
is_alpha(D):- D >= 65, D =< 90.
is_alpha(D):- D >= 97, D =< 122.

is_alnum(D):- is_digit(D) ; is_alpha(D).

skip_to_close(E, E) :-
    E = [int - _, main - _ , '(' - _ | _], !.

skip_to_close(E, E) :-
    E = [Tipo - _, _ - identificador, '(' - _ | _],
    es_tipo_dato(Tipo), !.

skip_to_close(['}' - _ | T], T):- !.

skip_to_close([_ | T], R) :- 
    skip_to_close(T, R).

%   new_line
%   sets new line of tokens
new_line:-
    line(Line),
    NewLine is Line + 1,
    retractall(line(_)),
    asserta(line(NewLine)).

% ------------------------------------------------------------
% TOKENIZER
% ------------------------------------------------------------
%!  tokenize(+String, -Tokens)
%   convert a string into a list of tokens.
tokenize(String, Tokens):-
    retractall(line(_)),
    asserta(line(1)),

    atom_codes(String, Codes),
    atoms(Codes, Tokens).

%!  token(+Tokens, -Token-Type) 
token([], []).

token([Line-Token | Rest], [Line-Token-Type | Remaining]):-
    type(Token, Type), !,
    token(Rest, Remaining).

token([Token | Rest], [Token-error | Remaining]):-
    token(Rest, Remaining).


% ------------------------------------------------------------
% ATOMS
% ------------------------------------------------------------
%!  atoms(+CharacterCodes, -Atoms)
atoms([], []).

%   skip whitespace (space, tab, newline, carriage-return)
atoms([32 | Rest], Atoms):- !, atoms(Rest, Atoms).   % space
atoms([9  | Rest], Atoms):- !, new_line, atoms(Rest, Atoms).   % \t
atoms([10 | Rest], Atoms):- !, atoms(Rest, Atoms).   % \n
atoms([13 | Rest], Atoms):- !, atoms(Rest, Atoms).   % \r

%   string literals
atoms([34 | RestCodes], [Atom-Line | RestAtoms]):-
    !,
    line(Line),
    build_string(RestCodes, StringCodes, RemainingCodes),
    atom_codes(Atom, [34 | StringCodes]),
    atoms(RemainingCodes, RestAtoms).

%   two-character operators
atoms([38,  38  | Rest], [Line-'&&' | RestAtoms]):- !, line(Line), atoms(Rest, RestAtoms).
atoms([124, 124 | Rest], [Line-'||' | RestAtoms]):- !, line(Line), atoms(Rest, RestAtoms).
atoms([61,  61  | Rest], [Line-'==' | RestAtoms]):- !, line(Line), atoms(Rest, RestAtoms).
atoms([33,  61  | Rest], [Line-'!=' | RestAtoms]):- !, line(Line), atoms(Rest, RestAtoms).
atoms([60,  61  | Rest], [Line-'<=' | RestAtoms]):- !, line(Line), atoms(Rest, RestAtoms).
atoms([62,  61  | Rest], [Line-'>=' | RestAtoms]):- !, line(Line), atoms(Rest, RestAtoms).
atoms([62,  62  | Rest], [Line-'>>' | RestAtoms]):- !, line(Line), atoms(Rest, RestAtoms).
atoms([60,  60  | Rest], [Line-'<<' | RestAtoms]):- !, line(Line), atoms(Rest, RestAtoms).
atoms([43,  43  | Rest], [Line-'++' | RestAtoms]):- !, line(Line), atoms(Rest, RestAtoms).
atoms([45,  45  | Rest], [Line-'--' | RestAtoms]):- !, line(Line), atoms(Rest, RestAtoms).

%   single-character operators and punctuation
atoms([38  | Rest], [Line-'&' | RestAtoms]):- !, line(Line), atoms(Rest, RestAtoms).
atoms([124 | Rest], [Line-'|' | RestAtoms]):- !, line(Line), atoms(Rest, RestAtoms).
atoms([40  | Rest], [Line-'(' | RestAtoms]):- !, line(Line), atoms(Rest, RestAtoms).   % (
atoms([41  | Rest], [Line-')' | RestAtoms]):- !, line(Line), atoms(Rest, RestAtoms).   % )
atoms([123 | Rest], [Line-'{' | RestAtoms]):- !, line(Line), atoms(Rest, RestAtoms).   % {
atoms([125 | Rest], [Line-'}' | RestAtoms]):- !, line(Line), atoms(Rest, RestAtoms).   % }
atoms([91  | Rest], [Line-'[' | RestAtoms]):- !, line(Line), atoms(Rest, RestAtoms).   % [
atoms([93  | Rest], [Line-']' | RestAtoms]):- !, line(Line), atoms(Rest, RestAtoms).   % ]
atoms([59  | Rest], [Line-';' | RestAtoms]):- !, line(Line), atoms(Rest, RestAtoms).   % ;
atoms([44  | Rest], [Line-',' | RestAtoms]):- !, line(Line), atoms(Rest, RestAtoms).   % ,
atoms([43  | Rest], [Line-'+' | RestAtoms]):- !, line(Line), atoms(Rest, RestAtoms).   % +
atoms([45  | Rest], [Line-'-' | RestAtoms]):- !, line(Line), atoms(Rest, RestAtoms).   % -
atoms([42  | Rest], [Line-'*' | RestAtoms]):- !, line(Line), atoms(Rest, RestAtoms).   % *
atoms([47  | Rest], [Line-'/' | RestAtoms]):- !, line(Line), atoms(Rest, RestAtoms).   % /
atoms([37  | Rest], [Line-'%' | RestAtoms]):- !, line(Line), atoms(Rest, RestAtoms).   % %
atoms([33  | Rest], [Line-'!' | RestAtoms]):- !, line(Line), atoms(Rest, RestAtoms).   % !
atoms([61  | Rest], [Line-'=' | RestAtoms]):- !, line(Line), atoms(Rest, RestAtoms).   % =
atoms([60  | Rest], [Line-'<' | RestAtoms]):- !, line(Line), atoms(Rest, RestAtoms).   % <
atoms([62  | Rest], [Line-'>' | RestAtoms]):- !, line(Line), atoms(Rest, RestAtoms).   % >

%   skip empty word
atoms(Codes, RestAtoms):-
    build(Codes, WordCodes, RemainingCodes),
    WordCodes = [],
    !,
    atoms(RemainingCodes, RestAtoms).

%   float literal
atoms(Codes, [Line-Atom | RestAtoms]):-
    line(Line),
    build(Codes, FloatCodes, RemainingCodes),
    build_float(Atom, FloatCodes),
    !,
    atoms(RemainingCodes, RestAtoms).

%   integer literal
atoms(Codes, [Line-Atom | RestAtoms]):-
    line(Line),
    build(Codes, IntegerCodes, RemainingCodes),
    build_integer(Atom, IntegerCodes),
    !,
    atoms(RemainingCodes, RestAtoms).

%   generic word
atoms(Codes, [Line-Atom | RestAtoms]):-
    line(Line),
    build(Codes, WordCodes, RemainingCodes),
    atom_codes(Atom, WordCodes),
    atoms(RemainingCodes, RestAtoms).

%!  special_char(+Code)
%   true when Code is an operator or punctuation character.
%   build/3 stops when it sees one of these.
special_char(40).   % (
special_char(41).   % )
special_char(123).  % {
special_char(125).  % }
special_char(91).   % [
special_char(93).   % ]
special_char(59).   % ;
special_char(44).   % ,
special_char(38).   % &
special_char(124).  % |
special_char(61).   % =
special_char(33).   % !
special_char(60).   % <
special_char(62).   % >
special_char(43).   % +
special_char(45).   % -
special_char(42).   % *
special_char(47).   % /
special_char(37).   % %

% ------------------------------------------------------------
% BUILDERS
% ------------------------------------------------------------
%!  build_string(+InputCodes, -WordCodes, -Remainder)
%   collect codes inside a string literal until the closing quotes
build_string([34 | T], [34], T):- !.
build_string([], [], []).
build_string([H | T], [H | WordTail], Remainder):-
    build_string(T, WordTail, Remainder).

%!  build(+InputCodes, -WordCodes, -Remainder)
%   collect alphanumeric/underscore codes into a word.
%   stops at whitespace (consuming it) or a special char (leaving it).
build([32 | T], [], T):- !.    % space      
build([9  | T], [], T):- !.    % tab        
build([10 | T], [], T):- !.    % newline    
build([13 | T], [], T):- !.    % cr     
build([], [], []).

build([H | T], [], [H | T]):-  % special char
    special_char(H), !.

build([H | T], [H | WordTail], Remainder):-
    build(T, WordTail, Remainder).

build_integer(I, [D0 | T0]):-
        is_digit(D0),
        digits_(T0, D1, []),
        number_codes(I, [D0 | D1]).

build_float(F, F0):- 
    digits_(F0, D0, [46 | T0]),
    digits_(T0, D1, []), 
    D0 = [_ | _], 
    D1 = [_ | _],
    append(D0, [46 | D1], Codes), 
    number_codes(F, Codes).

digits_([], [], []).
digits_([46 | T], [], [46 | T]).
digits_([D | T], [D | R], Rest):- is_digit(D), !, digits_(T, R, Rest).
 
es_tipo_dato(int).
es_tipo_dato(float).
es_tipo_dato(double).
es_tipo_dato(bool).
es_tipo_dato(string).
es_tipo_dato(void).
 
es_op_bin(_ - aritmetico).
es_op_bin(_ - 'comparación').
es_op_bin(_ - 'lógico').
 
es_op_un('!' - 'lógico').
es_op_un((-) - aritmetico).
 
es_literal(_ - entero).
es_literal(_ - real).
es_literal(_ - cadena).
es_literal(true - _).
es_literal(false - _).
 
% ------------------------------------------------------------
% EXPRESIÓN
% ------------------------------------------------------------
parse_expr(E, S) :-
    parse_atomo(E, Mid),
    parse_expr_cola(Mid, S).
 
parse_expr_cola([Op | Mid], S) :-
    es_op_bin(Op), !, 
    parse_expr(Mid, S).
parse_expr_cola(S, S).
 
parse_atomo(['(' - _ | E], S) :-
    !,
    parse_expr(E, [')' - _ | S]).
parse_atomo([Op | E], S) :-
    es_op_un(Op), !,
    parse_atomo(E, S).
parse_atomo([T | S], S) :-
    es_literal(T), !.
parse_atomo([_ - identificador | S], S) :- !.
 
% ------------------------------------------------------------
% PARÁMETROS
% ------------------------------------------------------------
parse_params([')' - _ | S], S, []) :- !.
parse_params([Tipo - _ , Nombre - identificador | E], S, [Tipo-Nombre | Resto]) :-
    es_tipo_dato(Tipo), !,
    parse_params_sep(E, S, Resto).
parse_params(S, S, []).
 
parse_params_sep([',' - _ | E], S, Resto) :-
    !, parse_params(E, S, Resto).
parse_params_sep([')' - _ | S], S, []) :- !.
 
params_a_texto([], '()').
params_a_texto(Params, Texto) :-
    Params \\= [],
    maplist(par_texto, Params, Partes),
    atomic_list_concat(Partes, ', ', Interior),
    atom_concat('(', Interior, T1),
    atom_concat(T1, ')', Texto).
 
par_texto(Tipo - Nombre, Parte) :-
    atomic_list_concat([Tipo, ' ', Nombre], Parte).
 
% ------------------------------------------------------------
% DECLARACIÓN DE VARIABLE
% ------------------------------------------------------------
parse_vardef([Tipo - _ , Nombre - identificador | E], S, Pos,
             sym(Nombre, variable, Tipo, Valor, '-', Pos)) :-
    es_tipo_dato(Tipo),
    parse_vardef_init(E, S, Valor).
 
parse_vardef_init([';' - _ | S], S, '-') :- !.
parse_vardef_init(['=' - _ | E], S, '(expr)') :-
    !, parse_expr(E, [';' - _ | S]).
parse_vardef_init(['{' - _ | E], S, '(init-list)') :-
    !, parse_expr(E, ['}' - _ , ';' - _ | S]).
 
% ------------------------------------------------------------
% BLOQUE Y SENTENCIAS
% ------------------------------------------------------------
parse_bloque(['{' - _ | E], S, Syms) :-
    parse_vardefs(E, Mid, Syms, 0),
    parse_stmts(Mid, ['}' - _ | S]).
 
parse_vardefs(E, S, [Sym | Resto], Pos) :-
    E = [Tipo - _ , Nombre - identificador | _],
    Nombre \\= main,
    es_tipo_dato(Tipo), !,
    parse_vardef(E, Mid, Pos, Sym),
    Pos1 is Pos + 1,
    parse_vardefs(Mid, S, Resto, Pos1).
parse_vardefs(E, E, [], _).
 
parse_stmts(E, E) :- E = ['}' - _ | _], !.
parse_stmts([], []) :- !.
parse_stmts(E, S) :-
    parse_stmt(E, Mid),
    parse_stmts(Mid, S).
 
% ------------------------------------------------------------
% SENTENCIAS
% ------------------------------------------------------------
parse_stmt([_ - identificador , '=' - _ | E], S) :-
    !, parse_expr(E, [';' - _ | S]).
parse_stmt([_ - identificador , '++' - _ , ';' - _ | S], S) :- !.
parse_stmt([_ - identificador , '--' - _ , ';' - _ | S], S) :- !.
parse_stmt(['++' - _ , _ - identificador , ';' - _ | S], S) :- !.
parse_stmt(['--' - _ , _ - identificador , ';' - _ | S], S) :- !.
parse_stmt([_ - identificador, OpComp - _ | E], S) :-
    atom(OpComp), atom_concat(_, '=', OpComp), !,
    parse_expr(E, [';' - _ | S]).
parse_stmt([return - _ , ';' - _ | S], S) :- !.
parse_stmt([return - _ | E], S) :- !, parse_expr(E, [';' - _ | S]).
parse_stmt([std - _, '::' - _, cout - _, '<<' - _ | E], S) :- !,
    parse_ostream_cola(E, [';' - _ | S]).
parse_stmt([std - _, '::' - _, cin - _, '>>' - _, _ - identificador, ';' - _ | S], S) :- !.

parse_stmt([if    - _ | E], S) :- !, parse_if(E, S).
parse_stmt([while - _ | E], S) :- !, parse_while(E, S).
parse_stmt([do    - _ | E], S) :- !, parse_do(E, S).
parse_stmt([for   - _ | E], S) :- !, parse_for(E, S).

parse_ostream_cola(E, S) :-
    parse_expr(E, Mid),
    parse_ostream_resto(Mid, S).

parse_ostream_resto(['<<' - _ | E], S) :- !,
    parse_ostream_cola(E, S).
parse_ostream_resto(S, S).

% ------------------------------------------------------------
% ESTRUCTURAS DE CONTROL
% ------------------------------------------------------------
parse_if(['(' - _ | E], S) :-
    parse_expr(E, [')' - _ | Mid]),
    parse_bloque(Mid, Mid2, _),
    parse_else(Mid2, S).
 
parse_else([else - _ , if - _ | E], S) :- !, parse_if(E, S).
parse_else([else - _ | E], S)          :- !, parse_bloque(E, S, _).
parse_else(E, E).
 
parse_while(['(' - _ | E], S) :-
    parse_expr(E, [')' - _ | Mid]),
    parse_bloque(Mid, S, _).
 
parse_do(E, S) :-
    parse_bloque(E, [while - _ , '(' - _ | Mid], _),
    parse_expr(Mid, [')' - _ , ';' - _ | S]).
 
parse_for(['(' - _ | E], S) :-
    parse_stmt(E, Mid1),
    parse_expr(Mid1, [';' - _ | Mid2]),
    parse_update(Mid2, [')' - _ | Mid3]),
    parse_bloque(Mid3, S, _).

parse_update([_ - identificador , '++' - _ | S], S) :- !.
parse_update([_ - identificador , '--' - _ | S], S) :- !.
parse_update(['++' - _ , _ - identificador | S], S) :- !.
parse_update(['--' - _ , _ - identificador | S], S) :- !.
parse_update([_ - identificador , '=' - _ | E], S) :- !, parse_expr(E, S).
parse_update([_ - identificador, OpComp - _ | E], S) :-
    atom(OpComp), atom_concat(_, '=', OpComp), !,
    parse_expr(E, S).
 
% ------------------------------------------------------------
% DEFINICIÓN DE FUNCIÓN
% ------------------------------------------------------------
parse_fundef([Tipo - _ , Nombre - identificador , '(' - _ | E], Resto,
             sym(Nombre, funcion, Tipo, '-', ParamsStr, 0), ErrsIn, ErrsOut) :-
    es_tipo_dato(Tipo),
    Nombre \\= main,
    parse_params(E, Mid, Params),
    Mid = ['{' - _ | _], !,
    params_a_texto(Params, ParamsStr), 
    evaluar_cuerpo_funcion(Nombre, Mid, Resto, ErrsIn, ErrsOut).

evaluar_cuerpo_funcion(_, Mid, Resto, ErrsIn, ErrsIn) :-
    parse_bloque(Mid, Resto, _), !.

evaluar_cuerpo_funcion(Nombre, Mid, Resto, ErrsIn, ErrsOut) :-
    atomic_list_concat(['Error sintáctico interno en la función "', Nombre, '". Verifique instrucciones o signos de puntuación.'], Msg),
    ErrsOut = [Msg | ErrsIn],
    % Forzamos un skip controlado por llaves balanceadas desde la apertura '{' de la función
    skip_bloque_con_llaves(Mid, Resto).
 
% ------------------------------------------------------------
% FUNCIÓN MAIN
% ------------------------------------------------------------
parse_main([int - _ , main - _ , '(' - _ , void - _ , ')' - _ | E], S) :-
    parse_bloque(E, S, _).
 
% ------------------------------------------------------------
% PROGRAMA COMPLETO
% ------------------------------------------------------------

parse_programa([], Funs, Funs, Errs, Errs, _).

parse_programa(E, FunsIn, FunsOut, ErrsIn, ErrsOut, true) :-
    E = [int - _ , main - _ , '(' - _ , void - _ , ')' - _ | RestoFirma], 
    !,
    evaluar_main_y_continuar(RestoFirma, FunsIn, FunsOut, ErrsIn, ErrsOut).

parse_programa(E, FunsIn, FunsOut, ErrsIn, ErrsOut, TieneMain) :-
    parse_fundef(E, Resto, Sym, ErrsIn, ErrsMid), 
    !,
    parse_programa(Resto, [Sym | FunsIn], FunsOut, ErrsMid, ErrsOut, TieneMain).

parse_programa(E, FunsIn, FunsOut, ErrsIn, ErrsOut, TieneMain) :-
    E = [Tipo - _, Nombre - identificador | Resto0],
    es_tipo_dato(Tipo), Nombre \\= main, !,
    atomic_list_concat(['Error sintáctico en la firma o estructura de la función "', Nombre, '".'], Msg),
    skip_bloque_con_llaves(Resto0, Resto),
    parse_programa(Resto, FunsIn, FunsOut, [Msg | ErrsIn], ErrsOut, TieneMain).

parse_programa([Token - _ | Resto], FunsIn, FunsOut, ErrsIn, ErrsOut, TieneMain) :-
    \\+ es_tipo_dato(Token),
    Token \\= '}', 
    !,
    atomic_list_concat(['Error sintáctico: Elemento no permitido o fuera de lugar en el espacio global ("', Token, '").'], Msg),
    parse_programa(Resto, FunsIn, FunsOut, [Msg | ErrsIn], ErrsOut, TieneMain).

parse_programa(['}' - _ | Resto], FunsIn, FunsOut, ErrsIn, ErrsOut, TieneMain) :- 
    !,
    parse_programa(Resto, FunsIn, FunsOut, ErrsIn, ErrsOut, TieneMain).

parse_programa([_ | Resto], FunsIn, FunsOut, ErrsIn, ErrsOut, TieneMain) :-
    !,
    parse_programa(Resto, FunsIn, FunsOut, ErrsIn, ErrsOut, TieneMain).

% ============================================================================
% PREDICADOS AUXILIARES
% ============================================================================

evaluar_main_y_continuar(['{' - L | RestoBloque], FunsIn, FunsOut, ErrsIn, ErrsOut) :-
    !,
    ( parse_bloque(['{' - L | RestoBloque], TokensPostMain, _) ->
        parse_programa(TokensPostMain, FunsIn, FunsOut, ErrsIn, ErrsOut, true)
    ;
        atomic_list_concat(['Error sintáctico dentro del cuerpo de la función "main". Verifique los puntos y coma o sentencias.'], Msg),
        skip_bloque_con_llaves(['{' - L | RestoBloque], TokensPostMain),
        parse_programa(TokensPostMain, FunsIn, FunsOut, [Msg | ErrsIn], ErrsOut, true)
    ).

evaluar_main_y_continuar(RestoFirma, FunsIn, FunsOut, ErrsIn, ErrsOut) :-
    atomic_list_concat(['Error sintáctico: Se esperaba "{" después de la firma de int main(void).'], Msg),
    parse_programa(RestoFirma, FunsIn, FunsOut, [Msg | ErrsIn], ErrsOut, true).

skip_bloque_con_llaves([], []).
skip_bloque_con_llaves(['{' - _ | T], Resto) :- !, skip_hasta_cierre_con_nivel(T, 1, Resto).
skip_bloque_con_llaves([_ | T], Resto) :- skip_bloque_con_llaves(T, Resto).

skip_hasta_cierre_con_nivel([], _, []).
skip_hasta_cierre_con_nivel(['{' - _ | T], Nivel, Resto) :- !, Nivel1 is Nivel + 1, skip_hasta_cierre_con_nivel(T, Nivel1, Resto).
skip_hasta_cierre_con_nivel(['}' - _ | T], 1, T) :- !.
skip_hasta_cierre_con_nivel(['}' - _ | T], Nivel, Resto) :- !, Nivel1 is Nivel - 1, skip_hasta_cierre_con_nivel(T, Nivel1, Resto).
skip_hasta_cierre_con_nivel([_ | T], Nivel, Resto) :- skip_hasta_cierre_con_nivel(T, Nivel, Resto).
 
% ------------------------------------------------------------
% RECOLECCIÓN DE VARIABLES GLOBAL
% ------------------------------------------------------------
recolectar_vars([], [], _).
recolectar_vars([Tipo - _ , Nombre - identificador , ';' - _ | R],
                [sym(Nombre, variable, Tipo, '-', '-', Pos) | Syms], Pos) :-
    es_tipo_dato(Tipo), Nombre \\= main, !,
    Pos1 is Pos + 1,
    recolectar_vars(R, Syms, Pos1).
recolectar_vars([Tipo - _ , Nombre - identificador , '=' - _ | R0],
                [sym(Nombre, variable, Tipo, '(expr)', '-', Pos) | Syms], Pos) :-
    es_tipo_dato(Tipo), Nombre \\= main, !,
    skip_semi(R0, R1),
    Pos1 is Pos + 1,
    recolectar_vars(R1, Syms, Pos1).
recolectar_vars([_ | R], Syms, Pos) :- !, recolectar_vars(R, Syms, Pos).

skip_semi([';' - _ | S], S) :- !.
skip_semi([_ | E], S) :- skip_semi(E, S).
skip_semi([], []).

% ------------------------------------------------------------
% VALIDACIÓN DE BALANCEO DE LLAVES Y PARÉNTESIS
% ------------------------------------------------------------
verificar_balanceo(Tokens, Error) :-
    balanceo_stack(Tokens, [], Error).

balanceo_stack([], [], _) :- !, fail. 

balanceo_stack([], [Llave - _ | _], Error) :-
    Llave == '{', !,
    Error = 'Error sintáctico: Falta llave de cierre ("}") en alguna parte del código.'.

balanceo_stack(['{' - T | Resto], Stack, Error) :- !,
    balanceo_stack(Resto, ['{' - T | Stack], Error).

balanceo_stack(['}' - _ | Resto], ['{' - _ | StackResto], Error) :- !,
    balanceo_stack(Resto, StackResto, Error).

balanceo_stack(['}' - _ | _], _, 'Error sintáctico: Llave de cierre ("}") inesperada o mal balanceada.') :- !.

balanceo_stack([_ | Resto], Stack, Error) :-
    balanceo_stack(Resto, Stack, Error).
 
% ------------------------------------------------------------
% MANEJO DE ERRORES Y ENTRADA
% ------------------------------------------------------------
errores_lexicos([], []).
errores_lexicos([T - error | R], [Msg | Errs]) :-
    !,
    atomic_list_concat(['Token desconocido: ', T], Msg),
    errores_lexicos(R, Errs).
errores_lexicos([_ | R], Errs) :- errores_lexicos(R, Errs).

comprobar_error_main(true, Errs, Errs) :- !.
comprobar_error_main(false, ErrsIn, ErrsIn) :-
    member('Error sintáctico en "main": Estructura interna o llaves incorrectas.', ErrsIn), !.
comprobar_error_main(false, ErrsIn, ['Error sintáctico: Falta la función obligatoria int main(void) o su firma es incorrecta.' | ErrsIn]).

 
analizar(Codigo, Simbolos, Errores) :-
    tokenize(Codigo, RawTokens),
    token(RawTokens, Tokens),
    errores_lexicos(Tokens, ErrLex),

    (   verificar_balanceo(Tokens, ErrBalanceo) ->
        Simbolos = [],
        Errores = [ErrBalanceo]
    ;   
        parse_programa(Tokens, [], FunSyms, [], ErrSinRaw, TieneMain),
        comprobar_error_main(TieneMain, ErrSinRaw, ErrSin),
        recolectar_vars(Tokens, VarSyms, 0),
     
        append(ErrLex, ErrSin, Errores),
        append(FunSyms, VarSyms, Simbolos)
    ).

`;
