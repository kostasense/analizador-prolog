export const lexer = `
%:- dynamic error/2.

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

% assignment
type('=',  'asignación').

% stream
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
type(Atom, real)    :- float(Atom).
type(Atom, entero)  :- integer(Atom).
type(Atom, cadena)  :-
    atom_codes(Atom, [34 | Rest]),
    last(Rest, 34).

identifier(Atom) :-
    atom_codes(Atom, [First | Rest]),
    identifierStart(First),
    maplist(identifierContent, Rest).

identifierStart(Code) :- code_type(Code, alpha).
identifierStart(95).

identifierContent(Code) :- code_type(Code, alnum).
identifierContent(95).

tokenize(String, Tokens) :-
    atom_codes(String, Codes),
    atoms(Codes, RawTokens),
    token(RawTokens, Tokens).

token([], []).
token([Token | Rest], [Token-Type | Remaining]) :-
    type(Token, Type), !,
    token(Rest, Remaining).
token([Token | Rest], [Token-identificador | Remaining]) :-
    identifier(Token),
    token(Rest, Remaining).

atoms([], []).
atoms([32 | Rest], Atoms) :- !, atoms(Rest, Atoms).
atoms([9  | Rest], Atoms) :- !, atoms(Rest, Atoms).
atoms([10 | Rest], Atoms) :- !, atoms(Rest, Atoms).
atoms([13 | Rest], Atoms) :- !, atoms(Rest, Atoms).

atoms([34 | RestCodes], [Atom | RestAtoms]) :-
    !,
    buildString(RestCodes, StringCodes, RemainingCodes),
    atom_codes(Atom, [34 | StringCodes]),
    atoms(RemainingCodes, RestAtoms).

atoms([38,  38  | Rest], ['&&' | R]) :- !, atoms(Rest, R).
atoms([124, 124 | Rest], ['||' | R]) :- !, atoms(Rest, R).
atoms([61,  61  | Rest], ['==' | R]) :- !, atoms(Rest, R).
atoms([33,  61  | Rest], ['!=' | R]) :- !, atoms(Rest, R).
atoms([60,  61  | Rest], ['<=' | R]) :- !, atoms(Rest, R).
atoms([62,  61  | Rest], ['>=' | R]) :- !, atoms(Rest, R).
atoms([62,  62  | Rest], ['>>' | R]) :- !, atoms(Rest, R).
atoms([60,  60  | Rest], ['<<' | R]) :- !, atoms(Rest, R).
atoms([43,  43  | Rest], ['++' | R]) :- !, atoms(Rest, R).
atoms([45,  45  | Rest], ['--' | R]) :- !, atoms(Rest, R).

atoms([40  | Rest], ['(' | R]) :- !, atoms(Rest, R).
atoms([41  | Rest], [')' | R]) :- !, atoms(Rest, R).
atoms([123 | Rest], ['{' | R]) :- !, atoms(Rest, R).
atoms([125 | Rest], ['}' | R]) :- !, atoms(Rest, R).
atoms([91  | Rest], ['[' | R]) :- !, atoms(Rest, R).
atoms([93  | Rest], [']' | R]) :- !, atoms(Rest, R).
atoms([59  | Rest], [';' | R]) :- !, atoms(Rest, R).
atoms([44  | Rest], [',' | R]) :- !, atoms(Rest, R).
atoms([43  | Rest], ['+' | R]) :- !, atoms(Rest, R).
atoms([45  | Rest], ['-' | R]) :- !, atoms(Rest, R).
atoms([42  | Rest], ['*' | R]) :- !, atoms(Rest, R).
atoms([47  | Rest], ['/' | R]) :- !, atoms(Rest, R).
atoms([37  | Rest], ['%' | R]) :- !, atoms(Rest, R).
atoms([33  | Rest], ['!' | R]) :- !, atoms(Rest, R).
atoms([61  | Rest], ['=' | R]) :- !, atoms(Rest, R).
atoms([60  | Rest], ['<' | R]) :- !, atoms(Rest, R).
atoms([62  | Rest], ['>' | R]) :- !, atoms(Rest, R).

atoms(Codes, RestAtoms) :-
    build(Codes, WordCodes, RemainingCodes),
    WordCodes = [], !,
    atoms(RemainingCodes, RestAtoms).

atoms(Codes, [Atom | RestAtoms]) :-
    build(Codes, FloatCodes, RemainingCodes),
    number_codes(Atom, FloatCodes),
    float(Atom), !,
    atoms(RemainingCodes, RestAtoms).

atoms(Codes, [Atom | RestAtoms]) :-
    build(Codes, IntCodes, RemainingCodes),
    number_codes(Atom, IntCodes),
    integer(Atom), !,
    atoms(RemainingCodes, RestAtoms).

atoms(Codes, [Atom | RestAtoms]) :-
    build(Codes, WordCodes, RemainingCodes),
    atom_codes(Atom, WordCodes),
    atoms(RemainingCodes, RestAtoms).

buildString([34 | T], [34], T) :- !.
buildString([], [], []).
buildString([H | T], [H | Tail], Rem) :-
    buildString(T, Tail, Rem).

special_char(40).  special_char(41).  special_char(123). special_char(125).
special_char(91).  special_char(93).  special_char(59).  special_char(44).
special_char(38).  special_char(124). special_char(61).  special_char(33).
special_char(60).  special_char(62).  special_char(43).  special_char(45).
special_char(42).  special_char(47).  special_char(37).

build([32 | T], [], T) :- !.
build([9  | T], [], T) :- !.
build([10 | T], [], T) :- !.
build([13 | T], [], T) :- !.
build([], [], []).
build([H | T], [], [H | T]) :- special_char(H), !.
build([H | T], [H | Tail], Rem) :- build(T, Tail, Rem).
`;
