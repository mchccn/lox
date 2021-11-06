mod value;
mod common;
mod chunk;
mod debug;
mod vm;

use value::*;
use common::*;
use chunk::*;
use debug::*;
use vm::*;

fn main() {
    let mut chunk = init_chunk();

    write_chunk(&mut chunk, OpCode::OpConstant, 1);
    
    add_constant(&mut chunk, 1.2);

    write_chunk(&mut chunk, OpCode::OpReturn, 2);

    println!("--- Disassembler ---");

    disassemble_chunk(&chunk, "Chunk");

    println!("--- Execution ---");

    let vm = init_vm(chunk);

    vm.interpret();
}