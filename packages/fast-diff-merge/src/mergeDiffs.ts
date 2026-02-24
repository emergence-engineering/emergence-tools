import diff from "fast-diff";

export interface Replace {
  from: number;
  to: number;
  original: string;
  replacement: string;
}

export const isIdentity = (replace: Replace) =>
  replace.replacement === replace.original;

export interface DiffOptions {
  separators: string[];
}

const defaultOptions = {
  separators: [" "],
};

export const whitespaceSeparators = [
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Lexical_grammar#white_space
  " ", // "\u0020",
  "\u00A0", // no-break space
  "\uFEFF", // Zero-width no-break space
  // tabs
  "\t", // "\u0009",
  "\v", // "\u000B",
  "\f", // "\u000C",
  // others
  "\u0085",
  "\u180E", // MONGOLIAN VOWEL SEPARATOR
  "\u202F", // Narrow no-break space
  "\u205F", // Medium Mathematical Space
  "\u3000", // Ideographic Space
  // https://util.unicode.org/UnicodeJsps/list-unicodeset.jsp?a=%5Cp%7BGeneral_Category%3DSpace_Separator%7D
  "\u1680", // OGHAM SPACE MARK
  "\u2000", // EN QUAD
  "\u2001", // EM QUAD
  "\u2002", // EN SPACE
  "\u2003", // EM SPACE
  "\u2004", // THREE-PER-EM SPACE
  "\u2005", // FOUR-PER-EM SPACE
  "\u2006", // SIX-PER-EM SPACE
  "\u2007", // FIGURE SPACE
  "\u2008", // PUNCTUATION SPACE
  "\u2009", // THIN SPACE
  "\u200A", // HAIR SPACE
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Lexical_grammar#line_terminators
  "\n", // "\u000A",
  "\r", // "\u000D",
  "\r\n",
  "\u2028", // Line Separator
  "\u2029", // Paragraph Separator
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Lexical_grammar#format-control_characters
  "\u200C",
  "\u200D",
];

export const convertDiffToReplaceSet = (diffSet: diff.Diff[]): Replace[] => {
  let position = 0;
  return (
    diffSet
      /* eslint-disable */
      .map(([type, text]): Replace[] => {
        switch (type) {
          case diff.EQUAL:
            const equal = {
              from: position,
              to: position + text.length,
              original: text,
              replacement: text,
            };
            position += text.length;
            return [equal];
          case diff.DELETE:
            const deletion = {
              from: position,
              to: position + text.length,
              original: text,
              replacement: "",
            };
            position += text.length;
            return [deletion];
          case diff.INSERT:
            return [
              {
                from: position,
                to: position,
                original: "",
                replacement: text,
              },
            ];
        }
      })
      .flat()
  );
};

export interface SeparatorWithIndex {
  s: string;
  i: number;
}
export interface FirstAndLastSeparator {
  first: SeparatorWithIndex;
  last: SeparatorWithIndex;
}

const defaultGetLastSeparator = (text: string): FirstAndLastSeparator => ({
  first: {
    s: " ",
    i: text.indexOf(" "),
  },
  last: {
    s: " ",
    i: text.lastIndexOf(" "),
  },
});
const defaultStartsWithSeparator = (text: string) => text.startsWith(" ");
const defaultEndsWithSeparator = (text: string) => text.endsWith(" ");

