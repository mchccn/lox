import {
    AssignExpr,
    BinaryExpr,
    CallExpr,
    Expr,
    GetExpr,
    GroupingExpr,
    LiteralExpr,
    LogicalExpr,
    SuperExpr,
    TernaryExpr,
    ThisExpr,
    UnaryExpr,
    VariableExpr,
} from "./expr";
import { Lox } from "./lox";
import { BlockStmt, ClassStmt, ExpressionStmt, FunctionStmt, IfStmt, PrintStmt, ReturnStmt, Stmt, VariableStmt, WhileStmt } from "./stmt";
import { Token } from "./token";
import { TokenType } from "./types";

export class Parser {
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

        const initializer = this.match(TokenType.SEMICOLON) ? null : this.match(TokenType.VAR) ? this.varDeclaration() : this.expressionStatement();

        const condition = !this.check(TokenType.SEMICOLON) ? this.expression() : new LiteralExpr(true);

        this.consume(TokenType.SEMICOLON, "Expect ';' after loop condition.");

        const increment = !this.check(TokenType.RIGHT_PAREN) ? this.expression() : null;

        this.consume(TokenType.RIGHT_PAREN, "Expect ')' after for clauses.");

        let body = this.statement() as Stmt;

        if (increment) body = new BlockStmt([body, new ExpressionStmt(increment)]);

        body = new WhileStmt(condition, body);

        if (initializer) body = new BlockStmt([initializer, body]);

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
