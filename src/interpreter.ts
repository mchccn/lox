import { Callable, CallableFunction, Class, Instance } from "./callable";
import { Environment } from "./environment";
import { Return, RuntimeError } from "./error";
import {
    AssignExpr,
    BinaryExpr,
    CallExpr,
    Expr,
    ExprVisitor,
    GetExpr,
    GroupingExpr,
    LiteralExpr,
    LogicalExpr,
    SetExpr,
    SuperExpr,
    TernaryExpr,
    ThisExpr,
    UnaryExpr,
    VariableExpr,
} from "./expr";
import { Lox } from "./lox";
import { BlockStmt, ClassStmt, ExpressionStmt, FunctionStmt, IfStmt, PrintStmt, ReturnStmt, Stmt, StmtVisitor, VariableStmt, WhileStmt } from "./stmt";
import { Token } from "./token";
import { TokenType } from "./types";

export class Interpreter implements ExprVisitor<unknown>, StmtVisitor<void> {
    public readonly globals = new Environment();

    private environment = this.globals;

    private readonly locals = new Map<Expr, number>();

    public constructor() {
        this.globals.define("now", {
            arity() {
                return 0;
            },
            exec() {
                return Date.now();
            },
            toString() {
                return "<native fn>";
            },
        } as Callable);
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
