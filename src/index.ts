// import fs from "fs";
// import path from "path";

enum TokenType {
    LEFT_PAREN = "LEFT_PAREN",
    RIGHT_PAREN = "RIGHT_PAREN",
    LEFT_BRACE = "LEFT_BRACE",
    RIGHT_BRACE = "RIGHT_BRACE",
    COMMA = "COMMA",
    DOT = "DOT",
    MINUS = "MINUS",
    PLUS = "PLUS",
    SEMICOLON = "SEMICOLON",
    SLASH = "SLASH",
    STAR = "STAR",
    BANG = "BANG",
    QUESTION = "QUESTION",
    COLON = "COLON",
    BANG_EQUAL = "BANG_EQUAL",
    EQUAL = "EQUAL",
    EQUAL_EQUAL = "EQUAL_EQUAL",
    GREATER = "GREATER",
    GREATER_EQUAL = "GREATER_EQUAL",
    LESS = "LESS",
    LESS_EQUAL = "LESS_EQUAL",
    IDENTIFIER = "IDENTIFIER",
    STRING = "STRING",
    NUMBER = "NUMBER",
    AND = "AND",
    CLASS = "CLASS",
    ELSE = "ELSE",
    FALSE = "FALSE",
    FUN = "FUN",
    FOR = "FOR",
    IF = "IF",
    NIL = "NIL",
    OR = "OR",
    PRINT = "PRINT",
    RETURN = "RETURN",
    SUPER = "SUPER",
    THIS = "THIS",
    TRUE = "TRUE",
    VAR = "VAR",
    WHILE = "WHILE",
    EOF = "EOF",
}

class Lox {
    private static instance: Lox;

    // private static readonly interpreter = new Interpreter();

    private static hadError = false;
    private static hadRuntimeError = false;
    
    public static replMode = false;

    private static source = "";

    public constructor(args: string[]) {
        if (Lox.instance) throw new Error(`Only one Lox instance can be created.`);

        if (args.length > 1) {
            console.log("Usage: jlox [script]");
            // process.exit(64);
        } else if (args.length === 1) {
            Lox.runFile(args[0]);
        } else {
            Lox.replMode = true;
            Lox.runPrompt();
        }

        Lox.instance = this;
    }

    private static runFile(file: string) {
        // Lox.run(fs.readFileSync(path.join(process.cwd(), file), "utf8"));

        // if (Lox.hadError) process.exit(65);
        // if (Lox.hadRuntimeError) process.exit(70);
    }

    private static runPrompt() {
        for (;;) {
            console.log("> ");
            // ! get line from user
            // Lox.run(line);
            // Lox.hadError = false;
        }
    }

    private static run(source: string) {
        Lox.source = source;

        const interpreter = new Interpreter();

        const scanner = new Scanner(source);
        const tokens = scanner.scanTokens();

        const parser = new Parser(tokens);
        const statements = parser.parse();

        if (Lox.hadError) return;

        const resolver = new Resolver(interpreter);
        resolver.resolve(statements);

        if (Lox.hadError) return;

        interpreter.interpret(statements);

        console.log(new AstPrinter().print(statements!));

        // Lox.interpreter.interpret(expression);

        Lox.source = "";
    }

    public static error(line: number, col: number, message: string): void;
    public static error(token: Token, message: string): void;
    public static error(...args: [line: number, col: number, message: string] | [token: Token, message: string]) {
        if (args.length === 2) {
            const [token, message] = args;

            if (token.type === TokenType.EOF) {
                this.report(token.line, token.col, " at end", message, token);
            } else {
                this.report(token.line, token.col, " at '" + token.lexeme + "'", message, token);
            }
        } else {
            const [line, col, message] = args;

            this.report(line, col, "", message);
        }
    }

    public static runtimeError(error: RuntimeError) {
        console.error(error.message + "\n[line " + error.token.line + "]");

        Lox.hadRuntimeError = true;
    }

    private static report(line: number, col: number, where: string, message: string, token?: Token) {
        const p = Lox.source.split("\n")[line - 2];
        const l = Lox.source.split("\n")[line - 1];

        const padding = Math.max((line - 0).toString().length, (line - 1).toString().length);

        console.error(`[line ${
            line
        }, column ${
            col
        }] Error${
            where
        }: ${
            message
        }${p
            ? `\n${line - 1}${" ".repeat(padding - (line - 1).toString().length)} | ${p}`
            : ""
        }\n${line}${" ".repeat(padding - (line - 0).toString().length)} | ${l}\n${" ".repeat(col - 1) + "^".repeat(token?.lexeme.length ?? 1)}`);

        Lox.hadError = true;
    }
}

class RuntimeError extends Error {
    public constructor(public readonly token: Token, message: string) {
        super(message);
    }
}

class Return extends Error {
    public constructor(public readonly value: unknown) {
        super();
    }
}

class Token {
    public constructor(
        public readonly type: TokenType,
        public readonly lexeme: string,
        public readonly literal: unknown,
        public readonly line: number,
        public readonly col: number
    ) {}

    public toString() {
        return `${this.type} ${this.lexeme} ${this.literal}`;
    }
}

class Scanner {
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
            case "\"":
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
        while (this.peek() != "\"" && !this.isAtEnd()) {
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

interface ExprVisitor<R> {
    visitBinaryExpr(expr: BinaryExpr): R;
    visitTernaryExpr(expr: TernaryExpr): R;
    visitGroupingExpr(expr: GroupingExpr): R;
    visitLiteralExpr(expr: LiteralExpr): R;
    visitUnaryExpr(expr: UnaryExpr): R;
    visitVariableExpr(expr: VariableExpr): R;
    visitAssignExpr(expr: AssignExpr): R;
    visitLogicalExpr(expr: LogicalExpr): R;
    visitCallExpr(expr: CallExpr): R;
    visitGetExpr(expr: GetExpr): R;
    visitSetExpr(expr: SetExpr): R;
    visitThisExpr(expr: ThisExpr): R;
    visitSuperExpr(expr: SuperExpr): R;
}

abstract class Expr {
    abstract accept<R>(visitor: ExprVisitor<R>): R;
}

class BinaryExpr extends Expr {
    public constructor(public readonly left: Expr, public readonly operator: Token, public readonly right: Expr) { super(); }

    public accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitBinaryExpr(this);
    }
}

class TernaryExpr extends Expr {
    public constructor(public readonly condition: Expr, public readonly leftOperator: Token, public readonly rightOperator: Token, public readonly left: Expr, public readonly right: Expr) { super(); }

