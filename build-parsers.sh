#!/usr/bin/env bash

set -euo pipefail

DEST_DIR="out/parsers"

# rm -rf "$DEST_DIR"
mkdir -p "$DEST_DIR"

function build_parser(){
    echo "Building $2"
    if [ -n "${BUILDERS_COUNT:-}" ];
    then 
        parallel --semaphore -j "$BUILDERS_COUNT" --id builder npx tree-sitter build --wasm "node_modules/$1" --output "$DEST_DIR/$2.wasm"
    else 
       npx tree-sitter build --wasm "node_modules/$1" --output "$DEST_DIR/$2.wasm"
    fi
}

# the dockerfile parser is built with docker and requires linux/amd64
export DOCKER_DEFAULT_PLATFORM=linux/amd64


build_parser tree-sitter-bash bash
build_parser tree-sitter-c c
build_parser tree-sitter-c-sharp c-sharp
build_parser tree-sitter-commonlisp commonlisp
build_parser tree-sitter-cpp cpp
# build_parser tree-sitter-capnp capnp
# build_parser tree-sitter-clojure clojure
# build_parser tree-sitter-cobol cobol
# build_parser tree-sitter-css css
# build_parser tree-sitter-cuda cuda
# build_parser tree-sitter-dart dart
# build_parser tree-sitter-dockerfile dockerfile
# build_parser tree-sitter-dot dot
# build_parser tree-sitter-elixir elixir
# build_parser tree-sitter-erlang erlang
# build_parser tree-sitter-fish fish
# build_parser tree-sitter-go go
# build_parser tree-sitter-gomod go-mod
# build_parser tree-sitter-graphql graphql
# build_parser tree-sitter-hacklang hack
# build_parser tree-sitter-haskell haskell
# build_parser tree-sitter-hcl hcl
# build_parser tree-sitter-html html
# build_parser tree-sitter-java java
# build_parser tree-sitter-javascript javascript
# build_parser tree-sitter-jq jq
# build_parser tree-sitter-json json
# build_parser tree-sitter-julia julia
# build_parser tree-sitter-kotlin kotlin
# # build_parser tree-sitter-latex latex # 2024-04 (expects parser.h)
# build_parser tree-sitter-lua lua
# build_parser '@tree-sitter-grammars/tree-sitter-markdown/tree-sitter-markdown' markdown
# build_parser tree-sitter-matlab matlab
# # build_parser tree-sitter-nginx nginx # 2024-04 (Cannot find module 'nan')
# build_parser tree-sitter-nix nix
# build_parser tree-sitter-objc objc
# # build_parser tree-sitter-ocaml/grammars/ocaml ocaml # 2024-04 (can't find scanner.h)
# # build_parser tree-sitter-perl perl # 2024-04 (can't find grammar.json)
# # build_parser tree-sitter-pascal pascal # 2024-04 (can't find binding.o)
# # build_parser tree-sitter-php/php php # 2024-04 (can't find scanner.h)
# build_parser tree-sitter-proto proto
# build_parser tree-sitter-python python
# build_parser tree-sitter-qmljs qmljs
# build_parser tree-sitter-r r
# build_parser tree-sitter-racket racket
# build_parser tree-sitter-rust rust
# build_parser tree-sitter-ruby ruby
# build_parser tree-sitter-scala scala
# build_parser tree-sitter-scheme scheme
# build_parser tree-sitter-scss scss
# build_parser tree-sitter-sql sql
# build_parser tree-sitter-swift swift
# build_parser tree-sitter-toml toml
# build_parser tree-sitter-typescript/typescript typescript
# build_parser tree-sitter-typescript/tsx typescriptreact
# # build_parser tree-sitter-xml xml # 2024-04 (can't find scanner.h)
build_parser tree-sitter-zig zig
# build_parser tree-sitter-vue vue # 2024-04 (no member AcessorSignature in namespace v8)


echo "Done building parsers"
rm -f a.out.js a.out.wasm

