import { Environment } from "./environment";
import { Return, RuntimeError } from "./error";
import { Interpreter } from "./interpreter";
import { FunctionStmt } from "./stmt";
import { Token } from "./token";

export interface Callable {
    arity(): number;
    exec(interpreter: Interpreter, args: unknown[]): unknown;
}

export class CallableFunction implements Callable {
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

export class Class implements Callable {
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

export class Instance {
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
