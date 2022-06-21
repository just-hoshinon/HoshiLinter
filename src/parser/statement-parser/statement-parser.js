'use strict';

import { Statement } from './statement.js';
import { ExpressionParser } from '../expression-parser/expression-parser.js';
import { ScopeParser } from '../scope-parser/scope-parser.js';
import { STATEMENT_KEYWORD_LIST } from '../parser.js';
import { Symbols } from '../../enums/symbols.js';
import { Structures } from '../../enums/structures.js';
import { TokenTypes } from '../../enums/token-types.js';
import { STATEMENTS_STRUCTURES } from './statement-structures.js';

export class StatementParser {
  parser;
  keywordToken;
  structure;
  statement;

  constructor(parser) {
    this.parser = parser;
    this.keywordToken = this.parser.currentToken;
    this.structure = STATEMENTS_STRUCTURES.get(this.keywordToken.value);
  }

  parse(owner) {
    this.statement = new Statement(this.keywordToken.value);
    this.statement.parts.push(this.keywordToken);

    this.parser.next();
    this.checkStructure(this.structure);

    owner.parts.push(this.statement);
  }

  checkRule(ruleArray) {
    const rule = ruleArray.shift();
    const token = this.parser.currentToken;
    if (rule === Symbols.QUESTION_MARK) {
      this.checkQuestionMark(ruleArray, token);
    }
  }

  checkQuestionMark(ruleArray, token) {
    const firstPart = ruleArray[0];
    const isFirstParts = token.is(firstPart);
    const isExpression =
      firstPart === Structures.EXPRESSION && this.isExpression(token.value);

    if (isFirstParts || isExpression) {
      this.checkStructure(ruleArray);
      this.parser.next();
    }
  }

  isExpression(curValue) {
    return (
      !STATEMENT_KEYWORD_LIST.includes(curValue) &&
      curValue !== Symbols.OPENING_BRACE &&
      curValue !== Symbols.CLOSING_PARENTHESIS
    );
  }

  checkStructure(structure) {
    for (const element of structure) {
      if (element instanceof Array) {
        this.checkRule(Array.from(element));
        continue;
      }

      this.checkElement(element);
      this.parser.next();
    }
    this.parser.previous();
  }

  checkElement(element) {
    const token = this.parser.currentToken;

    if (element === Structures.EXPRESSION) {
      new ExpressionParser(this.parser).parse(this.statement);
    } else if (element === Structures.SCOPE) {
      new ScopeParser(this.parser).parse(this.statement);
    } else if (token.is(element) || element === TokenTypes.IDENTIFIER) {
      this.statement.parts.push(this.parser.currentToken);
    }
  }
}