    public accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitTernaryExpr(this);
    }
}

class GroupingExpr extends Expr {
    public constructor(public readonly expression: Expr) { super(); }

    public accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitGroupingExpr(this);
    }
}

class LiteralExpr extends Expr {
    public constructor(public readonly value: unknown) { super(); }

    public accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitLiteralExpr(this);
    }
}

class UnaryExpr extends Expr {
    public constructor(public readonly operator: Token, public readonly right: Expr) { super(); }

    public accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitUnaryExpr(this);
    }
}

class VariableExpr extends Expr {
    public constructor(public readonly name: Token) { super(); }

    public accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitVariableExpr(this);
    }
}

class AssignExpr extends Expr {
    public constructor(public readonly name: Token, public readonly value: Expr) { super(); }

    public accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitAssignExpr(this);
    }
}

class LogicalExpr extends Expr {
    public constructor(public readonly left: Expr, public readonly operator: Token, public readonly right: Expr) { super(); }

    public accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitLogicalExpr(this);
    }
}

class CallExpr extends Expr {
    public constructor(public readonly callee: Expr, public readonly paren: Token, public readonly args: Expr[]) { super(); }

    public accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitCallExpr(this);
    }
}

class GetExpr extends Expr {
    public constructor(public readonly object: Expr, public readonly name: Token) { super(); }

    public accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitGetExpr(this);
    }    
}

class SetExpr extends Expr {
    public constructor(public readonly object: Expr, public readonly name: Token, public readonly value: Expr) { super(); }

    public accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitSetExpr(this);
    }
}

class ThisExpr extends Expr {
    public constructor(public readonly keyword: Token) { super(); }

    public accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitThisExpr(this);
    }
}

class SuperExpr extends Expr {
    public constructor(public readonly keyword: Token, public readonly method: Token) { super(); }

    public accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitSuperExpr(this);
    }
}

interface StmtVisitor<R> {
    visitExpressionStmt(stmt: ExpressionStmt): R;
    visitPrintStmt(stmt: PrintStmt): R;
    visitVariableStmt(stmt: VariableStmt): R;
    visitBlockStmt(stmt: BlockStmt): R;
    visitIfStmt(stmt: IfStmt): R;
    visitWhileStmt(stmt: WhileStmt): R;
    visitFunctionStmt(stmt: FunctionStmt): R;
    visitReturnStmt(stmt: ReturnStmt): R;
    visitClassStmt(stmt: ClassStmt): R;
}

abstract class Stmt {
    abstract accept<R>(visitor: StmtVisitor<R>): R;
}

class ExpressionStmt extends Stmt {
    public constructor(public readonly expression: Expr) { super(); }
    public accept<R>(visitor: StmtVisitor<R>): R {
        return visitor.visitExpressionStmt(this);
    }
}

class PrintStmt extends Stmt {
    public constructor(public readonly expression: Expr) { super(); }

    public accept<R>(visitor: StmtVisitor<R>): R {
        return visitor.visitPrintStmt(this);
    }
}

class VariableStmt extends Stmt {
    public constructor(public readonly name: Token, public readonly initializer: Expr | null) { super(); }

    public accept<R>(visitor: StmtVisitor<R>): R {
        return visitor.visitVariableStmt(this);
    }
}

class BlockStmt extends Stmt {
    public constructor(public readonly statements: Stmt[]) { super(); }

    public accept<R>(visitor: StmtVisitor<R>): R {
        return visitor.visitBlockStmt(this);
    }
}

class IfStmt extends Stmt {
    public constructor(public readonly condition: Expr, public readonly thenBranch: Stmt, public readonly elseBranch: Stmt | null) { super(); }

    public accept<R>(visitor: StmtVisitor<R>): R {
        return visitor.visitIfStmt(this);
    }
}

class WhileStmt extends Stmt {
    public constructor(public readonly condition: Expr, public readonly body: Stmt) { super(); }

    public accept<R>(visitor: StmtVisitor<R>): R {
        return visitor.visitWhileStmt(this);
    }
}

class FunctionStmt extends Stmt {
    public constructor(public readonly name: Token, public readonly params: Token[], public readonly body: Stmt[]) { super(); }

    public accept<R>(visitor: StmtVisitor<R>): R {
        return visitor.visitFunctionStmt(this);
    }
}

class ReturnStmt extends Stmt {
    public constructor(public readonly keyword: Token, public readonly value: Expr | null) { super(); }

    public accept<R>(visitor: StmtVisitor<R>): R {
        return visitor.visitReturnStmt(this);
    }
}

class ClassStmt extends Stmt {
    public constructor(public readonly name: Token, public readonly methods: FunctionStmt[], public readonly superclass: VariableExpr | null) { super(); }

    public accept<R>(visitor: StmtVisitor<R>): R {
        return visitor.visitClassStmt(this);
    }
}

interface Callable {
    arity(): number;
    exec(interpreter: Interpreter, args: unknown[]): unknown;
}

class CallableFunction implements Callable {
    public constructor(private readonly declaration: FunctionStmt, private readonly closure: Environment, private readonly isInitializer?: boolean) {}

    public boundTo(instance: Instance) {
        const environment = new Environment(this.closure);

        environment.define("this", instance);

        return new CallableFunction(this.declaration, environment, this.isInitializer);
    }

