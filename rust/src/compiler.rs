use crate::common::*;
use crate::scanner::*;
use crate::value::*;
use crate::chunk::*;
use std::collections::HashMap;

#[derive(Debug, PartialEq, Eq, Hash)]
pub enum Precedence {
    PrecNone,
    PrecAssignment,
    PrecOr,
    PrecAnd,
    PrecEquality,
    PrecComparison,
    PrecTerm,
    PrecFactor,
    PrecUnary,
    PrecCall,
    PrecPrimary,
}

pub type PrecTable = HashMap<Precedence, u8>;

pub fn prec_table() -> PrecTable {
    let mut table = PrecTable::new();

    table.insert(Precedence::PrecNone, 0);
    table.insert(Precedence::PrecAssignment, 1);
    table.insert(Precedence::PrecOr, 2);
    table.insert(Precedence::PrecAnd, 3);
    table.insert(Precedence::PrecEquality, 4);
    table.insert(Precedence::PrecComparison, 5);
    table.insert(Precedence::PrecTerm, 6);
    table.insert(Precedence::PrecFactor, 7);
    table.insert(Precedence::PrecUnary, 8);
    table.insert(Precedence::PrecCall, 9);
    table.insert(Precedence::PrecPrimary, 10);

    return table;
}

pub fn precendence_to_order(prec: Precedence) -> u8 {
    let table = prec_table();

    return *table.get(&prec).unwrap();
}

pub fn order_to_precendence(order: u8) -> Precedence {
    let table = prec_table();

    for (prec, prec_order) in table.iter() {
        if *prec_order == order {
            return *prec;
        }
    }

    panic!("Invalid precedence order: {}", order);
}

pub struct ParseRule {
    // how to store the functions to parse tho...
    precendence: Precedence,
}

pub trait Parser {
    fn compile(&mut self, chunk: Chunk) -> CompilerResult;
    fn expression(&mut self);
    fn advance(&mut self);
    fn consume(&mut self, kind: TokenKind, message: &str);
    fn error_at_current(&mut self, message: String);
    fn error_at(&mut self, token: Token, message: String);
    fn emit_byte(&mut self, byte: u8);
    fn emit_bytes(&mut self, byte1: u8, byte2: u8);
    fn emit_return(&mut self);
    fn end_compiler(&mut self);
    fn current_chunk(&mut self) -> &mut Chunk;
    fn emit_constant(&mut self, value: Value);
    fn make_constant(&mut self, value: Value) -> u8;
    fn number(&mut self);
    fn binary(&mut self);
    fn unary(&mut self);
    fn grouping(&mut self);
    fn parse_precendence(&mut self, precendence: Precedence);
}

pub struct Compiler {
    had_error: bool,
    panic_mode: bool,
    source: String,
    chunk: Chunk,
    scanner: Scanner,
    previous: Token,
    current: Token,
}

pub struct CompilerResult {
    pub chunk: Chunk,
    pub success: bool,
}

impl Parser for Compiler {
    fn compile(&mut self, chunk: Chunk) -> CompilerResult {
        self.chunk = chunk;

        self.scanner.advance();

        self.expression();

        self.consume(TokenKind::Eof, "Expect end of expression.");

        self.end_compiler();

        // let mut line = 0;

        // loop {
        //     let token = self.scanner.next_token();

        //     if token.line != line {
        //         print!("{:04} | ", token.line);
        //         line = token.line;
        //     } else {
        //         print!("     | ");
        //     }

        //     println!("{:<12} {:>4} '{}'", format!("{:?}", token.kind), token.start, self.source[token.start .. token.start + token.length].to_string());

        //     match token.kind {
        //         TokenKind::Eof => break,
        //         _ => {}
        //     }
        // }

        CompilerResult {
            chunk: copy_chunk(&self.chunk),
            success: !self.had_error,
        }
    }

    fn expression(&mut self) {
        self.parse_precendence(Precedence::PrecAssignment);
    }

    fn advance(&mut self) {
        self.previous = self.current;

        loop {
            self.current = self.scanner.next_token();

            if self.current.kind != TokenKind::Err {
                break;
            }

            self.error_at_current(self.source[self.current.start .. self.current.start + self.current.length].to_string());
        }
    }

