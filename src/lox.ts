import fs from "fs";
import path from "path";
import { RuntimeError } from "./error";
import { Interpreter } from "./interpreter";
import { Parser } from "./parser";
import { Resolver } from "./resolver";
import { Scanner } from "./scanner";
import { Token } from "./token";
import { TokenType } from "./types";

export class Lox {
    private static instance: Lox;

    private static readonly interpreter = new Interpreter();

    private static hadError = false;
    private static hadRuntimeError = false;

    public static replMode = false;

    private static source = "";

    public constructor(args: string[]) {
        if (Lox.instance) throw new Error(`Only one Lox instance can be created.`);

        if (args.length > 1) {
            console.log("Usage: jlox [script]");
            process.exit(64);
        } else if (args.length === 1) {
            Lox.runFile(args[0]);
        } else {
            Lox.replMode = true;
            Lox.runPrompt();
        }

        Lox.instance = this;
    }

    private static runFile(file: string) {
        Lox.run(fs.readFileSync(path.join(process.cwd(), file), "utf8"));

        if (Lox.hadError) process.exit(65);
        if (Lox.hadRuntimeError) process.exit(70);
    }

    private static runPrompt() {
        for (;;) {
            console.log("> ");
            // ! get line from user
            // Lox.run(line);
            Lox.hadError = false;
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

        // console.log(new AstPrinter().print(statements!));

        Lox.interpreter.interpret(statements);

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

        console.error(
            `[line ${line}, column ${col}] Error${where}: ${message}${
                p ? `\n${line - 1}${" ".repeat(padding - (line - 1).toString().length)} | ${p}` : ""
            }\n${line}${" ".repeat(padding - (line - 0).toString().length)} | ${l}\n${" ".repeat(col - 1) + "^".repeat(token?.lexeme.length ?? 1)}`
        );

        Lox.hadError = true;
    }
}
