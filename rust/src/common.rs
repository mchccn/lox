use std::collections::HashMap;

#[derive(Debug, PartialEq, Eq, Hash)]
pub enum OpCode {
    OpReturn,
    OpConstant,
}

pub type OpCodeTable = HashMap<OpCode, usize>;