    public arity() {
        return this.declaration.params.length;
    }

    public exec(interpreter: Interpreter, args: unknown[]) {
        const environment = new Environment(this.closure);

        for (let i = 0; i < this.declaration.params.length; i++) {
            environment.define(this.declaration.params[i].lexeme, args[i]);
        }

        try {
            interpreter.executeBlock(this.declaration.body, environment);
        } catch (value) {
            if (this.isInitializer) return this.closure.getAt(0, "this");

            return (value as Return).value;
        }

        if (this.isInitializer) return this.closure.getAt(0, "this");

        return null;
    }

    public toString() {
        return `<fn ${this.declaration.name.lexeme}>`;
    }
}

class Class implements Callable {
    public constructor(public readonly name: string, private readonly methods: Map<string, CallableFunction>, public readonly superclass: Class | null) {}

    public findMethod(name: string): CallableFunction | null {
        if (this.methods.has(name)) {
            return this.methods.get(name) ?? null;
        }

        if (this.superclass) {
            return this.superclass.findMethod(name);
        }

        return null;
    }

    public exec(interpreter: Interpreter, args: unknown[]) {
        const instance = new Instance(this);

        const initializer = this.findMethod("init");

        if (initializer) {
            initializer.boundTo(instance).exec(interpreter, args);
        }


        return instance;
    }

    public arity() {
        const initializer = this.findMethod("init");

        if (!initializer) return 0;

        return initializer.arity();
    }

    public toString() {
        return this.name;
    }
}

class Instance {
    private readonly fields = new Map<string, unknown>();

    public constructor(private cls: Class) {}

    public get(name: Token) {
        if (this.fields.has(name.lexeme)) return this.fields.get(name.lexeme);

        const method = this.cls.findMethod(name.lexeme);

        if (method) return method.boundTo(this);

        throw new RuntimeError(name, `Undefined property '${name.lexeme}'.`);
    }

    public set(name: Token, value: unknown) {
        this.fields.set(name.lexeme, value);
    }

    public toString() {
        return `${this.cls.name} instance`;
    }
}

class Parser {
    public static ParserError = class ParserError extends Error {};

    private current = 0;

    private finishingCall = false;

    public constructor(private readonly tokens: Token[]) {}

    public parse() {
        const statements = [] as Stmt[];

        while (!this.isAtEnd()) {
            const stmt = this.declaration();

            if (stmt) statements.push(stmt);
        }

        return statements; 
    }

    private declaration() {
        try {
            if (this.match(TokenType.CLASS)) return this.classDeclaration();


            if (this.match(TokenType.FUN)) return this.fnDeclaration("function");

            if (this.match(TokenType.VAR)) return this.varDeclaration();

            return this.statement();
        } catch (error) {
            this.synchronize();

            return null;
        }
    }

    private classDeclaration() {
        const name = this.consume(TokenType.IDENTIFIER, "Expect class name.");

        let superclass = null;

        if (this.match(TokenType.LESS)) {
            this.consume(TokenType.IDENTIFIER, "Expect superclass name.");

            superclass = new VariableExpr(this.previous());
        }

        this.consume(TokenType.LEFT_BRACE, "Expect '{' before class body.");

        const methods = [] as FunctionStmt[];

        while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
            methods.push(this.fnDeclaration("method"));
        }

        this.consume(TokenType.RIGHT_BRACE, "Expect '}' after class body.");

