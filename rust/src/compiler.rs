use crate::chunk::*;
use crate::common::*;
use crate::scanner::*;
use crate::value::*;
use std::collections::HashMap;

#[derive(Debug, PartialEq, Eq, Hash, Clone, Copy)]
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

#[derive(Debug, PartialEq, Eq, Hash, Clone, Copy)]
pub enum ParseRuleFn {
    FnNone,
    FnNumber,
    FnUnary,
    FnBinary,
    FnGrouping,
}

static ParseRuleNone: ParseRule = ParseRule {
    prefix: ParseRuleFn::FnNone,
    infix: ParseRuleFn::FnNone,
    precendence: Precedence::PrecNone,
};

pub type PrecTable = HashMap<Precedence, u8>;

pub type ParseRuleFnTable = HashMap<TokenKind, ParseRule>;

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

pub fn fn_table() -> ParseRuleFnTable {
    let mut table = ParseRuleFnTable::new();

    table.insert(
        TokenKind::LeftParen,
        ParseRule {
            prefix: ParseRuleFn::FnGrouping,
            infix: ParseRuleFn::FnNone,
            precendence: Precedence::PrecNone,
        },
    );

    table.insert(TokenKind::RightParen, ParseRuleNone.clone());

    table.insert(TokenKind::LeftBrace, ParseRuleNone.clone());

    table.insert(TokenKind::RightBrace, ParseRuleNone.clone());

    table.insert(TokenKind::Comma, ParseRuleNone.clone());

    table.insert(TokenKind::Dot, ParseRuleNone.clone());

    table.insert(
        TokenKind::Minus,
        ParseRule {
            prefix: ParseRuleFn::FnUnary,
            infix: ParseRuleFn::FnBinary,
            precendence: Precedence::PrecTerm,
        },
    );

    table.insert(
        TokenKind::Plus,
        ParseRule {
            prefix: ParseRuleFn::FnNone,
            infix: ParseRuleFn::FnBinary,
            precendence: Precedence::PrecTerm,
        },
    );

    table.insert(TokenKind::Semicolon, ParseRuleNone.clone());

    table.insert(
        TokenKind::Slash,
        ParseRule {
            prefix: ParseRuleFn::FnNone,
            infix: ParseRuleFn::FnBinary,
            precendence: Precedence::PrecFactor,
        },
    );

    table.insert(
        TokenKind::Star,
        ParseRule {
            prefix: ParseRuleFn::FnNone,
            infix: ParseRuleFn::FnBinary,
            precendence: Precedence::PrecFactor,
        },
    );

    table.insert(TokenKind::Bang, ParseRuleNone.clone());

    table.insert(TokenKind::BangEqual, ParseRuleNone.clone());

    table.insert(TokenKind::Equal, ParseRuleNone.clone());

    table.insert(TokenKind::EqualEqual, ParseRuleNone.clone());

    table.insert(TokenKind::Greater, ParseRuleNone.clone());

    table.insert(TokenKind::GreaterEqual, ParseRuleNone.clone());

    table.insert(TokenKind::Less, ParseRuleNone.clone());

    table.insert(TokenKind::LessEqual, ParseRuleNone.clone());

    table.insert(TokenKind::Identifier, ParseRuleNone.clone());

    table.insert(TokenKind::String, ParseRuleNone.clone());

    table.insert(
        TokenKind::Number,
        ParseRule {
            prefix: ParseRuleFn::FnNumber,
            infix: ParseRuleFn::FnNone,
            precendence: Precedence::PrecNone,
        },
    );

    table.insert(TokenKind::And, ParseRuleNone.clone());

    table.insert(TokenKind::Class, ParseRuleNone.clone());

    table.insert(TokenKind::Else, ParseRuleNone.clone());

    table.insert(TokenKind::False, ParseRuleNone.clone());

    table.insert(TokenKind::Fun, ParseRuleNone.clone());

    table.insert(TokenKind::For, ParseRuleNone.clone());

    table.insert(TokenKind::If, ParseRuleNone.clone());

    table.insert(TokenKind::Nil, ParseRuleNone.clone());

    table.insert(TokenKind::Or, ParseRuleNone.clone());

    table.insert(TokenKind::Print, ParseRuleNone.clone());

    table.insert(TokenKind::Return, ParseRuleNone.clone());

    table.insert(TokenKind::Super, ParseRuleNone.clone());

    table.insert(TokenKind::This, ParseRuleNone.clone());

    table.insert(TokenKind::True, ParseRuleNone.clone());

    table.insert(TokenKind::Var, ParseRuleNone.clone());

    table.insert(TokenKind::While, ParseRuleNone.clone());

    table.insert(TokenKind::Err, ParseRuleNone.clone());

    table.insert(TokenKind::Eof, ParseRuleNone.clone());

    return table;
}

