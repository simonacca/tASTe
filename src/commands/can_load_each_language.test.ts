import Cmds from "./selection"
import * as TUtils from "../utils/test"

// These tests are solely meant to validate
// that we can call into each language's parser correctly,
// therefore they are as simple as possible.
// They are not meant to validate the precise details of each parser's
// behavior. See other tests for that.

const cases: TUtils.SelectionChangeTest[] = [
  {
    cmd: Cmds.SelectTopLevel,
    languageId: "bash",
    text: `
    🫸🏻echo "Hell👉🏻👈🏻o World"🫷🏻


    echo "hi
        
    `,
  },
  {
    cmd: Cmds.SelectTopLevel,
    languageId: "c",
    text: `
    //Hello World in C
    #include <stdio.h>
    🫸🏻int main() {
       printf(👉🏻👈🏻"Hello, World!");
       return 0;
    }🫷🏻
    
    `,
  },
  {
    cmd: Cmds.SelectTopLevel,
    languageId: "csharp",
    text: `
    using System;
    using System.IO;
    🫸🏻class Program
    {
        static void Main()
        {
            // path of the file that we want to create
            string p👉🏻👈🏻athName = @"C:\Program\myFile.txt";
    
    
        }
    }🫷🏻
        
     `,
  },
  {
    cmd: Cmds.SelectTopLevel,
    languageId: "lisp",
    text: `
    🫸🏻(print "Hello 👉🏻👈🏻World")🫷🏻

    (print "Hello World")
    `,
  },
  {
    cmd: Cmds.SelectTopLevel,
    languageId: "cpp",
    text: `
    #include <iostream>

    🫸🏻int main() {
        std::cou👉🏻👈🏻t << "Hello, World!" << std::endl;
        return 0;
    }🫷🏻
    
    `,
  },
  {
    cmd: Cmds.SelectTopLevel,
    languageId: "capnp",
    text: `
    🫸🏻struct Person {
      id @0 :UInt32;
      name @1 :👉🏻👈🏻Text;
      email @2 :Text;
      phones @3 :List(PhoneNumber);
    }🫷🏻
    
    struct AddressBook {
      people @0 :List(Person);
    }
    `,
  },
  {
    cmd: Cmds.SelectTopLevel,
    languageId: "clojure",
    text: `
    (ns clojure.examples.hello
      (:gen-class))
      🫸🏻(defn hello-world []
      (println👉🏻👈🏻 "Hello World"))🫷🏻
   (hello-world)  
    `,
  },
  {
    cmd: Cmds.SelectTopLevel,
    languageId: "csv",
    text: `
    a,b,c
    🫸🏻1,2👉🏻👈🏻,3🫷🏻
    a,asd,234,a
    `,
  },
  {
    cmd: Cmds.SelectTopLevel,
    languageId: "css",
    text: `
    /* Printing Hello World in CSS */
    🫸🏻.hello-world:before {
        content: "He👉🏻👈🏻llo World";
    }🫷🏻
    
    html {
        display: block;
    }
    
    `,
  },
  {
    cmd: Cmds.ExpandSelection,
    languageId: "dart",
    text: `
    var name = 'Voyager I';
    var year = 1977;
    var antennaDiameter = 3.7;
    var flybyObjects = ['Jupiter', 'Saturn', 'Uranus', 'Neptune'];
    var image = {
      'tags': ['saturn'],
      'url': 🫸🏻'//path/to/saturn👉🏻👈🏻.jpg'🫷🏻
    };
    `,
  },
  {
    cmd: Cmds.SelectTopLevel,
    languageId: "dockerfile",
    text: `
    FROM node:lts-bookworm-slim AS build

    WORKDIR /build
    
    🫸🏻RUN apt-get update && apt-get install -y \
        emscripten \
        make \
        gcc \
        g👉🏻👈🏻++ \
        parallel \
        python3🫷🏻
    
    
    COPY package.json package-lock.json /build/
    RUN npm install
    
    `,
  },
  {
    cmd: Cmds.SelectTopLevel,
    languageId: "dot",
    text: `
    digraph 🫸🏻{
      a -> b[label="0.2",weigh👉🏻👈🏻t="0.2"];
      a -> c[label="0.4",weight="0.4"];
  }🫷🏻

a
    `,
  },
  {
    cmd: Cmds.SelectTopLevel,
    languageId: "elixir",
    text: `
    🫸🏻defprotocol Double do
    👉🏻👈🏻
    def double(input)
  
  end🫷🏻
  
  defimpl Double, for: Integer do
  
    def double(int) do
      int * 2
    end
  
  end
    `,
  },
  {
    cmd: Cmds.SelectTopLevel,
    languageId: "erlang",
    text: `
    
-module(greeting).

-export([say_hello/1]).

🫸🏻say_hello(Name) ->
  "Hello 👉🏻👈🏻" ++ Name ++ ".".🫷🏻

  say_hello("Tom") ->  "Howdy Tom.";
`,
  },
  {
    cmd: Cmds.SelectTopLevel,
    languageId: "fish",
    text: `
    #!/usr/bin/env fish
    🫸🏻echo "Hello👉🏻👈🏻 World"🫷🏻
    
    echo "Hi"
    `,
  },
  {
    cmd: Cmds.SelectTopLevel,
    languageId: "go",
    text: `
    🫸🏻func foo(x int){
      👉🏻👈🏻return x + 5
    }🫷🏻
    
    func main() {
      foo(
        3
      )
      }
    `,
  },
  {
    cmd: Cmds.SelectTopLevel,
    languageId: "graphql",
    text: `
    🫸🏻{
      hero {
        name👉🏻👈🏻
        # Queries can have comments!
        friends {
          name
        }
      }
    }🫷🏻

    z
    `,
  },
  {
    cmd: Cmds.ExpandSelection,
    languageId: "hack",
    text: `
    
    class ExampleAttributes implements 🫸🏻Exam👉🏻👈🏻pleInterface🫷🏻
    {
      public function __construct() {}
    
    }
    `,
  },
  {
    cmd: Cmds.SelectTopLevel,
    languageId: "haskell",
    text: `
    module Main where

    🫸🏻main :: I👉🏻👈🏻O ()🫷🏻
    main = putStrLn "Hello World"
    
    `,
  },
  {
    cmd: Cmds.ExpandSelection,
    languageId: "hcl",
    text: `
    locals {
      # The Google Cloud Project ID that will host and pay for your Minecraft server
      project = "larkworthy-tester"
      🫸🏻region  = 👉🏻"europe-west1"👈🏻🫷🏻
      zone    = "europe-west1-b"
    }
    `,
  },
  {
    cmd: Cmds.SelectTopLevel,
    languageId: "html",
    text: `
    <!DOCTYPE html>
  
    🫸🏻<head>
        <title>Hello World</titl👉🏻👈🏻e>
    
    </head>🫷🏻
    
    <body>
        <script>
            document.write("Hello World!");
        </script>
    </body>
    
    
    `,
  },
  {
    cmd: Cmds.ExpandSelection,
    languageId: "java",
    text: `
    class Hacktoberfest {
      public static void main(String[] args) {
          🫸🏻Sys👉🏻tem👈🏻🫷🏻.out.println("Hello, World!");
      }
  }
    `,
  },
  {
    cmd: Cmds.SelectTopLevel,
    languageId: "javascript",
    text: `
    console.log("hi")

    🫸🏻if (1 👉🏻👈🏻> 3){
        return 3
    }🫷🏻  
    
    if (44 > 2) {
        []
    }
    else {
        let a = 123 ;
        return [1,2,3]
    }
    `,
  },
  {
    cmd: Cmds.ExpandSelection,
    languageId: "json",
    text: `
    [1,2,{🫸🏻"a":👉🏻[4,5,6]👈🏻🫷🏻}]
    `,
  },
  {
    cmd: Cmds.ExpandSelection,
    languageId: "julia",
    text: `
    println(🫸🏻"Hello👉🏻👈🏻, World!"🫷🏻)
    `,
  },
  {
    cmd: Cmds.ExpandSelection,
    languageId: "kotlin",
    text: `
    fun main(args: Array<🫸🏻St👉🏻👈🏻ring🫷🏻>){
      println("Hello World")
  }
  
    `,
  },
  {
    cmd: Cmds.ExpandSelection,
    languageId: "lua",
    text: `print(🫸🏻fa👉🏻👈🏻ct🫷🏻(a))`,
  },
  {
    cmd: Cmds.ExpandSelection,
    languageId: "markdown",
    text: `
- qwe
- 🫸🏻asd f👉🏻👈🏻gh🫷🏻
- zxc
    `,
  },
  {
    cmd: Cmds.ExpandSelection,
    languageId: "matlab",
    text: `
    disp(🫸🏻'Hello Wo👉🏻👈🏻rld'🫷🏻);

    `,
  },
  {
    cmd: Cmds.ExpandSelection,
    languageId: "nix",
    text: `
    pkgs.writeText "hello-world.nix" ''🫸🏻
    bui👉🏻👈🏻ltins.trace "Hello, World!" ""
  🫷🏻''
    `,
  },
  {
    cmd: Cmds.ExpandSelection,
    languageId: "objective-c",
    text: `
    @interface Box:NSObject {
      //Instance variables
      double length;    // Length of a box
      double breadth;   // Breadth of a box
   }
   @property🫸🏻(👉🏻nonatomic👈🏻, readwrite)🫷🏻 double height;  // Property
   
   @end
    `,
  },
  {
    cmd: Cmds.ExpandSelection,
    languageId: "php",
    text: `
    <?php 🫸🏻echo 👉🏻'Hello, World!'👈🏻;🫷🏻 ?>
    `,
  },
  {
    cmd: Cmds.ExpandSelection,
    languageId: "python",
    text: `
    custom_message = "Hello World!"
    print(🫸🏻f"👉🏻{custom_message}👈🏻"🫷🏻)
        
    `,
  },
  {
    cmd: Cmds.ExpandSelection,
    languageId: "qml",
    text: `
    import QtQuick 2.7
    import 🫸🏻👉🏻QtQuick👈🏻.Layouts🫷🏻 1.1
    import QtQuick.Controls 2.1
    import QtQuick.Controls.Material 2.1
    import QtGraphicalEffects 1.0
    `,
  },
  {
    cmd: Cmds.ExpandSelection,
    languageId: "r",
    text: `
    cat(🫸🏻'Hello Worl👉🏻👈🏻d'🫷🏻)
    `,
  },
  {
    cmd: Cmds.ExpandSelection,
    languageId: "racket",
    text: `
    #lang br
    🫸🏻(define x 👉🏻"Hello, World!"👈🏻)🫷🏻
    x
    `,
  },
  {
    cmd: Cmds.ExpandSelection,
    languageId: "rust",
    text: `
    fn add2(x: i32, 🫸🏻y: 👉🏻i32👈🏻🫷🏻) -> i32 {
      // Implicit return (no semicolon)
      x + y
  }
    `,
  },
  {
    cmd: Cmds.ExpandSelection,
    languageId: "ruby",
    text: `
    puts '🫸🏻He👉🏻👈🏻llo World🫷🏻'
    `,
  },
  {
    cmd: Cmds.ExpandSelection,
    languageId: "scala",
    text: `
    object HelloWorld extends App {
      printIn🫸🏻(👉🏻"Hello World"👈🏻)🫷🏻 
  }  
    `,
  },
  {
    cmd: Cmds.ExpandSelection,
    languageId: "scheme",
    text: `
    (show '(across the universe) file1)
    (show-line '🫸🏻(penny 👉🏻lane👈🏻)🫷🏻 file2)
    (read file3)
    `,
  },
  {
    cmd: Cmds.ExpandSelection,
    languageId: "scss",
    text: `
    $font-stack: Helvetica, sans-serif;
    $primary-color: #333;
    
    body {
      🫸🏻font: 100% 👉🏻$font-stack👈🏻;🫷🏻
      color: $primary-color;
    }
    `,
  },
  {
    cmd: Cmds.ExpandSelection,
    languageId: "sql",
    text: `
    CREATE TABLE HelloWorld (
      Message VARCHAR(255)
  );
  
  INSERT INTO HelloWorld (🫸🏻Mess👉🏻👈🏻age🫷🏻)
  VALUES ('Hello, World!');
  
  SELECT Message FROM HelloWorld;
  
    `,
  },
  {
    cmd: Cmds.ExpandSelection,
    languageId: "swift",
    text: `
    println(🫸🏻'Hello W👉🏻👈🏻orld'🫷🏻);

    `,
  },
  {
    cmd: Cmds.ExpandSelection,
    languageId: "toml",
    text: `
    [servers]

    [🫸🏻serve👉🏻👈🏻rs🫷🏻.alpha]
    ip = "10.0.0.1"
    role = "frontend"
    
    [servers.beta]
    ip = "10.0.0.2"
    role = "backend"
    `,
  },
  {
    cmd: Cmds.ExpandSelection,
    languageId: "typescript",
    text: `
    let message: 🫸🏻stri👉🏻👈🏻ng🫷🏻 = "Hello World!";
    console.log(message);
    
    `,
  },
  {
    cmd: Cmds.ExpandSelection,
    languageId: "typescriptreact",
    text: `
    const MyComponent = () => {
      const n = 123
    
      return (
        🫸🏻<div>
          👉🏻<span>{n}</span>👈🏻
        </div>🫷🏻
      )
    }
    `,
  },
  {
    cmd: Cmds.ExpandSelection,
    languageId: "xml",
    text: `
    <root>
    🫸🏻<greeting>👉🏻Hello, World!👈🏻</greeting>🫷🏻
  </root>
    `,
  },
  {
    cmd: Cmds.ExpandSelection,
    languageId: "yaml",
    text: `
    markup-languages:
    - yaml:
        name: "YAML Ain't Markup Language"
        born: 2001
    - xml:
        name: Extensible Markup Language
        🫸🏻born: 👉🏻1996👈🏻🫷🏻
    - json:
        name: JavaScript Object Notation
        born: 2001
  
    `,
  },
  {
    cmd: Cmds.ExpandSelection,
    languageId: "zig",
    text: `
    const std = @import("std");

    pub fn main() !void {
        const stdout = std.io.🫸🏻ge👉🏻👈🏻tStdOut🫷🏻().writer();
        try stdout.print("Hello, {s}\n", .{"world."});
    }
    
    `,
  },
]

describe("Languages", () => {
  test.concurrent.each(cases)("$languageId", TUtils.executeSelectionChangeTest)
})