        return new ClassStmt(name, methods, superclass);
    }

    private fnDeclaration(kind: string) {
        const name = this.consume(TokenType.IDENTIFIER, `Expect ${kind} name.`);

        this.consume(TokenType.LEFT_PAREN, `Expect '(' after ${kind} name.`);

        const parameters = [] as Token[];

        if (!this.check(TokenType.RIGHT_PAREN)) {
            do {
                if (parameters.length >= 255) this.error(this.peek(), "Can't have more than 255 parameters.");

                parameters.push(this.consume(TokenType.IDENTIFIER, "Expect parameter name."));
            } while (this.match(TokenType.COMMA));
        }

        this.consume(TokenType.RIGHT_PAREN, "Expect ')' after parameters.");

        this.consume(TokenType.LEFT_BRACE, `Expect '{' before ${kind} body.`);

        const body = this.block();
        
        return new FunctionStmt(name, parameters, body);
    }

    private varDeclaration() {
        const name = this.consume(TokenType.IDENTIFIER, "Expect variable name.");

        const initializer = this.match(TokenType.EQUAL) ? this.expression() : null;

        this.consume(TokenType.SEMICOLON, "Expect ';' after variable declaration.");

        return new VariableStmt(name, initializer);
    }

    private statement() {
        if (this.match(TokenType.IF)) return this.ifStatement();

        if (this.match(TokenType.PRINT)) return this.printStatement();

        if (this.match(TokenType.RETURN)) return this.returnStatement();
    
        if (this.match(TokenType.WHILE)) return this.whileStatement();
    
        if (this.match(TokenType.FOR)) return this.forStatement();

        if (this.match(TokenType.LEFT_BRACE)) return new BlockStmt(this.block());

        return this.expressionStatement();
    }

     private ifStatement() {
        this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'if'.");
       
        const condition = this.expression();
       
        this.consume(TokenType.RIGHT_PAREN, "Expect ')' after if condition."); 

        const thenBranch = this.statement() as Stmt;
        const elseBranch = (this.match(TokenType.ELSE) ? this.statement() : null) as Stmt;
     
        return new IfStmt(condition, thenBranch, elseBranch);
    }

    private whileStatement() {
        this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'while'.");

        const condition = this.expression();

        this.consume(TokenType.RIGHT_PAREN, "Expect ')' after condition.");

        const body = this.statement() as Stmt;

        return new WhileStmt(condition, body);
    }

    private forStatement() {
        this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'for'.");

        const initializer =
            this.match(TokenType.SEMICOLON)
                ? null
                : this.match(TokenType.VAR)
                ? this.varDeclaration()
                : this.expressionStatement();
        
        const condition = !this.check(TokenType.SEMICOLON) ? this.expression() : new LiteralExpr(true);

        this.consume(TokenType.SEMICOLON, "Expect ';' after loop condition.");

        const increment = !this.check(TokenType.RIGHT_PAREN) ? this.expression() : null;

        this.consume(TokenType.RIGHT_PAREN, "Expect ')' after for clauses.");

        let body = this.statement() as Stmt;

        if (increment)
            body = new BlockStmt([body, new ExpressionStmt(increment)]);

        body = new WhileStmt(condition, body);

        if (initializer)
            body = new BlockStmt([initializer, body]);

        return body;
    }

    private block() {
        const statements = [] as Stmt[];

        while (!this.check(TokenType.RIGHT_BRACE) && !this.isAtEnd()) {
            const statement = this.declaration();

            if (statement) statements.push(statement);
        }

        this.consume(TokenType.RIGHT_BRACE, "Expect '}' after block.");

        return statements;
    }

    private printStatement() {
        const value = this.expression();

        if (!Lox.replMode) this.consume(TokenType.SEMICOLON, "Expect ';' after value.");

        return new PrintStmt(value);
    }

    private returnStatement() {
        const keyword = this.previous();
        
        const value = !this.check(TokenType.SEMICOLON) ? this.expression() : null;
        
        this.consume(TokenType.SEMICOLON, "Expect ';' after return value.");
        
        return new ReturnStmt(keyword, value);
    }

    private expressionStatement() {
        const expr = this.expression();

        if (!Lox.replMode) this.consume(TokenType.SEMICOLON, "Expect ';' after expression.");

        return new ExpressionStmt(expr);
    }

    private expression() {
        return this.assignment();
    }

     private assignment() {
        const expr = this.or();

        if (this.match(TokenType.EQUAL)) {
            const equals = this.previous();
            const value = this.assignment() as Expr;

            if (expr instanceof VariableExpr) {
                const { name } = expr;

                return new AssignExpr(name, value);
            }

            this.error(equals, "Invalid assignment target."); 
        }

        return expr;
    }

    private or() {
        let expr = this.and();

        while (this.match(TokenType.OR)) {
            const operator = this.previous();
            const right = this.and();
            expr = new LogicalExpr(expr, operator, right);
        }

        return expr;
    }

    private and() {
        let expr = this.comma();

        while (this.match(TokenType.OR)) {
            const operator = this.previous();
            const right = this.comma();
            expr = new LogicalExpr(expr, operator, right);
        }

        return expr;
    }

    private comma() {
        if (this.finishingCall) return this.ternary();

        let expr = this.ternary() as Expr;

        while (this.match(TokenType.COMMA)) {
            const operator = this.previous();
            const right = this.ternary();
            expr = new BinaryExpr(expr, operator, right);
        }

        return expr;
    }

    private ternary() {
        let expr = this.equality() as Expr;

        while (this.match(TokenType.QUESTION)) {
            const leftOperator = this.previous();
            const left = this.equality();
            const rightOperator = this.consume(TokenType.COLON, "Expect ':' after ternary.");
            const right = this.equality();
            expr = new TernaryExpr(expr, leftOperator, rightOperator, left, right);
        }

        return expr;
    }

    private equality() {
        let expr = this.comparison();

        while (this.match(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL)) {
            const operator = this.previous();
            const right = this.comparison();
            expr = new BinaryExpr(expr, operator, right);
        }

        return expr;
    }

    private comparison() {
        let expr = this.term();

        while (this.match(TokenType.GREATER, TokenType.GREATER_EQUAL, TokenType.LESS, TokenType.LESS_EQUAL)) {
            const operator = this.previous();
            const right = this.term();
            expr = new BinaryExpr(expr, operator, right);
        }

        return expr;
    }

    private term() {
        let expr = this.factor();

        while (this.match(TokenType.MINUS, TokenType.PLUS)) {
            const operator = this.previous();
            const right = this.factor();
            expr = new BinaryExpr(expr, operator, right);
        }

        return expr;
    }

    private factor() {
        let expr = this.unary();

        while (this.match(TokenType.SLASH, TokenType.STAR)) {
            const operator = this.previous();
            const right = this.unary();
            expr = new BinaryExpr(expr, operator, right);
        }

        return expr;
    }

    private unary() {
        if (this.match(TokenType.BANG, TokenType.MINUS)) {
            const operator = this.previous();
            const right = this.unary() as Expr;
            return new UnaryExpr(operator, right);
        }

        return this.exec();
    }

    private exec() {
        let expr = this.primary() as LiteralExpr | VariableExpr | GroupingExpr | CallExpr;

        while (true) { 
            if (this.match(TokenType.LEFT_PAREN)) {
                expr = this.finishCall(expr);
            } else if (this.match(TokenType.DOT)) {
                const name = this.consume(TokenType.IDENTIFIER, "Expect property name after '.'.");

                expr = new GetExpr(expr, name);
            } else {
                break;
            }
        }

        return expr;
    }

    private finishCall(callee: Expr) {
        const args = [] as Expr[];

        if (!this.check(TokenType.RIGHT_PAREN)) {
            do {
                if (arguments.length > 255) this.error(this.peek(), "Can't have more than 255 arguments.");

                this.finishingCall = true;
                
                args.push(this.expression());

                this.finishingCall = false;
            } while (this.match(TokenType.COMMA));
        }


        const paren = this.consume(TokenType.RIGHT_PAREN, "Expect ')' after arguments.");

        return new CallExpr(callee, paren, args);
    }

    private primary() {
        if (this.match(TokenType.FALSE)) return new LiteralExpr(false);
        if (this.match(TokenType.TRUE)) return new LiteralExpr(true);
        if (this.match(TokenType.NIL)) return new LiteralExpr(null);

        if (this.match(TokenType.NUMBER, TokenType.STRING)) {
            return new LiteralExpr(this.previous().literal);
        }

        if (this.match(TokenType.SUPER)) {
            const keyword = this.previous();

            this.consume(TokenType.DOT, "Expect '.' after 'super'.");

            const method = this.consume(TokenType.IDENTIFIER, "Expect superclass method name.");

            return new SuperExpr(keyword, method);
        }

        if (this.match(TokenType.THIS)) return new ThisExpr(this.previous());

        if (this.match(TokenType.IDENTIFIER)) {
            return new VariableExpr(this.previous());
        }

        if (this.match(TokenType.LEFT_PAREN)) {
            const expr = this.expression() as Expr;
            this.consume(TokenType.RIGHT_PAREN, "Expect ')' after expression.");
            return new GroupingExpr(expr);
        }

        throw this.error(this.peek(), "Expect expression.");
    }

    private synchronize() {
        this.advance();

        while (!this.isAtEnd()) {
            if (this.previous().type === TokenType.SEMICOLON) return;

            switch (this.peek().type) {
                case TokenType.CLASS:
                case TokenType.FUN:
                case TokenType.VAR:
                case TokenType.FOR:
                case TokenType.IF:
                case TokenType.WHILE:
                case TokenType.PRINT:
                case TokenType.RETURN:
                    return;
            }

            this.advance();
        }
    }

    private consume(type: TokenType, message: string) {
        if (this.check(type)) return this.advance();

        throw this.error(this.peek(), message);
    }

    private error(token: Token, message: string) {
        Lox.error(token, message);
        return new Parser.ParserError();
    }

    private match(...types: TokenType[]) {
        for (const type of types) {
            if (this.check(type)) {
                this.advance();
                return true;
            }
        }

        return false;
    }

    private check(type: TokenType) {
        if (this.isAtEnd()) return false;
        return this.peek().type == type;
    }

    private advance() {
        if (!this.isAtEnd()) this.current++;
        return this.previous();
    }

    private isAtEnd() {
        return this.peek().type === TokenType.EOF;
    }

    private peek() {
        return this.tokens[this.current];
    }

    private previous() {
        return this.tokens[this.current - 1];
    }
}