#[derive(Clone, Copy)]
pub struct ParseRule {
    prefix: ParseRuleFn,
    infix: ParseRuleFn,
    precendence: Precedence,
}

pub trait Parser {
    fn compile(&mut self, chunk: Chunk) -> CompilerResult;
    fn expression(&mut self);
    fn advance(&mut self);
    fn consume(&mut self, kind: TokenKind, message: &str);
    fn error_at_current(&mut self, message: String);
    fn error_at(&mut self, token: Token, message: String);
    fn error(&mut self, message: String);
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
    fn get_rule(&mut self, kind: TokenKind) -> ParseRule;
    fn translate(&mut self, rule: ParseRuleFn);
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

        self.advance();

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
        if self.scanner.is_at_end() && self.current.kind == TokenKind::Eof {
            return;
        }

        self.previous = self.current;

        loop {

            self.current = self.scanner.next_token();

            println!("{:?}", self.current.kind);

            if self.current.kind != TokenKind::Err {
                break;
            }

            self.error_at_current(
                self.source[self.current.start..self.current.start + self.current.length]
                    .to_string(),
            );
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
            TokenKind::Err => {}
            _ => {
                print!(
                    " at '{}'",
                    self.source[token.start..token.start + token.length].to_string()
                );
            }
        }

        println!(": {}", message);

        self.had_error = true;
    }

    fn error(&mut self, message: String) {
        self.error_at(self.previous, message);
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
            self.error("Too many constants in one chunk.".to_string());
            return 0;
        }

        return constant as u8;
    }

    fn number(&mut self) {
        let value = self.source[self.previous.start..self.previous.start + self.previous.length]
            .to_string()
            .parse::<f64>()
            .unwrap();

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

        self.parse_precendence(order_to_precendence(
            precendence_to_order(rule.precendence) + 1,
        ));

        let instruction = match kind {
            TokenKind::Plus => opcode_to_u8(OpCode::OpAdd),
            TokenKind::Minus => opcode_to_u8(OpCode::OpSubtract),
            TokenKind::Star => opcode_to_u8(OpCode::OpMultiply),
            TokenKind::Slash => opcode_to_u8(OpCode::OpDivide),
            // TokenKind::Equal => opcode_to_u8(OpCode::OpEqual),
            // TokenKind::BangEqual => opcode_to_u8(OpCode::OpNotEqual),
            // TokenKind::Greater => opcode_to_u8(OpCode::OpGreater),
            _ => panic!(),
        };

        self.emit_byte(instruction);
    }

    fn grouping(&mut self) {
        self.expression();

        self.consume(TokenKind::RightParen, "Expect ')' after expression.");
    }

    fn parse_precendence(&mut self, precendence: Precedence) {
        self.advance();

        let prefix_rule = self.get_rule(self.previous.kind).prefix;

        if prefix_rule == ParseRuleFn::FnNone {
            self.error("Expect expression.".to_string());

            return;
        }

        self.translate(prefix_rule);

        while precendence_to_order(precendence) <= precendence_to_order(self.get_rule(self.current.kind).precendence) {
            self.advance();

            let infix_rule = self.get_rule(self.previous.kind).infix;
            
            self.translate(infix_rule);
        }
    }

    fn get_rule(&mut self, kind: TokenKind) -> ParseRule {
        return fn_table()[&kind];
    }

    fn translate(&mut self, rule: ParseRuleFn) {
        match rule {
            ParseRuleFn::FnNone => {},
            ParseRuleFn::FnNumber => self.number(),
            ParseRuleFn::FnUnary => self.unary(),
            ParseRuleFn::FnBinary => self.binary(),
            ParseRuleFn::FnGrouping => self.grouping(),
        }
    }
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
