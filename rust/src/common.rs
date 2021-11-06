use std::collections::HashMap;

#[derive(Debug, PartialEq, Eq, Hash)]
pub enum OpCode {
    OpReturn,
    OpNegate,
    OpAdd,
    OpSubtract,
    OpMultiply,
    OpDivide,
    OpConstant,
}

pub type OpCodeTable = HashMap<OpCode, u8>;

pub enum InterpretResult {
    InterpretOk,
    InterpretCompilerError,
    InterpretRuntimeError,
}

pub fn op_code_table() -> OpCodeTable {
    let mut table = OpCodeTable::new();

    table.insert(OpCode::OpReturn, 0);
    table.insert(OpCode::OpNegate, 1);
    table.insert(OpCode::OpAdd, 2);
    table.insert(OpCode::OpSubtract, 3);
    table.insert(OpCode::OpMultiply, 4);
    table.insert(OpCode::OpDivide, 5);
    table.insert(OpCode::OpConstant, 6);

    return table;
}

pub fn u8_to_opcode(i: u8) -> Option<OpCode> {
    let table = op_code_table();

    for (opcode, value) in table {
        if value == i as u8 {
            return Some(opcode);
        }
    }

    return None;
}

pub fn opcode_to_u8(opcode: OpCode) -> u8 {
    let table = op_code_table();

    return table[&opcode];
}
