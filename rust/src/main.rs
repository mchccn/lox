mod chunk;
mod common;
mod debug;
mod value;
mod vm;

use chunk::*;
use common::*;
use debug::*;
use value::*;
use vm::*;

fn main() {
    let mut chunk = init_chunk();

    write_chunk_opcode(&mut chunk, OpCode::OpConstant, 1);

    let constant = add_constant(&mut chunk, 1.2);

    write_chunk_u8(&mut chunk, constant, 1);

    write_chunk_opcode(&mut chunk, OpCode::OpConstant, 1);

    let constant = add_constant(&mut chunk, 3.4);

    write_chunk_u8(&mut chunk, constant, 1);

    write_chunk_opcode(&mut chunk, OpCode::OpAdd, 1);

    let constant = add_constant(&mut chunk, 5.6);

    write_chunk_opcode(&mut chunk, OpCode::OpConstant, 1);

    write_chunk_u8(&mut chunk, constant, 1);

    write_chunk_opcode(&mut chunk, OpCode::OpDivide, 1);

    write_chunk_opcode(&mut chunk, OpCode::OpNegate, 1);

    write_chunk_opcode(&mut chunk, OpCode::OpReturn, 2);

    println!("--- Disassembler ---");

    disassemble_chunk(&chunk, "Chunk");

    println!("--- Execution ---");

    let vm = init_vm(chunk);

    vm.interpret(true);
}
