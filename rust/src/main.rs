mod value;
mod common;
mod chunk;
mod debug;

use value::*;
use common::*;
use chunk::*;
use debug::*;

fn main() {
    let mut chunk = init_chunk();

    write_chunk(&mut chunk, OpCode::OpConstant, 1);
    
    add_constant(&mut chunk, 1.2);

    write_chunk(&mut chunk, OpCode::OpReturn, 2);

    disassemble_chunk(&chunk, "Chunk");
}