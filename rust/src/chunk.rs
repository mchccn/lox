use crate::common::*;
use crate::value::*;

#[derive(Clone)]
pub struct Chunk {
    pub code: Vec<u8>,
    pub lines: Vec<i32>,
    pub constants: ValueArray,
}

pub fn copy_chunk(chunk: &Chunk) -> Chunk {
    Chunk {
        code: chunk.code.clone(),
        lines: chunk.lines.clone(),
        constants: chunk.constants.clone(),
    }
}

pub fn init_chunk() -> Chunk {
    Chunk {
        code: Vec::new(),
        lines: Vec::new(),
        constants: init_value_array(),
    }
}

pub fn write_chunk_opcode(chunk: &mut Chunk, op: OpCode, line: i32) {
    chunk.code.push(opcode_to_u8(op));
    chunk.lines.push(line);
}

pub fn write_chunk_u8(chunk: &mut Chunk, value: u8, line: i32) {
    chunk.code.push(value);
    chunk.lines.push(line);
}

pub fn add_constant(chunk: &mut Chunk, value: Value) -> u8 {
    write_value_array(&mut chunk.constants, value);

    return (chunk.constants.values.len() - 1) as u8;
}
