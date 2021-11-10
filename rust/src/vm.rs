use crate::chunk::*;
use crate::common::*;
use crate::compiler::*;
use crate::debug::*;
use crate::value::*;

pub trait Interpreter {
    fn interpret(&mut self, source: String, disassemble: bool) -> InterpretResult;
    fn run(&mut self, disassemble: bool) -> InterpretResult;
}

pub struct VirtualMachine {
    chunk: Chunk,
    ip: usize,
    stack: Vec<Value>,
}

impl Interpreter for VirtualMachine {
    fn interpret(&mut self, source: String, disassemble: bool) -> InterpretResult {
        let chunk = init_chunk();

        let mut compiler = init_compiler(source);

        let result = compiler.compile(chunk);

        self.chunk = result.chunk;
        self.ip = 0;

        let result = self.run(disassemble);

        return result;
    }

    fn run(&mut self, disassemble: bool) -> InterpretResult {
        let table = op_code_table();

        loop {
            let instruction =
                u8_to_opcode(self.chunk.code[self.ip]).expect("Cannot convert u8 to OpCode.");

            if disassemble {
                disassemble_instruction(&self.chunk, &mut self.ip, &table);
            }

            match instruction {
                OpCode::OpConstant => {
                    let constant =
                        self.chunk.constants.values[self.chunk.code[self.ip + 1] as usize];

                    self.stack.push(constant);

                    self.ip += 1;
                }
                OpCode::OpNegate => {
                    if self.stack.len() < 1 {
                        return InterpretResult::InterpretRuntimeError;
                    }

                    let value = -self.stack.pop().unwrap();

                    self.stack.push(value);
                }
                OpCode::OpAdd => {
                    if self.stack.len() < 2 {
                        return InterpretResult::InterpretRuntimeError;
                    }

                    let right = self.stack.pop().unwrap();
                    let left = self.stack.pop().unwrap();

                    self.stack.push(left + right);
                }
                OpCode::OpSubtract => {
                    if self.stack.len() < 2 {
                        return InterpretResult::InterpretRuntimeError;
                    }

                    let right = self.stack.pop().unwrap();
                    let left = self.stack.pop().unwrap();

                    self.stack.push(left - right);
                }
                OpCode::OpMultiply => {
                    if self.stack.len() < 2 {
                        return InterpretResult::InterpretRuntimeError;
                    }

                    let right = self.stack.pop().unwrap();
                    let left = self.stack.pop().unwrap();

                    self.stack.push(left * right);
                }
                OpCode::OpDivide => {
                    if self.stack.len() < 2 {
                        return InterpretResult::InterpretRuntimeError;
                    }

                    let right = self.stack.pop().unwrap();
                    let left = self.stack.pop().unwrap();

                    self.stack.push(left / right);
                }
                OpCode::OpReturn => {
                    print_value(self.stack.pop().unwrap_or(0.0));

                    println!();

                    return InterpretResult::InterpretOk;
                }
                _ => {
                    println!("{:?}", instruction);
                }
            }

            self.ip += 1;
        }
    }
}

pub fn init_vm() -> VirtualMachine {
    VirtualMachine {
        chunk: init_chunk(),
        ip: 0,
        stack: vec![],
    }
}