class Environment {
    private readonly map = new Map<string, unknown>();

    public constructor(public readonly parent?: Environment) {}

    public get(key: Token): unknown {
        return this.map.get(key.lexeme) ?? this.parent?.get(key) ?? (() => {
            throw new RuntimeError(key, `Undefined variable '${key.lexeme}'.`);
        })();
    }

    public define(key: string, value: unknown): unknown {
        this.map.set(key, value);

        return value;
    }

    public assign(key: Token, value: unknown): unknown {
        if (this.map.has(key.lexeme)) {
            this.map.set(key.lexeme, value);

            return value;
        }

        if (this.parent?.has(key)) {
            this.parent.assign(key, value);

            return value;
        }

        throw new RuntimeError(key, `Undefined variable '${key.lexeme}'.`);
    }

    public has(key: Token): boolean {
        return this.map.has(key.lexeme) || this.parent?.has(key) || false;
    }

    public getAt(distance: number, name: string) {
        return this.ancestor(distance).map.get(name);
    }

    public assignAt(distance: number, name: Token, value: unknown) {
        this.ancestor(distance).map.set(name.lexeme, value);
    }

    public ancestor(distance: number) {
        let environment = this as Environment;

        for (let i = 0; i < distance; i++) {
            environment = environment.parent!;
        }

        return environment;
    }
}

class AstPrinter implements ExprVisitor<string>, StmtVisitor<string> {
    public print(expr: Expr | Stmt[]) {
        if (Array.isArray(expr)) {
            return `Program\n${expr.map((s) => s.accept(this).split("\n").map((line) => `    ${line}`).join("\n")).join("\n")}`;
        }

        return `Program\n${expr.accept(this).split("\n").map((line) => `    ${line}`).join("\n")}`;
    }

    public visitUnaryExpr(expr: UnaryExpr): string {
        return `    Unary [${expr.operator.lexeme}] {${expr.right.accept(this)}}`;
    }

    public visitBinaryExpr(expr: BinaryExpr): string {
        return `Binary [${expr.operator.lexeme}]\n${`${expr.left.accept(this)}\n${expr.right.accept(this)}`.split("\n").map((line) => `    ${line}`).join("\n")}`;
    }

    public visitLiteralExpr(expr: LiteralExpr): string {
        return `Literal [${expr.value}]`;
    }

    public visitGroupingExpr(expr: GroupingExpr): string {
        return `Grouping\n${expr.expression.accept(this).split("\n").map((line) => `    ${line}`).join("\n")}`;
    }

    public visitTernaryExpr(expr: TernaryExpr): string {
        return `Ternary [${expr.leftOperator.lexeme}|${expr.rightOperator.lexeme}]\n${`${expr.condition.accept(this)}\n${expr.left.accept(this)}\n${expr.right.accept(this)}`.split("\n").map((line) => `    ${line}`).join("\n")}`;
    }

    public visitVariableExpr(expr: VariableExpr): string {
        return `Variable [${expr.name.lexeme}]`;
    }

    public visitAssignExpr(expr: AssignExpr): string {
        return `Assignment [${expr.name.lexeme}]\n${expr.value.accept(this).split("\n").map((line) => `    ${line}`).join("\n")}`;
    }

    public visitLogicalExpr(expr: LogicalExpr): string {
        return `Logical [${expr.operator.lexeme}]\n${`${expr.left.accept(this)}\n${expr.right.accept(this)}`.split("\n").map((line) => `    ${line}`).join("\n")}`;
    }

    public visitCallExpr(expr: CallExpr): string {
        return `FunctionCall\n${`${expr.callee.accept(this)}\n${expr.args.map((e) => e.accept(this)).join("\n")}`.split("\n").map((line) => `    ${line}`).join("\n")}`;
    }

