use crate::chunk::*;
use crate::common::*;
use crate::value::*;

pub fn disassemble_chunk(chunk: &Chunk, name: &str) {
    println!("== {} ==", name);

    let table = op_code_table();

    let mut offset = 0;

    while offset < chunk.code.len() {
        offset = disassemble_instruction(chunk, &mut offset, &table);
    }

    println!("==={}===", "=".repeat(name.len()));
}

pub fn disassemble_instruction(chunk: &Chunk, offset: &mut usize, table: &OpCodeTable) -> usize {
    let padding = chunk
        .lines
        .iter()
        .map(|l| l.to_string().len())
        .max()
        .unwrap();

    if *offset > 0 && chunk.lines[*offset] == chunk.lines[*offset - 1] {
        print!(
            "{}  | ",
            " ".repeat(padding - chunk.lines[*offset].to_string().len())
        );
    } else {
        print!(
            "{}{} | ",
            chunk.lines[*offset],
            " ".repeat(padding - chunk.lines[*offset].to_string().len())
        );
    }

    print!("{:04} ", offset);

    let instruction = u8_to_opcode(chunk.code[*offset]).expect("Cannot convert u8 to OpCode.");

    match instruction {
        OpCode::OpReturn => {
            return simple_instruction("OP_RETURN", offset, table);
        }
        OpCode::OpNegate => {
            return simple_instruction("OP_NEGATE", offset, table);
        }
        OpCode::OpAdd => {
            return simple_instruction("OP_ADD", offset, table);
        }
        OpCode::OpSubtract => {
            return simple_instruction("OP_SUBTRACT", offset, table);
        }
        OpCode::OpMultiply => {
            return simple_instruction("OP_MULTIPLY", offset, table);
        }
        OpCode::OpDivide => {
            return simple_instruction("OP_DIVIDE", offset, table);
        }
        OpCode::OpConstant => {
            return constant_instruction("OP_CONSTANT", chunk, offset, table);
        }
        _ => {
            println!("Unknown opcode {:?}", instruction);
            return *offset + 1;
        }
    }
}

fn simple_instruction(name: &str, offset: &usize, table: &OpCodeTable) -> usize {
    println!("{}", name);

    return *offset + 1;
}

fn constant_instruction(name: &str, chunk: &Chunk, offset: &usize, table: &OpCodeTable) -> usize {
    let constant = &chunk.code[*offset + 1];

    print!("{:<16} {} '", name, constant);

    print_value(chunk.constants.values[*constant as usize]);

    println!("'");

    return *offset + 2;
}
