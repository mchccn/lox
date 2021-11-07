use crate::common::*;
use crate::scanner::*;
use crate::chunk::*;

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

        //     println!("{:?} {:?} '{:?}'", token.kind, token.start, self.source[token.start .. token.start + token.length]);

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