export const mergeReplacePair = (
  leftReplace: Replace,
  rightReplace: Replace,
  getFirstAndLastSeparator: (
    text: string,
  ) => FirstAndLastSeparator = defaultGetLastSeparator,
  startsWithSeparator: (text: string) => boolean = defaultStartsWithSeparator,
  endsWithSeparator: (text: string) => boolean = defaultEndsWithSeparator,
): Replace[] => {
  if (leftReplace.to !== rightReplace.from)
    throw new Error(`Replace pairs must be adjacent\n
, ${JSON.stringify({ leftReplace, rightReplace })}`);
  // if both are identity, we can merge them
  if (isIdentity(leftReplace) && isIdentity(rightReplace)) {
    return [
      {
        from: leftReplace.from,
        to: rightReplace.to,
        original: leftReplace.original + rightReplace.original,
        replacement: leftReplace.replacement + rightReplace.replacement,
      },
    ];
  }
  if (isIdentity(leftReplace)) {
    //if right original or replacement starts with a separator, we should leave them as they are
    if (
      (startsWithSeparator(rightReplace.replacement) &&
        rightReplace.original === "") ||
      (startsWithSeparator(rightReplace.original) &&
        rightReplace.replacement === "")
    ) {
      return [leftReplace, rightReplace];
    }

    const lastSeparator = getFirstAndLastSeparator(
      leftReplace.replacement,
    ).last;
    // if we do not find any separators in left, we can merge left with right
    if (lastSeparator.i === -1) {
      return [
        {
          from: leftReplace.from,
          to: rightReplace.to,
          original: leftReplace.original + rightReplace.original,
          replacement: leftReplace.replacement + rightReplace.replacement,
        },
      ];
    }
    // we should split the left original with the last separator, remove the last "word" and merge it with the right original
    const leftSplit = leftReplace.original.split(lastSeparator.s);
    const lastWord = leftSplit.pop() || "";
    const textWithoutLastWord =
      leftSplit.join(lastSeparator.s) +
      (leftSplit.length ? lastSeparator.s : "");
    return [
      ...(textWithoutLastWord.length
        ? [
            {
              from: leftReplace.from,
              to: leftReplace.from + textWithoutLastWord.length,
              original: textWithoutLastWord,
              replacement: textWithoutLastWord,
            },
          ]
        : []),
      {
        from: leftReplace.from + textWithoutLastWord.length,
        to: rightReplace.to,
        original: lastWord + rightReplace.original,
        replacement: lastWord + rightReplace.replacement,
      },
    ];
  }
  if (isIdentity(rightReplace)) {
    //if left original or replacement starts with a separator, we should leave them as they are
    if (
      (endsWithSeparator(leftReplace.replacement) &&
        leftReplace.original === "") ||
      (endsWithSeparator(leftReplace.original) &&
        leftReplace.replacement === "")
    ) {
      return [leftReplace, rightReplace];
    }

    const firstSeparator = getFirstAndLastSeparator(
      rightReplace.original,
    ).first;
    // if we do not find any separators in right, we can merge left with right
    if (firstSeparator.i === -1) {
      return [
        {
          from: leftReplace.from,
          to: rightReplace.to,
          original: leftReplace.original + rightReplace.original,
          replacement: leftReplace.replacement + rightReplace.replacement,
        },
      ];
    }
    // we should split the right original with the last separator, remove the first "word" and merge it with the left original
    const rightSplit = rightReplace.original.split(firstSeparator.s);
    const firstWord = rightSplit.shift() || "";
    const textWithoutFirstWord =
      (rightSplit.length ? firstSeparator.s : "") +
      rightSplit.join(firstSeparator.s);
    // if the text without the first word is the separator, we should merge the left and right
    if (textWithoutFirstWord === firstSeparator.s)
      return [
        {
          from: leftReplace.from,
          to: rightReplace.to,
          original: leftReplace.original + rightReplace.original,
          replacement: leftReplace.replacement + rightReplace.replacement,
        },
      ];
    return [
      {
        from: leftReplace.from,
        to: leftReplace.to + firstWord.length,
        original: leftReplace.original + firstWord,
        replacement: leftReplace.replacement + firstWord,
      },
      ...(textWithoutFirstWord.length
        ? [
            {
              from: leftReplace.to + firstWord.length,
              to: rightReplace.to,
              original: textWithoutFirstWord,
              replacement: textWithoutFirstWord,
            },
          ]
        : []),
    ];
  }
  return [
    {
      from: leftReplace.from,
      to: rightReplace.to,
      original: leftReplace.original + rightReplace.original,
      replacement: leftReplace.replacement + rightReplace.replacement,
    },
  ];
};

const reduceReplaceSet = (
  replaceSet: Replace[],
  separators: string[],
): Replace[] => {
  const startsWithSeparator = startsWithSeparatorFactory(separators);
  const endsWithSeparator = endsWithSeparatorFactory(separators);
  const getFirstAndLastSeparator = firstAndLastSeparatorFactory(separators);

  return replaceSet.reduce((acc, curr) => {
    const last: Replace | undefined = acc[acc.length - 1];
    const head = acc.slice(0, acc.length - 1);
    if (!last) return [curr];
    const merged = mergeReplacePair(
      last,
      curr,
      getFirstAndLastSeparator,
      startsWithSeparator,
      endsWithSeparator,
    );
    return [...head, ...merged];
  }, [] as Replace[]);
};

