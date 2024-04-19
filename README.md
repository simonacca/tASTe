# TASTE: The AST Editor

Taste is a collection of commands to edit text based on its structure (the AST).


## Commands

### Expand and Contract Selection

- `taste.expandSelection`
- `taste.contractSelection`

![expand and contract selection](media/expand_contract_selection.gif)

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
- Nix
- Python
- QML
- Rust
- Ruby
- Scala
- SCSS
- SQL
- Swift
- Toml
- Typescript


## Dev HOWTOs

### Bringup development environment

1. `npm install`
2. `npm build-wasm`
3. `npm run watch`
4. In the "Run and Debug" menu of vscode, Start debugging the "Run Extension" target

### Publish

0. Bump version number in `package.json`
1. `npm run clean`
2. `npm run build-wasm`
3. `npm run vscode:prepublish`
4. `npm run package`
5. `npm run publish`

### Rebuild parsers

1. `npm build-wasm`

### Configure a new language

1. Install the parser `npm i tree-sitter-mylanguage`
2. Add a line to the `build_wasm.sh` script to generate the grammar
3. List the language in `languageID2ParserName`
4. Add an entry to `excludeNodeTypes` corresponding to the language


### A language is installed and built but not recognized

Add an entry in `src/languages.ts` -> `languageIDTranslation` mapping the vscode `languageID` to the wasm name (see `build-wasm.sh` -> `build_parser <node_module_name> <wasm_name>`).