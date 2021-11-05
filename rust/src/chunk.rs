use crate::common;

pub struct Chunk {
    pub code: Vec<common::OpCode>,
}

pub fn init_chunk() -> Chunk {
    Chunk {
        code: Vec::new(),
    }
}

pub fn write_chunk(chunk: &mut Chunk, op: common::OpCode) {
    chunk.code.push(op);
}