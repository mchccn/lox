import { Token } from "./token";

export class RuntimeError extends Error {
    public constructor(public readonly token: Token, message: string) {
        super(message);
    }
}

export class Return extends Error {
    public constructor(public readonly value: unknown) {
        super();
    }
}
