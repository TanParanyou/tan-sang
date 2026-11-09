/**
 * Safe arithmetic expression evaluator for inline calculator inputs.
 * Supports +, -, *, /, parenthesis, and decimals without using unsafe eval().
 */

type TokenType = 'NUMBER' | 'OPERATOR' | 'LPAREN' | 'RPAREN';

interface Token {
  type: TokenType;
  value: string | number;
}

function tokenize(expression: string): Token[] | null {
  // Normalize multiplication & division symbols and remove commas
  const sanitized = expression
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/,/g, '')
    .trim();

  if (!sanitized) return null;

  const tokens: Token[] = [];
  let i = 0;

  while (i < sanitized.length) {
    const char = sanitized[i];
    if (!char) break;

    if (/\s/.test(char)) {
      i++;
      continue;
    }

    if (char === '(') {
      tokens.push({ type: 'LPAREN', value: '(' });
      i++;
      continue;
    }

    if (char === ')') {
      tokens.push({ type: 'RPAREN', value: ')' });
      i++;
      continue;
    }

    if (char === '+' || char === '-' || char === '*' || char === '/') {
      // Check for unary plus or minus
      const prev = tokens[tokens.length - 1];
      const isUnary = !prev || prev.type === 'OPERATOR' || prev.type === 'LPAREN';
      if (isUnary && (char === '+' || char === '-')) {
        let numStr = char;
        i++;
        while (i < sanitized.length) {
          const nextChar = sanitized[i];
          if (nextChar && /[\d.]/.test(nextChar)) {
            numStr += nextChar;
            i++;
          } else {
            break;
          }
        }
        const num = parseFloat(numStr);
        if (isNaN(num)) return null;
        tokens.push({ type: 'NUMBER', value: num });
        continue;
      }

      tokens.push({ type: 'OPERATOR', value: char });
      i++;
      continue;
    }

    if (/[\d.]/.test(char)) {
      let numStr = '';
      while (i < sanitized.length) {
        const nextChar = sanitized[i];
        if (nextChar && /[\d.]/.test(nextChar)) {
          numStr += nextChar;
          i++;
        } else {
          break;
        }
      }
      const num = parseFloat(numStr);
      if (isNaN(num)) return null;
      tokens.push({ type: 'NUMBER', value: num });
      continue;
    }

    // Invalid character
    return null;
  }

  return tokens.length > 0 ? tokens : null;
}

/**
 * Evaluates tokens using Shunting-yard algorithm + Reverse Polish Notation (RPN) evaluation.
 */
function evaluateTokens(tokens: Token[]): number | null {
  const precedence: Record<string, number> = {
    '+': 1,
    '-': 1,
    '*': 2,
    '/': 2,
  };

  const outputQueue: Token[] = [];
  const operatorStack: Token[] = [];

  for (const token of tokens) {
    if (token.type === 'NUMBER') {
      outputQueue.push(token);
    } else if (token.type === 'OPERATOR') {
      const op1 = token.value as string;
      const op1Precedence = precedence[op1] ?? 0;
      while (operatorStack.length > 0) {
        const top = operatorStack[operatorStack.length - 1];
        if (top && top.type === 'OPERATOR') {
          const op2 = top.value as string;
          const op2Precedence = precedence[op2] ?? 0;
          if (op2Precedence >= op1Precedence) {
            outputQueue.push(operatorStack.pop()!);
            continue;
          }
        }
        break;
      }
      operatorStack.push(token);
    } else if (token.type === 'LPAREN') {
      operatorStack.push(token);
    } else if (token.type === 'RPAREN') {
      let foundLparen = false;
      while (operatorStack.length > 0) {
        const top = operatorStack.pop()!;
        if (top.type === 'LPAREN') {
          foundLparen = true;
          break;
        }
        outputQueue.push(top);
      }
      if (!foundLparen) return null; // Mismatched parentheses
    }
  }

  while (operatorStack.length > 0) {
    const top = operatorStack.pop()!;
    if (top.type === 'LPAREN' || top.type === 'RPAREN') return null; // Mismatched parentheses
    outputQueue.push(top);
  }

  // Evaluate RPN
  const evalStack: number[] = [];

  for (const token of outputQueue) {
    if (token.type === 'NUMBER') {
      evalStack.push(token.value as number);
    } else if (token.type === 'OPERATOR') {
      if (evalStack.length < 2) return null;
      const b = evalStack.pop()!;
      const a = evalStack.pop()!;
      const op = token.value as string;

      let res = 0;
      switch (op) {
        case '+':
          res = a + b;
          break;
        case '-':
          res = a - b;
          break;
        case '*':
          res = a * b;
          break;
        case '/':
          if (b === 0) return null; // Division by zero
          res = a / b;
          break;
        default:
          return null;
      }
      evalStack.push(res);
    }
  }

  if (evalStack.length !== 1) return null;
  const finalVal = evalStack[0];
  if (finalVal === undefined || !isFinite(finalVal) || isNaN(finalVal)) return null;

  // Round to 2 decimal places to avoid floating point anomalies
  return Math.round(finalVal * 100) / 100;
}

/**
 * Safely evaluates a simple mathematical expression.
 * Returns null if the expression is invalid, empty, or cannot be evaluated.
 * Example: "60+15" -> 75, "50 + 10 * 2" -> 70, "80 - 15.5" -> 64.5
 */
export function evaluateSimpleMath(expression: string): number | null {
  if (!expression || typeof expression !== 'string') return null;
  const trimmed = expression.trim();
  if (!trimmed) return null;

  const tokens = tokenize(trimmed);
  if (!tokens) return null;

  return evaluateTokens(tokens);
}

/**
 * Checks if a string contains mathematical operator characters.
 */
export function hasMathOperators(val: string): boolean {
  return /[+\-*\/×÷]/.test(val);
}
