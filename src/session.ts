export const DEFAULT_CODE = `(input: string): string => {
  return input.toUpperCase()
}
`;

const PAGE_NAME = "TS Magic Circle";

export type Session = {
    title: string;
    code: string;
    input: string;
};

export function readSession(href: string): Session {
    const params = new URL(href).searchParams;
    const title = params.get("title");
    const code = params.get("p");
    const input = params.get("q") ?? params.get("t");
    return {
        title: title === null ? PAGE_NAME : `${title} | ${PAGE_NAME}`,
        code: code ?? DEFAULT_CODE,
        input: input ?? "",
    };
}
