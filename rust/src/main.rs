mod chunk;
mod common;
mod debug;
mod value;
mod scanner;
mod compiler;
mod vm;

use chunk::*;
use common::*;
use debug::*;
use value::*;
use scanner::*;
use compiler::*;
use vm::*;

use std::fs::read_to_string;
use std::io::{self, BufRead, Write};

fn main() {
    let args = std::env::args().collect::<Vec<String>>();

    println!("{:?}", args);

    if args.len() == 1 {
        let stdin = io::stdin();
        
        print!("> ");

        let _ = io::stdout().flush();

        for line in stdin.lock().lines() {
            let mut vm = init_vm();

            vm.interpret(line.unwrap(), false);

            print!("> ");

            let _ = io::stdout().flush();
        }
    } else if args.len() == 2 {
        let file_name = &args[1];

        let file_contents = read_to_string(file_name).expect(&format!("Could not open file \"{}\".", file_name));

        println!("{}", file_contents);

        let mut vm = init_vm();

        let result = vm.interpret(file_contents, false);

        match result {
            InterpretResult::InterpretCompilerError => {
                std::process::exit(65);
            }
            InterpretResult::InterpretRuntimeError => {
                std::process::exit(70);
            }
            _ => {
                std::process::exit(0);
            }
        }
    } else {
        println!("Usage: rlox [path]");
        std::process::exit(64);
    }
}
