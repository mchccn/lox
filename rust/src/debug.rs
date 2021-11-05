use crate::chunk;
use crate::common;

pub fn disassemble_chunk(chunk: &chunk::Chunk, name: &str) {
    println!("== {} ==", name);

    let mut offset = 0;

    while offset < chunk.code.len() {
        offset = disassemble_instruction(chunk, &mut offset);
    }
}

pub fn disassemble_instruction(chunk: &chunk::Chunk, offset: &mut usize) -> usize {
    print!("{:04} ", offset);

    let instruction = &chunk.code[*offset];

    match instruction {
        common::OpCode::OpReturn => {
            return simple_instruction("OP_RETURN", offset)
        }
        _ => {
            println!("Unknown opcode {:?}", instruction);
            return *offset + 1;
        }
    }
}

fn simple_instruction(name: &str, offset: &usize) -> usize {
    println!("{}", name);

    return *offset + 1;
}