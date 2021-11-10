#[derive(Debug, PartialEq, Eq, Hash, Clone, Copy)]
pub enum TokenKind {
    LeftParen,
    RightParen,
    LeftBrace,
    RightBrace,
    Comma,
    Dot,
    Minus,
    Plus,
    Semicolon,
    Slash,
    Star,
    Bang,
    BangEqual,
    Equal,
    EqualEqual,
    Greater,
    GreaterEqual,
    Less,
    LessEqual,
    Identifier,
    String,
    Number,
    And,
    Class,
    Else,
    False,
    Fun,
    For,
    If,
    Nil,
    Or,
    Print,
    Return,
    Super,
    This,
    True,
    Var,
    While,
    Err,
    Eof,
}

#[derive(Clone, Copy)]
pub struct Token {
    pub kind: TokenKind,
    pub start: usize,
    pub length: usize,
    pub line: usize,
    pub col: usize,
}

pub trait TokenScanner {
    fn next_token(&mut self) -> Token;
    fn is_at_end(&mut self) -> bool;
    fn make_token(&mut self, kind: TokenKind) -> Token;
    fn error_token(&mut self, msg: String) -> Token;
    fn advance(&mut self) -> char;
    fn match_char(&mut self, expected: char) -> bool;
    fn skip_whitespace(&mut self);
    fn peek(&mut self) -> char;
    fn peek_next(&mut self) -> char;
    fn is_digit(&mut self, expected: char) -> bool;
    fn is_alpha(&mut self, expected: char) -> bool;
    fn string(&mut self) -> Token;
    fn number(&mut self) -> Token;
    fn identifier(&mut self) -> Token;
}

pub struct Scanner {
    source: String,
    start: usize,
    current: usize,
    line: usize,
    col: usize,
}

impl TokenScanner for Scanner {
    fn next_token(&mut self) -> Token {
        self.skip_whitespace();

        self.start = self.current;

        if self.is_at_end() {
            return self.make_token(TokenKind::Eof);
        }

        let c = self.advance();

        if self.is_digit(c) {
            return self.number();
        }

        if self.is_alpha(c) {
            return self.identifier();
        }

        match c {
            '(' => self.make_token(TokenKind::LeftParen),
            ')' => self.make_token(TokenKind::RightParen),
            '{' => self.make_token(TokenKind::LeftBrace),
            '}' => self.make_token(TokenKind::RightBrace),
            ',' => self.make_token(TokenKind::Comma),
            '.' => self.make_token(TokenKind::Dot),
            '-' => self.make_token(TokenKind::Minus),
            '+' => self.make_token(TokenKind::Plus),
            ';' => self.make_token(TokenKind::Semicolon),
            '/' => self.make_token(TokenKind::Slash),
            '*' => self.make_token(TokenKind::Star),
            '!' => {
                if self.match_char('=') {
                    self.make_token(TokenKind::BangEqual)
                } else {
                    self.make_token(TokenKind::Bang)
                }
            }
            '=' => {
                if self.match_char('=') {
                    self.make_token(TokenKind::EqualEqual)
                } else {
                    self.make_token(TokenKind::Equal)
                }
            }
            '>' => {
                if self.match_char('=') {
                    self.make_token(TokenKind::GreaterEqual)
                } else {
                    self.make_token(TokenKind::Greater)
                }
            }
            '<' => {
                if self.match_char('=') {
                    self.make_token(TokenKind::LessEqual)
                } else {
                    self.make_token(TokenKind::Less)
                }
            }
            '"' => self.string(),
            _ => self.error_token("Unexpected character.".to_string()),
        }
    }

    fn string(&mut self) -> Token {
        while self.peek() != '"' && !self.is_at_end() {
            self.advance();
        }

        if self.is_at_end() {
            return self.error_token("Unterminated string.".to_string());
        }

        self.advance();

        self.make_token(TokenKind::String)
    }

    fn number(&mut self) -> Token {
        let mut c = self.peek();

        while self.is_digit(c) {
            self.advance();

            c = self.peek();
        }

        c = self.peek_next();

        if self.peek() == '.' && self.is_digit(c) {
            self.advance();

            c = self.peek();

            while self.is_digit(c) {
                self.advance();

                c = self.peek();
            }
        }

        self.make_token(TokenKind::Number)
    }

    fn identifier(&mut self) -> Token {
        let mut c = self.peek();

        while self.is_alpha(c) || self.is_digit(c) {
            self.advance();

            c = self.peek();
        }

        let text = self.source[self.start..self.current].to_string();

        match text.as_ref() {
            "and" => self.make_token(TokenKind::And),
            "class" => self.make_token(TokenKind::Class),
            "else" => self.make_token(TokenKind::Else),
            "false" => self.make_token(TokenKind::False),
            "fun" => self.make_token(TokenKind::Fun),
            "for" => self.make_token(TokenKind::For),
            "if" => self.make_token(TokenKind::If),
            "nil" => self.make_token(TokenKind::Nil),
            "or" => self.make_token(TokenKind::Or),
            "print" => self.make_token(TokenKind::Print),
            "return" => self.make_token(TokenKind::Return),
            "super" => self.make_token(TokenKind::Super),
            "this" => self.make_token(TokenKind::This),
            "true" => self.make_token(TokenKind::True),
            "var" => self.make_token(TokenKind::Var),
            "while" => self.make_token(TokenKind::While),
            _ => self.make_token(TokenKind::Identifier),
        }
    }

    fn is_at_end(&mut self) -> bool {
        return self.current >= self.source.len();
    }

    fn make_token(&mut self, kind: TokenKind) -> Token {
        Token {
            kind,
            start: self.start,
            length: self.current - self.start,
            line: self.line,
            col: self.col,
        }
    }

    fn error_token(&mut self, msg: String) -> Token {
        Token {
            kind: TokenKind::Err,
            start: self.start,
            length: msg.len(),
            line: self.line,
            col: self.col,
        }
    }

    fn advance(&mut self) -> char {
        self.current += 1;
        self.col += 1;

        let c = self.source.chars().nth(self.current - 1).unwrap();

        if c == '\n' {
            self.line += 1;
            self.col = 1;
        }

        return c;
    }

    fn match_char(&mut self, expected: char) -> bool {
        if self.is_at_end() {
            return false;
        }

        if self.peek() != expected {
            return false;
        }

        self.current += 1;

        return true;
    }

    fn skip_whitespace(&mut self) {
        while !self.is_at_end() {
            let c = self.peek();

            if c == ' ' || c == '\r' || c == '\t' || c == '\n' {
                self.advance();
            } else if c == '/' && self.peek_next() == '/' {
                while self.peek() != '\n' && !self.is_at_end() {
                    self.advance();
                }
            } else {
                break;
            }
        }
    }

    fn peek(&mut self) -> char {
        if self.current >= self.source.len() {
            return '\0';
        }

        return self.source.chars().nth(self.current).unwrap();
    }

    fn peek_next(&mut self) -> char {
        if self.current + 1 >= self.source.len() {
            return '\0';
        }

        return self.source.chars().nth(self.current + 1).unwrap();
    }

    fn is_digit(&mut self, expected: char) -> bool {
        expected >= '0' && expected <= '9'
    }

    fn is_alpha(&mut self, expected: char) -> bool {
        (expected >= 'a' && expected <= 'z')
            || (expected >= 'A' && expected <= 'Z')
            || expected == '_'
    }
}

pub fn init_scanner(source: String) -> Scanner {
    Scanner {
        source,
        start: 0,
        current: 0,
        line: 1,
        col: 1,
    }
}
