mod common;
mod chunk;
mod debug;

fn main() {
    let mut chunk = chunk::init_chunk();

    chunk::write_chunk(&mut chunk, common::OpCode::OpReturn);

    debug::disassemble_chunk(&chunk, "Chunk");
}