    public visitGetExpr(expr: GetExpr): string {
        return `Get [${expr.name.lexeme}]\n${expr.object.accept(this).split("\n").map((line) => `    ${line}`).join("\n")}`;
    }

    public visitSetExpr(expr: SetExpr): string {
        return `Set [${expr.name.lexeme}]\n${`${expr.object.accept(this)}\n${expr.value.accept(this)}`.split("\n").map((line) => `    ${line}`).join("\n")}`;
    }

    public visitThisExpr(expr: ThisExpr): string {
        return `This`;
    }

    public visitSuperExpr(expr: SuperExpr): string {
        return `Super [${expr.method.lexeme}]`;
    }

    public visitExpressionStmt(stmt: ExpressionStmt): string {
        return `ExpressionStatement\n${`${stmt.expression.accept(this).split("\n").map((line) => `    ${line}`).join("\n")}`}`;
    }

    public visitPrintStmt(stmt: PrintStmt): string {
        return `PrintStatement\n${stmt.expression.accept(this).split("\n").map((line) => `    ${line}`).join("\n")}`;
    }

    public visitVariableStmt(stmt: VariableStmt): string {
        return `VariableStatement [${stmt.name.lexeme}]\n${stmt.initializer?.accept(this).split("\n").map((line) => `    ${line}`).join("\n") ?? "null"}`;
    }

    public visitBlockStmt(stmt: BlockStmt): string {
        return `BlockStatement\n${stmt.statements.map((s) => s.accept(this).split("\n").map((line) => `    ${line}`).join("\n"))}`;
    }

    public visitIfStmt(stmt: IfStmt): string {
        return `IfStatement\n${`${stmt.condition.accept(this)}\n${stmt.thenBranch.accept(this)}${stmt.elseBranch ? `\n${stmt.elseBranch.accept(this)}` : ""}`.split("\n").map((line) => `    ${line}`).join("\n")}`;
    }

    public visitWhileStmt(stmt: WhileStmt): string {
        return `WhileStatement\n${`${stmt.condition.accept(this)}\n${stmt.body.accept(this)}`.split("\n").map((line) => `    ${line}`).join("\n")}`;
    }

    public visitFunctionStmt(stmt: FunctionStmt): string {
        return `FunctionStatement [${stmt.name.lexeme}]\n${`${stmt.params.map((t) => t.lexeme).join(", ")}${stmt.body.map((s) => s.accept(this))}`.split("\n").map((line) => `    ${line}`).join("\n")}`;
    }

    public visitReturnStmt(stmt: ReturnStmt): string {
        return `ReturnStatement\n${stmt.value?.accept(this).split("\n").map((line) => `    ${line}`).join("\n") ?? "null"}`;
    }

    public visitClassStmt(stmt: ClassStmt): string {
        return `ClassStatement [${stmt.name.lexeme}]\n${stmt.methods.map((m) => m.accept(this).split("\n").map((line) => `    ${line}`).join("\n")).join("\n")}`;
    }
}

class Interpreter implements ExprVisitor<unknown>, StmtVisitor<void> {
    public readonly globals = new Environment();

    private environment = this.globals;

    private readonly locals = new Map<Expr, number>();

    public constructor() {
        this.globals.define("now", {
            arity() { return 0; },
            exec() {
                return Date.now();
            },
            toString() {
                return "<native fn>"
            },
        } as Callable)
    }

    public interpret(statements: Stmt[]) { 
        try {
            for (const statement of statements) {
                this.execute(statement);
            }
        } catch (error) {
            Lox.runtimeError(error as RuntimeError);
        }
    }

    private execute(stmt: Stmt) {
        return stmt.accept(this);
    }

    public resolve(expr: Expr, depth: number) {
        this.locals.set(expr, depth);
    }

    public executeBlock(statements: Stmt[], environment: Environment) {
        const previous = this.environment;
        try {
            this.environment = environment;

            for (const statement of statements) {
                this.execute(statement);
            }
        } finally {
            this.environment = previous;
        }
    }

    public visitExpressionStmt(stmt: ExpressionStmt): void {
        this.evaluate(stmt.expression);
    }

    public visitPrintStmt(stmt: PrintStmt): void {
        const value = this.evaluate(stmt.expression);

        console.log(value);
    }

    public visitVariableStmt(stmt: VariableStmt) {
        const value = stmt.initializer ? this.evaluate(stmt.initializer) : null;

        this.environment.define(stmt.name.lexeme, value);
    }

    public visitBlockStmt(stmt: BlockStmt) {
        this.executeBlock(stmt.statements, new Environment(this.environment));
    }

    public visitIfStmt(stmt: IfStmt) {
        if (this.isTruthy(this.evaluate(stmt.condition))) {
            this.execute(stmt.thenBranch);
        } else if (stmt.elseBranch) {
            this.execute(stmt.elseBranch);
        }
    }

    public visitWhileStmt(stmt: WhileStmt) {
        while (this.isTruthy(this.evaluate(stmt.condition))) {
            this.execute(stmt.body);
        }
    }

    public visitFunctionStmt(stmt: FunctionStmt) {
        const fn = new CallableFunction(stmt, this.environment);

        this.environment.define(stmt.name.lexeme, fn);
    }

    public visitReturnStmt(stmt: ReturnStmt) {
        const value = stmt.value ? this.evaluate(stmt.value) : null;

        throw new Return(value);
    }

