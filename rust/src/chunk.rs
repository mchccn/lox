use crate::common::*;
use crate::value::*;

pub struct Chunk {
    pub code: Vec<OpCode>,
    pub lines: Vec<i32>,
    pub constants: ValueArray,
}

pub fn init_chunk() -> Chunk {
    Chunk {
        code: Vec::new(),
        lines: Vec::new(),
        constants: init_value_array(),
    }
}

pub fn write_chunk(chunk: &mut Chunk, op: OpCode, line: i32) {
    chunk.code.push(op);
    chunk.lines.push(line);
}

pub fn add_constant(chunk: &mut Chunk, value: Value) -> usize {
    write_value_array(&mut chunk.constants, value);

    return chunk.constants.values.len() - 1;
}