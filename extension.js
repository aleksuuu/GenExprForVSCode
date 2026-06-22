const vscode = require("vscode");

const REF_BASE = "https://docs.cycling74.com/reference/";

const docs = require("./docs.json");

function createDocMarkdown(word, entry) {
  const url = `${REF_BASE}${entry.suffix}`;

  const md = new vscode.MarkdownString();
  md.appendMarkdown(`## ${word}\n\n`);
  md.appendCodeblock(entry.syntax, "cpp");
  md.appendMarkdown(`\n${entry.description}`);
  if (entry.attributes) {
    md.appendMarkdown(`\n### Attributes\n\n`);
    md.appendMarkdown(`\n${entry.attributes}`);
  }

  md.appendMarkdown(`\n\n---\n[Official Reference](${url})\n\n---\n`);
  md.isTrusted = true;
  return md;
}

function activate(context) {
  let wordFinder = (word) => {
    const entry = docs[word];
    if (entry) {
      return new vscode.Hover(createDocMarkdown(word, entry));
    } else {
      const jitWord = word + " (Jitter)";
      const dspWord = word + " (DSP)";
      const entryJitter = docs[jitWord];
      const entryDSP = docs[dspWord];
      if (entryJitter) {
        if (entryDSP) {
          return new vscode.Hover([
            createDocMarkdown(dspWord, entryDSP),
            createDocMarkdown(jitWord, entryJitter),
          ]);
        }
        return new vscode.Hover(createDocMarkdown(jitWord, entryJitter));
      }
      if (entryDSP) {
        return new vscode.Hover(createDocMarkdown(dspWord, entryDSP));
      }
    }
    const firstLetter = word.charAt(0);
    if (
      firstLetter === firstLetter.toUpperCase() &&
      firstLetter !== firstLetter.toLowerCase()
    ) {
      return wordFinder(firstLetter.toLowerCase() + word.slice(1)); // try with first letter capitalized
    }
    return null;
  };
  // 1. HOVER PROVIDER (For viewing info when hovering over existing code)
  let hoverProvider = vscode.languages.registerHoverProvider("genexpr", {
    provideHover(document, position) {
      const range = document.getWordRangeAtPosition(position);
      const word = document.getText(range);

      return wordFinder(word);
    },
  });

  // 2. COMPLETION ITEM PROVIDER (For the interactive drop-down list as you type)
  let completionProvider = vscode.languages.registerCompletionItemProvider(
    "genexpr",
    {
      provideCompletionItems(document, position) {
        const completionItems = [];

        for (const [word, entry] of Object.entries(docs)) {
          // Create a dynamic auto-complete item
          const item = new vscode.CompletionItem(
            word,
            vscode.CompletionItemKind.Function,
          );
          // Inject the snippet syntax so pressing 'Tab' auto-fills parameters
          item.insertText = new vscode.SnippetString(entry.snippet);
          // Add short preview text in the menu list
          // item.detail = entry.syntax;
          item.documentation = createDocMarkdown(word, entry);
          completionItems.push(item);
        }

        const text = document.getText();
        const discoveredVars = new Set();
        let match;

        const varRegex = /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*=/g;
        while ((match = varRegex.exec(text)) !== null) {
          discoveredVars.add(match[1]);
        }

        const declRegex =
          /\b(buffer|data|delay|history|param|Buffer|Data|Delay|History|Param)\s+([a-zA-Z_][a-zA-Z0-9_]*)/g;

        while ((match = declRegex.exec(text)) !== null) {
          discoveredVars.add(match[2]);
        }

        for (const varName of discoveredVars) {
          if (!wordFinder(varName)) {
            const item = new vscode.CompletionItem(
              varName,
              vscode.CompletionItemKind.Variable,
            );
            item.detail = "Local Variable";
            completionItems.push(item);
          }
        }

        return completionItems;
      },
    },
  );

  context.subscriptions.push(hoverProvider, completionProvider);
}

exports.activate = activate;
