use crate::chunk::*;
use crate::common::*;
use crate::debug::*;
use crate::value::*;

pub trait Interpreter {
    fn interpret(self, disassemble: bool) -> InterpretResult;
}

pub struct VirtualMachine {
    chunk: Chunk,
    ip: usize,
    stack: Vec<Value>,
}

impl Interpreter for VirtualMachine {
    fn interpret(mut self, disassemble: bool) -> InterpretResult {
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

pub fn init_vm(chunk: Chunk) -> VirtualMachine {
    VirtualMachine {
        chunk,
        ip: 0,
        stack: vec![],
    }
}
