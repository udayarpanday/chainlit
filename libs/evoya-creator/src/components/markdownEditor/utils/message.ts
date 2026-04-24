
import { IStep } from 'client-types/*';
import {
  SelectionContext,
  CreatorMessage,
} from "types";

export const messageBuilder = (context: SelectionContext, message: IStep, mdContent: string) => {
  let additional = {
    metadata: {
      full_text: mdContent,
    },
  };
  if (context) {
    if (context.selectionType === 'range' || context.selectionType === 'node') {
      additional = {
        metadata: {
          chat_mode: 'creator',
          full_text: mdContent,
          selection: context?.markdown
        },
      }
    } else if (context.selectionType === 'document' || context.selectionType === 'caret') {
      additional = {
        metadata: {
          chat_mode: 'creator',
          full_text: mdContent,
        },
      }
    } else if (context.selectionType === 'codeblock') {
      if (context.selectedCode) {
        additional = {
          metadata: {
            chat_mode: 'creator',
            full_text: context.code,
            selection: context.selectedCode
          },
        }
      } else {
        additional = {
          metadata: {
            chat_mode: 'creator',
            full_text: context.code,
          },
        }
      }
    }
  }
  
  return {
    ...message,
    // output: newMessage,
    ...additional
  }
}


function escapeBrackets(text: string) {
  const pattern =
    /(```[\s\S]*?```|`.*?`)|\\\[([\s\S]*?[^\\])\\\]|\\\((.*?)\\\)|(\${1})/g;
  const res = text.replace(
    pattern,
    (match, codeBlock, squareBracket, roundBracket, dollarSign) => {
      if (codeBlock) {
        return codeBlock;
      } else if (squareBracket) {
        return `$$\n${squareBracket}\n$$`;
      } else if (roundBracket) {
        return `$${roundBracket}$`;
      } else if (dollarSign) {
        // return '\\$';
      }
      return match;
    },
  );
  return res;
}

export const messageParser = (message: string): CreatorMessage => {
  const belowRegex = /\[below\]((.|\n|\r)*)\[\/below\]/;
  const aboveRegex = /\[above\]((.|\n|\r)*)\[\/above\]/;
  const replaceRegex = /\[replace\]((.|\n|\r)*)\[\/replace\]/;
  const belowRegex2 = /\[below\]((.|\n|\r)*)\[feedback\]/;
  const aboveRegex2 = /\[above\]((.|\n|\r)*)\[feedback\]/;
  const replaceRegex2 = /\[replace\]((.|\n|\r)*)\[feedback\]/;
  const feedbackRegex = /\[feedback\]((.|\n|\r)*)\[\/feedback\]/;
  const hasClosingTag = /\[\/(below|above|replace)\]/.test(message);

  const belowMatch = message.match(hasClosingTag ? belowRegex : belowRegex2);
  const aboveMatch = message.match(hasClosingTag ? aboveRegex : aboveRegex2);
  const replaceMatch = message.match(hasClosingTag ? replaceRegex : replaceRegex2);
  const feedbackMatch = message.match(feedbackRegex);

  console.log(belowMatch);
  console.log(aboveMatch);
  console.log(replaceMatch);
  console.log(feedbackMatch);

  let insertType = 'none';
  let content = message;
  let feedback = null;

  if (belowMatch || aboveMatch || replaceMatch) {
    feedback = "Task done";
  }

  if (belowMatch) {
    insertType = 'after';
    content = belowMatch[1];
  } else if (aboveMatch) {
    insertType = 'before';
    content = aboveMatch[1];
  } else if (replaceMatch) {
    insertType = 'replace';
    content = replaceMatch[1];
  }

  if (feedbackMatch) {
    feedback = feedbackMatch[1];
  }

  return {
    insertType,
    content: escapeBrackets(content),
    feedback
  };
}