    public visitClassStmt(stmt: ClassStmt) {
        let superclass = null;

        if (stmt.superclass) {
            superclass = this.evaluate(stmt.superclass);

            if (!(superclass instanceof Class)) {
                throw new RuntimeError(stmt.superclass.name, "Superclass must be a class.");
            }
        }

        this.environment.define(stmt.name.lexeme, null);

        if (stmt.superclass) {
            this.environment = new Environment(this.environment);

            this.environment.define("super", superclass);
        }

        const methods = new Map<string, CallableFunction>();
        
        for (const method of stmt.methods) {
            const fn = new CallableFunction(method, this.environment, method.name.lexeme === "init");

            methods.set(method.name.lexeme, fn);
        }

        const cls = new Class(stmt.name.lexeme, methods, superclass);

        if (stmt.superclass) this.environment = this.environment.parent!;

        this.environment.assign(stmt.name, cls);
    }

    public visitLiteralExpr(expr: LiteralExpr): unknown {
        return expr.value;
    }

    public visitGroupingExpr(expr: GroupingExpr): unknown {
        return this.evaluate(expr.expression);
    }

    public visitUnaryExpr(expr: UnaryExpr): unknown {
        const right = this.evaluate(expr.right);

        switch (expr.operator.type) {
            case TokenType.BANG:
                return !this.isTruthy(right);
            case TokenType.MINUS:
                return -(right as number);
        }

        return null;
    }

    public visitBinaryExpr(expr: BinaryExpr): unknown {
        const left = this.evaluate(expr.left);
        const right = this.evaluate(expr.right); 

        switch (expr.operator.type) {
            case TokenType.BANG_EQUAL:
                return !this.isEqual(left, right);
            case TokenType.EQUAL_EQUAL:
                return this.isEqual(left, right);
            case TokenType.GREATER:
                return (left as number) > (right as number);
            case TokenType.GREATER_EQUAL:
                return (left as number) >= (right as number);
            case TokenType.LESS:
                return (left as number) < (right as number);
            case TokenType.LESS_EQUAL:
                return (left as number) <= (right as number);
            case TokenType.MINUS:
                return (left as number) - (right as number);
            case TokenType.SLASH:
                return (left as number) / (right as number);
            case TokenType.STAR:
                return (left as number) * (right as number);
            case TokenType.PLUS:
                return (left as number) + (right as number);
        }

        return null;
    }

    public visitTernaryExpr(expr: TernaryExpr): unknown {
        if (this.isTruthy(this.evaluate(expr.condition))) {
            return this.evaluate(expr.left);
        } else {
            return this.evaluate(expr.right);
        }
    }

    public visitVariableExpr(expr: VariableExpr) {
        return this.lookUpVariable(expr.name, expr);
    }

    public visitAssignExpr(expr: AssignExpr) {
        const value = this.evaluate(expr.value) as Expr;

        const distance = this.locals.get(expr);

        if (typeof distance === "number") {
            this.environment.assignAt(distance, expr.name, value);
        } else {
            this.globals.assign(expr.name, value);
        }

        return value;
    }

    public visitLogicalExpr(expr: LogicalExpr) {
        const left = this.evaluate(expr.left);

        if (expr.operator.type === TokenType.OR) {
            if (this.isTruthy(left)) return left;
        } else {
            if (!this.isTruthy(left)) return left;
        }

        return this.evaluate(expr.right);
    }

    public visitCallExpr(expr: CallExpr) {
        const callee = this.evaluate(expr.callee);

        const args = expr.args.map((a) => this.evaluate(a));

        if (!this.isCallable(callee)) throw new RuntimeError(expr.paren, "Can only call functions and classes.");

        if (args.length !== callee.arity()) throw new RuntimeError(expr.paren, `Expected ${callee.arity()} arguments but got ${args.length}.`);

        return callee.exec(this, args);
    }

    public visitGetExpr(expr: GetExpr) {
        const object = this.evaluate(expr.object);

        if (object instanceof Instance) {
            return object.get(expr.name);
        }

        throw new RuntimeError(expr.name, "Only instances have properties.");
    }

    public visitSetExpr(expr: SetExpr) {
        const object = this.evaluate(expr.object);

        if (!(object instanceof Instance)) { 
            throw new RuntimeError(expr.name, "Only instances have fields.");
        }

        const value = this.evaluate(expr.value);

        object.set(expr.name, value);

        return value;
    }

    public visitThisExpr(expr: ThisExpr) {
        return this.lookUpVariable(expr.keyword, expr);
    }

    public visitSuperExpr(expr: SuperExpr) {
        const distance = this.locals.get(expr)!;

        const superclass = this.environment.getAt(distance, "super");

        const object = this.environment.getAt(distance - 1, "this") as Instance;

        const method = (superclass as Class).findMethod(expr.method.lexeme);

        if (!method) throw new RuntimeError(expr.method, `Undefined property '${expr.method.lexeme}'.`);

        return method.boundTo(object);
    }

    private lookUpVariable(name: Token, expr: Expr) {
        const distance = this.locals.get(expr);

        if (typeof distance === "number") {
            return this.environment.getAt(distance, name.lexeme);
        } else {
            return this.globals.get(name);
        }
    }

    private isTruthy(v: unknown) {
        return !!v;
    }

    private isEqual(a: unknown, b: unknown) {
        return a === b;
    }

    private evaluate(expr: Expr): unknown {
        return expr.accept(this);
    }

    private isCallable(v: unknown): v is Callable {
        return typeof v === "object" && v !== null && typeof (v as any).exec === "function";
    }
}

enum FunctionType { NONE, FUNCTION, INITIALIZER, METHOD }

enum ClassType { NONE, CLASS, SUBCLASS }

class Resolver implements ExprVisitor<void>, StmtVisitor<void> {
    private readonly scopes = [] as Map<string, boolean>[];

    private currentFunction = FunctionType.NONE;
    private currentClass = ClassType.NONE;

    public constructor(private readonly interpreter: Interpreter) {}

    public visitUnaryExpr(expr: UnaryExpr) {
        this.resolve(expr.right);
    }

    public visitBinaryExpr(expr: BinaryExpr) {
        this.resolve(expr.left);
        this.resolve(expr.right);
    }

