import { Expr, VariableExpr } from "./expr";
import { Token } from "./token";

export interface StmtVisitor<R> {
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

export abstract class Stmt {
    abstract accept<R>(visitor: StmtVisitor<R>): R;
}

export class ExpressionStmt extends Stmt {
    public constructor(public readonly expression: Expr) {
        super();
    }
    public accept<R>(visitor: StmtVisitor<R>): R {
        return visitor.visitExpressionStmt(this);
    }
}

export class PrintStmt extends Stmt {
    public constructor(public readonly expression: Expr) {
        super();
    }

    public accept<R>(visitor: StmtVisitor<R>): R {
        return visitor.visitPrintStmt(this);
    }
}

export class VariableStmt extends Stmt {
    public constructor(public readonly name: Token, public readonly initializer: Expr | null) {
        super();
    }

    public accept<R>(visitor: StmtVisitor<R>): R {
        return visitor.visitVariableStmt(this);
    }
}

export class BlockStmt extends Stmt {
    public constructor(public readonly statements: Stmt[]) {
        super();
    }

    public accept<R>(visitor: StmtVisitor<R>): R {
        return visitor.visitBlockStmt(this);
    }
}

export class IfStmt extends Stmt {
    public constructor(public readonly condition: Expr, public readonly thenBranch: Stmt, public readonly elseBranch: Stmt | null) {
        super();
    }

    public accept<R>(visitor: StmtVisitor<R>): R {
        return visitor.visitIfStmt(this);
    }
}

export class WhileStmt extends Stmt {
    public constructor(public readonly condition: Expr, public readonly body: Stmt) {
        super();
    }

    public accept<R>(visitor: StmtVisitor<R>): R {
        return visitor.visitWhileStmt(this);
    }
}

export class FunctionStmt extends Stmt {
    public constructor(public readonly name: Token, public readonly params: Token[], public readonly body: Stmt[]) {
        super();
    }

    public accept<R>(visitor: StmtVisitor<R>): R {
        return visitor.visitFunctionStmt(this);
    }
}

export class ReturnStmt extends Stmt {
    public constructor(public readonly keyword: Token, public readonly value: Expr | null) {
        super();
    }

    public accept<R>(visitor: StmtVisitor<R>): R {
        return visitor.visitReturnStmt(this);
    }
}

export class ClassStmt extends Stmt {
    public constructor(public readonly name: Token, public readonly methods: FunctionStmt[], public readonly superclass: VariableExpr | null) {
        super();
    }

    public accept<R>(visitor: StmtVisitor<R>): R {
        return visitor.visitClassStmt(this);
    }
}
