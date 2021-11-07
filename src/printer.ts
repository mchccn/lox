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
import { BlockStmt, ClassStmt, ExpressionStmt, FunctionStmt, IfStmt, PrintStmt, ReturnStmt, Stmt, StmtVisitor, VariableStmt, WhileStmt } from "./stmt";

export class AstPrinter implements ExprVisitor<string>, StmtVisitor<string> {
    public print(expr: Expr | Stmt[]) {
        if (Array.isArray(expr)) {
            return `Program\n${expr
                .map((s) =>
                    s
                        .accept(this)
                        .split("\n")
                        .map((line) => `    ${line}`)
                        .join("\n")
                )
                .join("\n")}`;
        }

        return `Program\n${expr
            .accept(this)
            .split("\n")
            .map((line) => `    ${line}`)
            .join("\n")}`;
    }

    public visitUnaryExpr(expr: UnaryExpr): string {
        return `    Unary [${expr.operator.lexeme}] {${expr.right.accept(this)}}`;
    }

    public visitBinaryExpr(expr: BinaryExpr): string {
        return `Binary [${expr.operator.lexeme}]\n${`${expr.left.accept(this)}\n${expr.right.accept(this)}`
            .split("\n")
            .map((line) => `    ${line}`)
            .join("\n")}`;
    }

    public visitLiteralExpr(expr: LiteralExpr): string {
        return `Literal [${expr.value}]`;
    }

    public visitGroupingExpr(expr: GroupingExpr): string {
        return `Grouping\n${expr.expression
            .accept(this)
            .split("\n")
            .map((line) => `    ${line}`)
            .join("\n")}`;
    }

    public visitTernaryExpr(expr: TernaryExpr): string {
        return `Ternary [${expr.leftOperator.lexeme}|${expr.rightOperator.lexeme}]\n${`${expr.condition.accept(this)}\n${expr.left.accept(
            this
        )}\n${expr.right.accept(this)}`
            .split("\n")
            .map((line) => `    ${line}`)
            .join("\n")}`;
    }

    public visitVariableExpr(expr: VariableExpr): string {
        return `Variable [${expr.name.lexeme}]`;
    }

    public visitAssignExpr(expr: AssignExpr): string {
        return `Assignment [${expr.name.lexeme}]\n${expr.value
            .accept(this)
            .split("\n")
            .map((line) => `    ${line}`)
            .join("\n")}`;
    }

    public visitLogicalExpr(expr: LogicalExpr): string {
        return `Logical [${expr.operator.lexeme}]\n${`${expr.left.accept(this)}\n${expr.right.accept(this)}`
            .split("\n")
            .map((line) => `    ${line}`)
            .join("\n")}`;
    }

    public visitCallExpr(expr: CallExpr): string {
        return `FunctionCall\n${`${expr.callee.accept(this)}\n${expr.args.map((e) => e.accept(this)).join("\n")}`
            .split("\n")
            .map((line) => `    ${line}`)
            .join("\n")}`;
    }

    public visitGetExpr(expr: GetExpr): string {
        return `Get [${expr.name.lexeme}]\n${expr.object
            .accept(this)
            .split("\n")
            .map((line) => `    ${line}`)
            .join("\n")}`;
    }

    public visitSetExpr(expr: SetExpr): string {
        return `Set [${expr.name.lexeme}]\n${`${expr.object.accept(this)}\n${expr.value.accept(this)}`
            .split("\n")
            .map((line) => `    ${line}`)
            .join("\n")}`;
    }

    public visitThisExpr(expr: ThisExpr): string {
        return `This`;
    }

    public visitSuperExpr(expr: SuperExpr): string {
        return `Super [${expr.method.lexeme}]`;
    }

    public visitExpressionStmt(stmt: ExpressionStmt): string {
        return `ExpressionStatement\n${`${stmt.expression
            .accept(this)
            .split("\n")
            .map((line) => `    ${line}`)
            .join("\n")}`}`;
    }

    public visitPrintStmt(stmt: PrintStmt): string {
        return `PrintStatement\n${stmt.expression
            .accept(this)
            .split("\n")
            .map((line) => `    ${line}`)
            .join("\n")}`;
    }

    public visitVariableStmt(stmt: VariableStmt): string {
        return `VariableStatement [${stmt.name.lexeme}]\n${
            stmt.initializer
                ?.accept(this)
                .split("\n")
                .map((line) => `    ${line}`)
                .join("\n") ?? "null"
        }`;
    }

    public visitBlockStmt(stmt: BlockStmt): string {
        return `BlockStatement\n${stmt.statements.map((s) =>
            s
                .accept(this)
                .split("\n")
                .map((line) => `    ${line}`)
                .join("\n")
        )}`;
    }

    public visitIfStmt(stmt: IfStmt): string {
        return `IfStatement\n${`${stmt.condition.accept(this)}\n${stmt.thenBranch.accept(this)}${stmt.elseBranch ? `\n${stmt.elseBranch.accept(this)}` : ""}`
            .split("\n")
            .map((line) => `    ${line}`)
            .join("\n")}`;
    }

    public visitWhileStmt(stmt: WhileStmt): string {
        return `WhileStatement\n${`${stmt.condition.accept(this)}\n${stmt.body.accept(this)}`
            .split("\n")
            .map((line) => `    ${line}`)
            .join("\n")}`;
    }

    public visitFunctionStmt(stmt: FunctionStmt): string {
        return `FunctionStatement [${stmt.name.lexeme}]\n${`${stmt.params.map((t) => t.lexeme).join(", ")}${stmt.body.map((s) => s.accept(this))}`
            .split("\n")
            .map((line) => `    ${line}`)
            .join("\n")}`;
    }

    public visitReturnStmt(stmt: ReturnStmt): string {
        return `ReturnStatement\n${
            stmt.value
                ?.accept(this)
                .split("\n")
                .map((line) => `    ${line}`)
                .join("\n") ?? "null"
        }`;
    }

    public visitClassStmt(stmt: ClassStmt): string {
        return `ClassStatement [${stmt.name.lexeme}]\n${stmt.methods
            .map((m) =>
                m
                    .accept(this)
                    .split("\n")
                    .map((line) => `    ${line}`)
                    .join("\n")
            )
            .join("\n")}`;
    }
}
