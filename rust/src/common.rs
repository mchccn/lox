use std::collections::HashMap;

#[derive(Debug, PartialEq, Eq, Hash)]
pub enum OpCode {
    OpReturn,
    OpConstant,
}

pub type OpCodeTable = HashMap<OpCode, usize>;

pub enum InterpretResult {
    InterpretOk,
    InterpretCompilerError,
    InterpretRuntimeError,
}

pub fn op_code_table() -> OpCodeTable {
    let mut table = OpCodeTable::new();

    table.insert(OpCode::OpReturn, 0);
    table.insert(OpCode::OpConstant, 1);

    return table;
}