    public visitTernaryExpr(expr: TernaryExpr) {
        this.resolve(expr.condition);
        this.resolve(expr.left);
        this.resolve(expr.right);
    }

    public visitGroupingExpr(expr: GroupingExpr) {
        this.resolve(expr.expression);
    }

    public visitLiteralExpr(expr: LiteralExpr) {
        
    }

    public visitVariableExpr(expr: VariableExpr) {
        if (this.scopes.length && this.scopes[this.scopes.length - 1].get(expr.name.lexeme) === false) {
            Lox.error(expr.name, "Can't read local variable in its own initializer.");
        }

        this.resolveLocal(expr, expr.name);
    }

    public visitAssignExpr(expr: AssignExpr) {
        this.resolve(expr.value);
        this.resolveLocal(expr, expr.name);
    }

    public visitCallExpr(expr: CallExpr) {
        this.resolve(expr.callee);

        for (const arg of expr.args) {
            this.resolve(arg);
        }
    }

    public visitGetExpr(expr: GetExpr) {
        this.resolve(expr.object);
    }

    public visitSetExpr(expr: SetExpr) {
        this.resolve(expr.value);
        this.resolve(expr.object);
    }

    public visitThisExpr(expr: ThisExpr) {
        if (this.currentClass === ClassType.NONE) Lox.error(expr.keyword, "Can't use 'this' outside of a class.");
        else this.resolveLocal(expr, expr.keyword);
    }

    public visitSuperExpr(expr: SuperExpr) {
        if (this.currentClass === ClassType.NONE) {
            Lox.error(expr.keyword, "Can't use 'super' outside of a class.");
        } else if (this.currentClass !== ClassType.SUBCLASS) {
            Lox.error(expr.keyword, "Can't use 'super' in a class with no superclass.");
        }

        this.resolveLocal(expr, expr.keyword);
    }

    public visitLogicalExpr(expr: LogicalExpr) {
        this.resolve(expr.left);
        this.resolve(expr.right);
    }

    public visitExpressionStmt(stmt: ExpressionStmt) {
        this.resolve(stmt.expression);
    }

    public visitVariableStmt(stmt: VariableStmt) {
        this.declare(stmt.name);
        
        if (stmt.initializer) {
            this.resolve(stmt.initializer);
        }

        this.define(stmt.name);
    }

    public visitBlockStmt(stmt: BlockStmt) {
        this.beginScope();
        this.resolve(stmt.statements);
        this.endScope();
    }

    public visitIfStmt(stmt: IfStmt) {
        this.resolve(stmt.condition);
        this.resolve(stmt.thenBranch);

        if (stmt.elseBranch) this.resolve(stmt.elseBranch);
    }

    public visitWhileStmt(stmt: WhileStmt) {
        this.resolve(stmt.condition);
        this.resolve(stmt.body);
    }

    public visitPrintStmt(stmt: PrintStmt) {
        this.resolve(stmt.expression);
    }

    public visitFunctionStmt(stmt: FunctionStmt) {
        this.declare(stmt.name);

        this.define(stmt.name);

        this.resolveFunction(stmt, FunctionType.FUNCTION);
    }

    public visitReturnStmt(stmt: ReturnStmt) {
        if (this.currentFunction === FunctionType.NONE) {
            Lox.error(stmt.keyword, "Can't return from top-level code.");
        }
        
        if (stmt.value) {
            if (this.currentFunction === FunctionType.INITIALIZER) {
                Lox.error(stmt.keyword, "Can't return a value from an initializer.");
            }

            this.resolve(stmt.value);
        }
    }

    public visitClassStmt(stmt: ClassStmt) {
        const enclosingClass = this.currentClass;

        this.currentClass = ClassType.CLASS;

        this.declare(stmt.name);
        this.define(stmt.name);

         if (stmt.superclass && stmt.name.lexeme === stmt.superclass.name.lexeme)
            Lox.error(stmt.superclass.name, "A class can't inherit from itself.");

        if (stmt.superclass) {
            this.currentClass = ClassType.SUBCLASS;

            this.resolve(stmt.superclass);

            this.beginScope();
            this.scopes[this.scopes.length - 1].set("super", true);
        }

        this.beginScope();

        this.scopes[this.scopes.length - 1].set("this", true);

        for (const method of stmt.methods) {
            const declaration = method.name.lexeme === "init" ? FunctionType.INITIALIZER : FunctionType.METHOD;

            this.resolveFunction(method, declaration); 
        }

        this.endScope();

        if (stmt.superclass != null) this.endScope();

        this.currentClass = enclosingClass;
    }

    public resolve(target: Expr | Stmt | Stmt[]) {
        if (Array.isArray(target)) {
            for (const s of target) {
                s.accept(this);
            }
        } else target.accept(this);
    }

    private resolveLocal(expr: Expr, name: Token) {
        for (let i = this.scopes.length - 1; i >= 0; i--) {
            if (this.scopes[i].has(name.lexeme)) {
                this.interpreter.resolve(expr, this.scopes.length - 1 - i);
                return;
            }
        }
    }

    private resolveFunction(fn: FunctionStmt, type: FunctionType) {
        const enclosingFunction = this.currentFunction;

        this.currentFunction = type;

        this.beginScope();

        for (const param of fn.params) {
            this.declare(param);
            this.define(param);
        }

        this.resolve(fn.body);

        this.endScope();

        this.currentFunction = enclosingFunction;
    }

    private declare(name: Token) {
        if (!this.scopes.length) return;

        const scope = this.scopes[this.scopes.length - 1];

        if (scope.has(name.lexeme)) Lox.error(name, "Already a variable with this name in this scope.");

        scope.set(name.lexeme, false);
    }

    private define(name: Token) {
        if (!this.scopes.length) return;

        const scope = this.scopes[this.scopes.length - 1];

        scope.set(name.lexeme, true);
    }

    private beginScope() {
        this.scopes.push(new Map());
    }

    private endScope() {
        this.scopes.pop();
    }
}