const mergeInsertionPair = (left: Replace, right: Replace): Replace[] => {
  if (
    left.original === "" &&
    right.original[0] === " " &&
    right.replacement[0] === " "
  ) {
    return [
      {
        from: left.from,
        to: left.to + 1,
        original: left.original + " ",
        replacement: left.replacement + " ",
      },
      {
        from: right.from + 1,
        to: right.to,
        original: right.original.slice(1),
        replacement: right.replacement.slice(1),
      },
    ];
  }
  if (
    right.original === "" &&
    left.original.slice(-1) === " " &&
    left.replacement.slice(-1) === " "
  ) {
    return [
      {
        from: left.from,
        to: left.to - 1,
        original: left.original.slice(0, -1),
        replacement: left.replacement.slice(0, -1),
      },
      {
        from: right.from - 1,
        to: right.to,
        original: " " + right.original,
        replacement: " " + right.replacement,
      },
    ];
  }
  return [left, right];
};

// The next function factories are mostly used for optimization purposes
const startsWithSeparatorFactory = (
  separators: string[],
): ((text: string) => boolean) => {
  if (separators.length === 0) return () => false;

  if (separators.length === 1)
    return (text: string) => text.startsWith(separators[0]);

  const separatorSet = new Set(separators);
  return (text: string) => {
    if (text.length > 0) {
      return separatorSet.has(text[0]);
    }
    return false;
  };
};

const endsWithSeparatorFactory = (
  separators: string[],
): ((text: string) => boolean) => {
  if (separators.length === 0) return () => false;

  if (separators.length === 1)
    return (text: string) => text.endsWith(separators[0]);

  const separatorSet = new Set(separators);
  return (text: string) => {
    if (text.length > 0) {
      return separatorSet.has(text[text.length - 1]);
    }
    return false;
  };
};

const firstAndLastSeparatorFactory = (
  separators: string[],
): ((text: string) => {
  first: { s: string; i: number };
  last: { s: string; i: number };
}) => {
  if (separators.length === 0) {
    return () => ({ first: { s: " ", i: -1 }, last: { s: " ", i: -1 } });
  }
  if (separators.length === 1) {
    const separator = separators[0];
    return (text: string) => {
      return {
        first: { s: separator, i: text.indexOf(separator) },
        last: { s: separator, i: text.lastIndexOf(separator) },
      };
    };
  }
  return (text: string) => {
    let li = -1;
    let fi = text.length;
    let ls = " ";
    let fs = " ";
    separators.forEach((separator) => {
      const lIndex = text.lastIndexOf(separator);
      const fIndex = text.indexOf(separator);
      if (lIndex > li) {
        li = lIndex;
        ls = separator;
      }
      if (fIndex < fi && fIndex !== -1) {
        fi = fIndex;
        fs = separator;
      }
    });
    return { first: { s: fs, i: fi }, last: { s: ls, i: li } };
  };
};

export const mergeInsertions = (replaceSet: Replace[]): Replace[] => {
  return replaceSet.reduce((acc, curr) => {
    const last: Replace | undefined = acc[acc.length - 1];
    const head = acc.slice(0, acc.length - 1);
    if (!last) return [curr];
    const merged = mergeInsertionPair(last, curr);
    return [...head, ...merged];
  }, [] as Replace[]);
};

const fixSeparators = (separators: string[]) => {
  const fixedSeparators = separators.filter((s) => s.length > 0);
  fixedSeparators.sort((a, b) => b.length - a.length);
  if (fixedSeparators.length === 0) {
    throw new Error(`Separators should at least contain one (non-empty) separator\n
, ${JSON.stringify(separators)}`);
  }
  return fixedSeparators;
};

export const getDiff = (
  original: string,
  fixed: string,
  options?: Partial<DiffOptions>,
) => {
  const mergedOptions = { ...defaultOptions, ...options };
  mergedOptions.separators = fixSeparators(mergedOptions.separators);
  const changes = diff(original, fixed);
  const replaceSet = convertDiffToReplaceSet(changes);
  // yes, we need to run the reduce twice!
  // the first time we go left to right, and the second time we go right to left kinda
  const firstRun = reduceReplaceSet(replaceSet, mergedOptions.separators);
  const secondRun = reduceReplaceSet(firstRun, mergedOptions.separators);
  return mergeInsertions(secondRun);
};
