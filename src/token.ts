import { TokenType } from "./types";

export class Token {
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
