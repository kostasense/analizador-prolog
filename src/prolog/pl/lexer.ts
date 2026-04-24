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

%!  identifier(+Atom)
%   true when Atom is a valid identifier:
%   starts with a letter or underscore, rest are letters, digits, or underscores.
identifier(Atom):-
    atom_codes(Atom, [First | Rest]),
    identifierStart(First),
    maplist(identifierContent, Rest).

identifierStart(Code):- code_type(Code, alpha).   % a-z, A-Z
identifierStart(95).                              % underscore _

identifierContent(Code):- code_type(Code, alnum). % a-z, A-Z, 0-9
identifierContent(95).  

%!  tokenize(+String, -Tokens)
%   convert a string into a list of tokens.
tokenize(String, Tokens):-
    atom_codes(String, Codes),
    atoms(Codes, Tokens).

%!  token(+Tokens, -Token-Type) 
token([], []).

token([Token | Rest], [Token-Type | Remaining]):-
    type(Token, Type), !,
    token(Rest, Remaining).

token([Token | Rest], [Token-identificador | Remaining]):-
    identifier(Token),
    token(Rest, Remaining).

token([Token | Rest], [Token-error | Remaining]):-
    token(Rest, Remaining).


%!  atoms(+CharacterCodes, -Atoms)
atoms([], []).

%   skip whitespace (space, tab, newline, carriage-return)
atoms([32 | Rest], Atoms):- !, atoms(Rest, Atoms).   % space
atoms([9  | Rest], Atoms):- !, atoms(Rest, Atoms).   % \t
atoms([10 | Rest], Atoms):- !, atoms(Rest, Atoms).   % \n
atoms([13 | Rest], Atoms):- !, atoms(Rest, Atoms).   % \r

%   string literals
atoms([34 | RestCodes], [Atom | RestAtoms]):-
    !,
    buildString(RestCodes, StringCodes, RemainingCodes),
    atom_codes(Atom, [34 | StringCodes]),
    atoms(RemainingCodes, RestAtoms).

%   two-character operators
atoms([38,  38  | Rest], ['&&' | RestAtoms]):- !, atoms(Rest, RestAtoms).
atoms([124, 124 | Rest], ['||' | RestAtoms]):- !, atoms(Rest, RestAtoms).
atoms([61,  61  | Rest], ['==' | RestAtoms]):- !, atoms(Rest, RestAtoms).
atoms([33,  61  | Rest], ['!=' | RestAtoms]):- !, atoms(Rest, RestAtoms).
atoms([60,  61  | Rest], ['<=' | RestAtoms]):- !, atoms(Rest, RestAtoms).
atoms([62,  61  | Rest], ['>=' | RestAtoms]):- !, atoms(Rest, RestAtoms).
atoms([62,  62  | Rest], ['>>' | RestAtoms]):- !, atoms(Rest, RestAtoms).
atoms([60,  60  | Rest], ['<<' | RestAtoms]):- !, atoms(Rest, RestAtoms).
atoms([43,  43  | Rest], ['++' | RestAtoms]):- !, atoms(Rest, RestAtoms).
atoms([45,  45  | Rest], ['--' | RestAtoms]):- !, atoms(Rest, RestAtoms).

