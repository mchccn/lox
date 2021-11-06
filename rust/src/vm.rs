use crate::common::*;
use crate::chunk::*;
use crate::value::*;
use crate::debug::*;

pub trait Interpreter {
    fn interpret(self) -> InterpretResult;
}

pub struct VirtualMachine {
    chunk: Chunk,
    ip: usize,
}

impl Interpreter for VirtualMachine {
    fn interpret(mut self) -> InterpretResult {
        let table = op_code_table();        

        loop {
            let instruction = &self.chunk.code[self.ip];

            disassemble_instruction(&self.chunk, &mut self.ip, &table);

            self.ip += 1;

            match instruction {
                OpCode::OpConstant => {
                    let constant = self.chunk.constants.values[table[&self.chunk.code[self.ip]]];

                    print_value(constant);

                    println!();

                    break;
                }
                OpCode::OpReturn => {
                    println!("return");
                    return InterpretResult::InterpretOk;
                }
                _ => {
                    println!("{:?}", instruction);
                }
            }
        }

        return InterpretResult::InterpretRuntimeError;
    }
}

pub fn init_vm(chunk: Chunk) -> VirtualMachine {
    VirtualMachine {
        chunk,
        ip: 0,
    }
}
