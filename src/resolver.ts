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
import { Interpreter } from "./interpreter";
import { Lox } from "./lox";
import { BlockStmt, ClassStmt, ExpressionStmt, FunctionStmt, IfStmt, PrintStmt, ReturnStmt, Stmt, StmtVisitor, VariableStmt, WhileStmt } from "./stmt";
import { Token } from "./token";

enum FunctionType {
    NONE,
    FUNCTION,
    INITIALIZER,
    METHOD,
}

enum ClassType {
    NONE,
    CLASS,
    SUBCLASS,
}

export class Resolver implements ExprVisitor<void>, StmtVisitor<void> {
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

    public visitLiteralExpr(expr: LiteralExpr) {}

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

        if (stmt.superclass && stmt.name.lexeme === stmt.superclass.name.lexeme) Lox.error(stmt.superclass.name, "A class can't inherit from itself.");

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
