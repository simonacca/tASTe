# Change Log

All notable changes to the "taste" extension will be documented in this file.

## 1.0.21

- fix bug occurring when cursor is at EOF
- implement `taste.MoveCursorForwardToEndOfNode`
- implement `taste.MoveCursorForwardToBeginningOfNextNode`
- ensure consistent behavior between `MoveCursor*` and `GrowShrink`

## 1.0.18

- implement Slurp/Barf

## 1.0.17

- Remove languages that don't work
- Fix some incorrectly labeled languages
- Improve selection handling on cmd.Raise
- Fix issue where command would execute with undefined language
- Make ExpandSelection work when more than one node is selected
- Make search of first non whitespace character multiline-aware

## 1.0.16

- Make all commands that reach for parent node more robust
- Add XML language support

## 1.0.15

- Make expansion command more robust
- Add php language support

## 1.0.14

- Add csv language support
- Add yaml language support
- Add makefile language support
- Detect language based on file extension in some cases

## 1.0.13

- Improve move cursor forward command
- Allow for contraction of selection all the way to an empty selection

## 1.0.12

- Implement swap forward/backward commands
- Implement raise command

## 1.0.11

- Fix issue where the beginning or end of a sequence of nodes would be handled incorrectly

## 1.0.10

- Improve grow/shrink commands

## 1.0.9

- Rename commands

## 1.0.8

- Improve grow/shrink commands

## 1.0.7

- Implement grow/shrink commands
- Implement cursor move commands
- Add clojure language support

## 1.0.6

- Fix typescriptreact language

## 1.0.5

- Add graphql language support
- Add hack language support
- Add go-mod language support
- Improve error message when a language is not supported

## 1.0.4

- Add matlab language support
- Add objective-c language support
- Add r language support
- Add racket language support
- Add protobuf language support
- Add scheme language support
- Add zig language support

## 1.0.3

- Add dockerfile language support

## 1.0.1

- Add json language support

## 1.0.0

- Initial release
