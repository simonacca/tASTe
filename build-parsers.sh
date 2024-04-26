#!/usr/bin/env bash

set -euo pipefail

declare -A parsers

parsers[bash]="tree-sitter-bash" 
parsers[c]="tree-sitter-c" 
parsers[csharp]="tree-sitter-c-sharp" 
parsers[lisp]="tree-sitter-commonlisp" 
parsers[cpp]="tree-sitter-cpp" 
parsers[capnp]="tree-sitter-capnp" 
parsers[clojure]="tree-sitter-clojure" 
parsers[csv]="tree-sitter-csv/csv"
parsers[css]="tree-sitter-css" 
parsers[dart]="tree-sitter-dart" 
parsers[dockerfile]="tree-sitter-dockerfile" 
parsers[dot]="tree-sitter-dot" 
parsers[elixir]="tree-sitter-elixir" 
parsers[erlang]="tree-sitter-erlang" 
parsers[fish]="tree-sitter-fish" 
parsers[go]="tree-sitter-go" 
parsers[graphql]="tree-sitter-graphql" 
parsers[hack]="tree-sitter-hacklang" 
parsers[haskell]="tree-sitter-haskell" 
parsers[hcl]="tree-sitter-hcl" 
parsers[html]="tree-sitter-html" 
parsers[java]="tree-sitter-java" 
parsers[javascript]="tree-sitter-javascript" 
parsers[json]="tree-sitter-json" 
parsers[julia]="tree-sitter-julia" 
parsers[kotlin]="tree-sitter-kotlin" 
parsers[lua]="tree-sitter-lua" 
parsers[markdown]="'@tree-sitter-grammars/tree-sitter-markdown/tree-sitter-markdown'" 
parsers[makefile]="tree-sitter-make" 
parsers[matlab]="tree-sitter-matlab" 
parsers[nix]="tree-sitter-nix" 
parsers[objective-c]="tree-sitter-objc" 
parsers[php]="tree-sitter-php/php"
parsers[python]="tree-sitter-python" 
parsers[qml]="tree-sitter-qmljs" 
parsers[r]="tree-sitter-r" 
parsers[racket]="tree-sitter-racket" 
parsers[rust]="tree-sitter-rust" 
parsers[ruby]="tree-sitter-ruby" 
parsers[scala]="tree-sitter-scala" 
parsers[scheme]="tree-sitter-scheme" 
parsers[scss]="tree-sitter-scss" 
parsers[sql]="tree-sitter-sql" 
parsers[swift]="tree-sitter-swift" 
parsers[toml]="tree-sitter-toml" 
parsers[tsv]="tree-sitter-csv/tsv"
parsers[typescript]="tree-sitter-typescript/typescript" 
parsers[typescriptreact]="tree-sitter-typescript/tsx" 
parsers[xml]="@tree-sitter-grammars/tree-sitter-xml/xml"
parsers[yaml]="@tree-sitter-grammars/tree-sitter-yaml" 
parsers[zig]="tree-sitter-zig" 

# -----------------------------------------------------------------------------

# the dockerfile parser is built with docker and requires linux/amd64
export DOCKER_DEFAULT_PLATFORM=linux/amd64
DEST_DIR="out/parsers"

# -----------------------------------------------------------------------------

mkdir -p "$DEST_DIR"

function build_parser(){
    languageID="$1"
    grammarPath="${parsers[$languageID]}"
    echo "Building $languageID"
    if [ -n "${BUILDERS_COUNT:-}" ];
    then 
        parallel --semaphore \
        -j "$BUILDERS_COUNT" \
        --id builder \
        npx tree-sitter build \
            --wasm "node_modules/$grammarPath" \
            --output "$DEST_DIR/$languageID.wasm"
    else 
        npx tree-sitter build \
            --wasm "node_modules/$grammarPath" \
            --output "$DEST_DIR/$languageID.wasm"
    fi
}

function build_all(){
    for languageID in "${!parsers[@]}"
    do
        build_parser "$languageID"
    done
}

if [ -n "${1:-}" ];
    then
        build_parser "$1"
    else
        build_all
    fi


echo "Done building parsers"
rm -f a.out.js a.out.wasm