    fn consume(&mut self, kind: TokenKind, message: &str) {
        if self.current.kind == kind {
            self.advance();
            return;
        }

        self.error_at_current(message.to_string());
    }

    fn error_at_current(&mut self, message: String) {
        self.error_at(self.current, message);
    }

    fn error_at(&mut self, token: Token, message: String) {
        if self.panic_mode {
            return;
        }

        self.panic_mode = true;

        print!("[line {}] Error", token.line);

        match token.kind {
            TokenKind::Eof => print!(" at end"),
            TokenKind::Err => {},
            _ => {
                print!(" at '{}'", self.source[token.start .. token.start + token.length].to_string());
            }
        }

        print!(": {}", message);

        self.had_error = true;
    }

    fn emit_byte(&mut self, byte: u8) {
        write_chunk_u8(&mut self.chunk, byte, self.previous.line as i32);
    }

    fn emit_bytes(&mut self, byte1: u8, byte2: u8) {
        write_chunk_u8(&mut self.chunk, byte1, self.previous.line as i32);
        write_chunk_u8(&mut self.chunk, byte2, self.previous.line as i32);
    }

    fn emit_return(&mut self) {
        self.emit_byte(op_code_table()[&OpCode::OpReturn]);
    }

    fn end_compiler(&mut self) {
        self.emit_return();
    }

    fn current_chunk(&mut self) -> &mut Chunk {
        &mut self.chunk
    }

    fn emit_constant(&mut self, value: Value) {
        let constant = self.make_constant(value);

        self.emit_bytes(opcode_to_u8(OpCode::OpConstant), constant)
    }

    fn make_constant(&mut self, value: Value) -> u8 {
        let constant = add_constant(&mut self.chunk, value);

        if constant > 255 {
            self.error_at_current("Too many constants in one chunk.".to_string());
            return 0;
        }

        return constant as u8;
    }

    fn number(&mut self) {
        let value = self.source[self.previous.start .. self.previous.start + self.previous.length].to_string().parse::<f64>().unwrap();

        self.emit_constant(value);
    }

    fn unary(&mut self) {
        let kind = self.previous.kind;

        self.parse_precendence(Precedence::PrecUnary);

        match kind {
            // TokenKind::Bang => self.emit_byte(opcode_to_u8(OpCode::OpNot)),
            TokenKind::Minus => self.emit_byte(opcode_to_u8(OpCode::OpNegate)),
            _ => {}
        }
    }

    fn binary(&mut self) {
        let kind = self.previous.kind;

        let rule = self.get_rule(kind);

        self.parse_precendence(order_to_precendence(precendence_to_order(rule.precendence) + 1));

        let instruction = match kind {
            TokenKind::Plus => opcode_to_u8(OpCode::OpAdd),
            TokenKind::Minus => opcode_to_u8(OpCode::OpSubtract),
            TokenKind::Star => opcode_to_u8(OpCode::OpMultiply),
            TokenKind::Slash => opcode_to_u8(OpCode::OpDivide),
            // TokenKind::Equal => opcode_to_u8(OpCode::OpEqual),
            // TokenKind::BangEqual => opcode_to_u8(OpCode::OpNotEqual),
            // TokenKind::Greater => opcode_to_u8(OpCode::OpGreater),
        };

        self.emit_byte(instruction);
    }

    fn grouping(&mut self) {
        self.expression();

        self.consume(TokenKind::RightParen, "Expect ')' after expression.");
    }

    fn parse_precendence(&mut self, precendence: Precedence) {}
}

pub fn init_compiler(source: String) -> Compiler {
    Compiler {
        had_error: false,
        panic_mode: false,
        source: source.clone(),
        chunk: init_chunk(),
        scanner: init_scanner(source),
        current: Token {
            kind: TokenKind::Eof,
            start: 0,
            length: 0,
            line: 0,
            col: 0,
        },
        previous: Token {
            kind: TokenKind::Eof,
            start: 0,
            length: 0,
            line: 0,
            col: 0,
        },
    }
}