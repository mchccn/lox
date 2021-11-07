import { Lox } from "./lox";
import { Token } from "./token";
import { TokenType } from "./types";

export class Scanner {
    private static readonly keywords = new Map([
        ["and", TokenType.AND],
        ["class", TokenType.CLASS],
        ["else", TokenType.ELSE],
        ["false", TokenType.FALSE],
        ["for", TokenType.FOR],
        ["fun", TokenType.FUN],
        ["if", TokenType.IF],
        ["nil", TokenType.NIL],
        ["or", TokenType.OR],
        ["print", TokenType.PRINT],
        ["return", TokenType.RETURN],
        ["super", TokenType.SUPER],
        ["this", TokenType.THIS],
        ["true", TokenType.TRUE],
        ["var", TokenType.VAR],
        ["while", TokenType.WHILE],
    ]);

    private readonly tokens = [] as Token[];

    private start = 0;
    private current = 0;
    private line = 0;
    private col = 1;

    public constructor(public readonly source: string) {}

    public scanTokens() {
        while (!this.isAtEnd()) {
            this.start = this.current;
            this.scanToken();
        }

        this.tokens.push(new Token(TokenType.EOF, "", null, this.line, 1));

        return this.tokens;
    }

    private scanToken() {
        const c = this.advance();
        switch (c) {
            case "(":
                this.addToken(TokenType.LEFT_PAREN);
                break;
            case ")":
                this.addToken(TokenType.RIGHT_PAREN);
                break;
            case "{":
                this.addToken(TokenType.LEFT_BRACE);
                break;
            case "}":
                this.addToken(TokenType.RIGHT_BRACE);
                break;
            case ",":
                this.addToken(TokenType.COMMA);
                break;
            case ".":
                this.addToken(TokenType.DOT);
                break;
            case "-":
                this.addToken(TokenType.MINUS);
                break;
            case "+":
                this.addToken(TokenType.PLUS);
                break;
            case ";":
                this.addToken(TokenType.SEMICOLON);
                break;
            case "*":
                this.addToken(TokenType.STAR);
                break;
            case "!":
                this.addToken(this.match("=") ? TokenType.BANG_EQUAL : TokenType.BANG);
                break;
            case "?":
                this.addToken(TokenType.QUESTION);
                break;
            case ":":
                this.addToken(TokenType.COLON);
                break;
            case "=":
                this.addToken(this.match("=") ? TokenType.EQUAL_EQUAL : TokenType.EQUAL);
                break;
            case "<":
                this.addToken(this.match("=") ? TokenType.LESS_EQUAL : TokenType.LESS);
                break;
            case ">":
                this.addToken(this.match("=") ? TokenType.GREATER_EQUAL : TokenType.GREATER);
                break;
            case "/":
                if (this.match("/")) {
                    while (this.peek() != "\n" && !this.isAtEnd()) this.advance();
                } else if (this.match("*")) {
                    this.comments();
                } else {
                    this.addToken(TokenType.SLASH);
                }
                break;
            case '"':
                this.string();
                break;
            case " ":
            case "\r":
            case "\t":
                break;
            case "\n":
                this.line++;
                this.col = 1;
                break;
            default:
                if (this.isDigit(c)) {
                    this.number();
                } else if (this.isAlpha(c)) {
                    this.identifier();
                } else {
                    Lox.error(this.line, this.col, "Unexpected character.");
                }
                break;
        }
    }

    private string() {
        while (this.peek() != '"' && !this.isAtEnd()) {
            if (this.peek() == "\n") this.line++;

            this.advance();
        }

        if (this.isAtEnd()) return Lox.error(this.line, this.col, "Unterminated string.");

        this.advance();

        const value = this.source.substring(this.start + 1, this.current - 1);

        this.addToken(TokenType.STRING, value);
    }

    private number() {
        while (this.isDigit(this.peek())) this.advance();

        if (this.peek() === "." && this.isDigit(this.peekNext())) {
            this.advance();

            while (this.isDigit(this.peek())) this.advance();
        }

        this.addToken(TokenType.NUMBER, Number(this.source.substring(this.start, this.current)));
    }

    private identifier() {
        while (this.isAlphaNumeric(this.peek())) this.advance();

        const text = this.source.substring(this.start, this.current);

        const type = Scanner.keywords.get(text) ?? TokenType.IDENTIFIER;

        this.addToken(type);
    }

    private comments() {
        while (!this.isAtEnd() && !(this.peek() === "*" && this.peekNext() == "/")) {
            if (this.peek() === "\n") this.line++;
            this.advance();
        }

        if (this.isAtEnd()) {
            Lox.error(this.line, this.col, "Unterminated comment.");
            return;
        }

        this.advance();
        if (!this.isAtEnd()) this.advance();
    }

    private peek() {
        if (this.isAtEnd()) return "\0";
        return this.source[this.current];
    }

    private peekNext() {
        if (this.current + 1 >= this.source.length) return "\0";

        return this.source.charAt(this.current + 1);
    }

    private advance() {
        return this.source[this.current++];
    }

    private match(expected: string) {
        if (this.isAtEnd()) return false;
        if (this.source.charAt(this.current) != expected) return false;

        this.current++;
        return true;
    }

    private isDigit(c: string) {
        return /^[0-9]$/.test(c);
    }

    private isAlpha(c: string) {
        return /^[a-zA-Z_]$/.test(c);
    }

    private isAlphaNumeric(c: string) {
        return this.isAlpha(c) || this.isDigit(c);
    }

    private addToken(type: TokenType, literal?: unknown) {
        const text = this.source.substring(this.start, this.current);

        this.tokens.push(new Token(type, text, literal ?? null, this.line, this.col));

        this.col += text.length;
    }

    private isAtEnd() {
        return this.current >= this.source.length;
    }
}
