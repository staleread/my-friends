import {skipSpaces} from "./tokenize-utils/shared.js";
import {
    processCustomTagBody,
    processCustomTagBodyStart,
    processCustomTagChildrenEnd
} from "./tokenize-utils/custom-tag.js";
import {
    processCommandTagBody,
    processCommandTagBodyStart,
    processCommandTagChildrenEnd
} from "./tokenize-utils/command-tag.js";
import {
    processRegularTagBody,
    processRegularTagBodyStart,
    processRegularTagChildrenEnd
} from "./tokenize-utils/regular-tag.js";

const processSplitTagBodyEnd = (input, current) => {
    current++;
    current = skipSpaces(input, current);

    const token = {
        type: 'tag-body-end',
        isChildStart: true
    };

    return [token, current];
}

const processMonoTagBodyEnd = (input, current) => {
    current++;
    current = skipSpaces(input, current);

    const token = {
        type: 'tag-body-end',
        isChildStart: false
    };

    return [token, current];
}

const processTextToken = (input, current) => {
    const TEXT_CHUNK_REG = /[^<>]/;

    let value = input[current];

    while (TEXT_CHUNK_REG.test(input[++current])) {
        value += input[current];
    }

    const token = {
        type: 'text',
        value: value.trim()
    };
    return [token, current];
}

export const tokenize = (input) => {
    let current = 0;
    const tokens = [];
    const UPPER = /[A-Z]/;

    current = skipSpaces(input, current);

    while (current < input.length) {
        let char = input[current];

        if (char === '<') {
            current = skipSpaces(input, ++current)
            char = input[current];

            if (char === '/') {
                continue;
            }

            let startToken, bodyTokens;

            if (char === '$') {
                [startToken, current] = processCommandTagBodyStart(input, ++current);
                [bodyTokens, current] = processCommandTagBody(input, current);

                tokens.push(startToken, ...bodyTokens);
                continue;
            }

            const isCustom = char === char.toUpperCase();

            if (isCustom) {
                [startToken, current] = processCustomTagBodyStart(input, current);
                [bodyTokens, current] = processCustomTagBody(input, current);

                tokens.push(startToken, ...bodyTokens);
                continue;
            }
            [startToken, current] = processRegularTagBodyStart(input, current);
            [bodyTokens, current] = processRegularTagBody(input, current);

            tokens.push(startToken, ...bodyTokens);
            continue;
        }

        let token;

        if (char === '/') {
            current = skipSpaces(input, ++current)
            char = input[current];

            if (char === '>') {
                [token, current] = processMonoTagBodyEnd(input, current);
                tokens.push(token);
                continue;
            }

            if (char === '$') {
                [token, current] = processCommandTagChildrenEnd(input, ++current);
                tokens.push(token);
                continue
            }

            const isCustom = UPPER.test(char);

            if (isCustom) {
                [token, current] = processCustomTagChildrenEnd(input, current);
                tokens.push(token);
                continue;
            }

            [token, current] = processRegularTagChildrenEnd(input, current);
            tokens.push(token);
            continue;
        }

        if (char === '>') {
            [token, current] = processSplitTagBodyEnd(input, current);

            tokens.push(token);
            continue;
        }

        [token, current] = processTextToken(input, current);
        tokens.push(token);
    }
    return tokens;
}