%   single-character operators and punctuation
atoms([38  | Rest], ['&' | RestAtoms]):- !, atoms(Rest, RestAtoms).
atoms([124 | Rest], ['|' | RestAtoms]):- !, atoms(Rest, RestAtoms).
atoms([40  | Rest], ['(' | RestAtoms]):- !, atoms(Rest, RestAtoms).   % (
atoms([41  | Rest], [')' | RestAtoms]):- !, atoms(Rest, RestAtoms).   % )
atoms([123 | Rest], ['{' | RestAtoms]):- !, atoms(Rest, RestAtoms).   % {
atoms([125 | Rest], ['}' | RestAtoms]):- !, atoms(Rest, RestAtoms).   % }
atoms([91  | Rest], ['[' | RestAtoms]):- !, atoms(Rest, RestAtoms).   % [
atoms([93  | Rest], [']' | RestAtoms]):- !, atoms(Rest, RestAtoms).   % ]
atoms([59  | Rest], [';' | RestAtoms]):- !, atoms(Rest, RestAtoms).   % ;
atoms([44  | Rest], [',' | RestAtoms]):- !, atoms(Rest, RestAtoms).   % ,
atoms([43  | Rest], ['+' | RestAtoms]):- !, atoms(Rest, RestAtoms).   % +
atoms([45  | Rest], ['-' | RestAtoms]):- !, atoms(Rest, RestAtoms).   % -
atoms([42  | Rest], ['*' | RestAtoms]):- !, atoms(Rest, RestAtoms).   % *
atoms([47  | Rest], ['/' | RestAtoms]):- !, atoms(Rest, RestAtoms).   % /
atoms([37  | Rest], ['%' | RestAtoms]):- !, atoms(Rest, RestAtoms).   % %
atoms([33  | Rest], ['!' | RestAtoms]):- !, atoms(Rest, RestAtoms).   % !
atoms([61  | Rest], ['=' | RestAtoms]):- !, atoms(Rest, RestAtoms).   % =
atoms([60  | Rest], ['<' | RestAtoms]):- !, atoms(Rest, RestAtoms).   % <
atoms([62  | Rest], ['>' | RestAtoms]):- !, atoms(Rest, RestAtoms).   % >

%   skip empty word
atoms(Codes, RestAtoms):-
    build(Codes, WordCodes, RemainingCodes),
    WordCodes = [],
    !,
    atoms(RemainingCodes, RestAtoms).

%   float literal
atoms(Codes, [Atom | RestAtoms]):-
    build(Codes, FloatCodes, RemainingCodes),
    phrase(build_float(Atom), FloatCodes),
    !,
    atoms(RemainingCodes, RestAtoms).

%   integer literal
atoms(Codes, [Atom | RestAtoms]):-
    build(Codes, IntegerCodes, RemainingCodes),
    phrase(build_integer(Atom), IntegerCodes),
    !,
    atoms(RemainingCodes, RestAtoms).

%   generic word
atoms(Codes, [Atom | RestAtoms]):-
    build(Codes, WordCodes, RemainingCodes),
    atom_codes(Atom, WordCodes),
    atoms(RemainingCodes, RestAtoms).

%!  buildString(+InputCodes, -WordCodes, -Remainder)
%   collect codes inside a string literal until the closing quotes
buildString([34 | T], [34], T):- !.
buildString([], [], []).
buildString([H | T], [H | WordTail], Remainder):-
    buildString(T, WordTail, Remainder).

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

%!  build(+InputCodes, -WordCodes, -Remainder)
%   collect alphanumeric/underscore codes into a word.
%   stops at whitespace (consuming it) or a special char (leaving it).
build([32 | T], [], T):- !.    % space      
build([9  | T], [], T):- !.    % tab        
build([10 | T], [], T):- !.    % newline    
build([13 | T], [], T):- !.    % CR         
build([], [], []).
build([H | T], [], [H | T]):-  % special char
    special_char(H), !.
build([H | T], [H | WordTail], Remainder):-
    build(T, WordTail, Remainder).


%   dcg rules for numbers
build_integer(I) -->
        digit_(D0),
        digits_(D),
        { number_codes(I, [D0|D])
        }.

build_float(F) --> 
    digits_(D0), 
    [0'.], 
    digits_(D1), 
    { D0 \\= [], 
    D1 \\= [],
    append(D0, [0'.|D1], Codes), 
    number_codes(F, Codes) 
    }.

digits_([D|T]) -->
        digit_(D), !,
        digits_(T).
digits_([]) -->
        [].

digit_(D) -->
        [D],
        { code_type(D, digit)
        }.
`;
