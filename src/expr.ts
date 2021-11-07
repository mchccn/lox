import { Token } from "./token";

export interface ExprVisitor<R> {
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

export abstract class Expr {
    abstract accept<R>(visitor: ExprVisitor<R>): R;
}

export class BinaryExpr extends Expr {
    public constructor(public readonly left: Expr, public readonly operator: Token, public readonly right: Expr) {
        super();
    }

    public accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitBinaryExpr(this);
    }
}

export class TernaryExpr extends Expr {
    public constructor(
        public readonly condition: Expr,
        public readonly leftOperator: Token,
        public readonly rightOperator: Token,
        public readonly left: Expr,
        public readonly right: Expr
    ) {
        super();
    }

    public accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitTernaryExpr(this);
    }
}

export class GroupingExpr extends Expr {
    public constructor(public readonly expression: Expr) {
        super();
    }

    public accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitGroupingExpr(this);
    }
}

export class LiteralExpr extends Expr {
    public constructor(public readonly value: unknown) {
        super();
    }

    public accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitLiteralExpr(this);
    }
}

export class UnaryExpr extends Expr {
    public constructor(public readonly operator: Token, public readonly right: Expr) {
        super();
    }

    public accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitUnaryExpr(this);
    }
}

export class VariableExpr extends Expr {
    public constructor(public readonly name: Token) {
        super();
    }

    public accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitVariableExpr(this);
    }
}

export class AssignExpr extends Expr {
    public constructor(public readonly name: Token, public readonly value: Expr) {
        super();
    }

    public accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitAssignExpr(this);
    }
}

export class LogicalExpr extends Expr {
    public constructor(public readonly left: Expr, public readonly operator: Token, public readonly right: Expr) {
        super();
    }

    public accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitLogicalExpr(this);
    }
}

export class CallExpr extends Expr {
    public constructor(public readonly callee: Expr, public readonly paren: Token, public readonly args: Expr[]) {
        super();
    }

    public accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitCallExpr(this);
    }
}

export class GetExpr extends Expr {
    public constructor(public readonly object: Expr, public readonly name: Token) {
        super();
    }

    public accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitGetExpr(this);
    }
}

export class SetExpr extends Expr {
    public constructor(public readonly object: Expr, public readonly name: Token, public readonly value: Expr) {
        super();
    }

    public accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitSetExpr(this);
    }
}

export class ThisExpr extends Expr {
    public constructor(public readonly keyword: Token) {
        super();
    }

    public accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitThisExpr(this);
    }
}

export class SuperExpr extends Expr {
    public constructor(public readonly keyword: Token, public readonly method: Token) {
        super();
    }

    public accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitSuperExpr(this);
    }
}
