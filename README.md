# tASTe: The AST Editor

tASTe is a vscode extension to edit code based on its structure (the AST).

## Commands

### Expand and Contract Selection

- `taste.expandSelection`
- `taste.contractSelection`

![expand and contract selection](media/expand_contract_selection.gif)

### Select and Unselect Node Forward

- `taste.selectNodeForward`
- `taste.unselectNodeForward`

![expand and contract selection](media/select_node_forward.gif)

### Select Top Level

- `taste.selectTopLevel`

![select top level](media/select_top_level.gif)

## Supported languages

- Bash
- C
- C++
- C Sharp
- Common Lisp
- Cap'n Proto
- Cobol
- CSS
- Cuda
- Dart
- DOT
- Elixir
- Erlang
- Fish
- Go
- Go mod
- Graphql
- Hack
- Haskell
- HCL (Terraform)
- HTML
- Java
- Javascript
- JQ
- JSON
- Julia
- Kotlin
- Lua
- Markdown
- Matlab
- Nix
- Protobuf
- Python
- QML
- R
- Racket
- Rust
- Ruby
- Scala
- SCSS
- Scheme
- SQL
- Swift
- Toml
- Typescript
- Zig

## Dev HOWTOs

### Bringup development environment

1. Make sure you have installed the following:

- [typescript compiler](https://www.typescriptlang.org/download)
- [emscripten compiler](https://github.com/emscripten-core/emscripten)
- nodejs
- docker
- gnu parallel (optional)

2. `npm install`
3. `npm build-wasm`
4. `npm run watch`
5. In the "Run and Debug" menu of vscode, Start debugging the "Run Extension" target

### Publish

1. Bump version number in `package.json`
2. `npm run clean`
3. `npm run build-wasm`
4. `npm run vscode:prepublish`
5. `npm run package`
6. `npm run publish`

### Rebuild parsers

1. `npm build-wasm`

### Configure a new language

1. Install the parser `npm i tree-sitter-mylanguage`
2. Add a line to the `build_wasm.sh` script to generate the grammar
3. List the language in `languageID2ParserName`
4. Add an entry to `excludeNodeTypes` corresponding to the language

### A language is installed and built but not recognized

Add an entry in `src/languages.ts` -> `languageIDTranslation` mapping the vscode `languageID` to the wasm name (see `build-wasm.sh` -> `build_parser <node_module_name> <wasm_name>`).
