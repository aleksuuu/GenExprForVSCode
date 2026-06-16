const vscode = require("vscode");

const REF_BASE = "https://docs.cycling74.com/reference/";

const docs = require("./docs.json");

function createDocMarkdown(word, entry) {
  const url = `${REF_BASE}${entry.suffix}`;

  const md = new vscode.MarkdownString();
  md.appendMarkdown(`## ${word}\n\n`);
  md.appendCodeblock(entry.syntax, "cpp");
  md.appendMarkdown(`\n${entry.description}`);
  md.appendMarkdown(`\n### Attributes\n\n`);

  md.appendMarkdown(`\n${entry.attributes}`);
  md.appendMarkdown(`\n\n---\n[Official Reference](${url})`);
  md.isTrusted = true;
  return md;
}

function activate(context) {
  // 1. HOVER PROVIDER (For viewing info when hovering over existing code)
  let hoverProvider = vscode.languages.registerHoverProvider("genexpr", {
    provideHover(document, position) {
      const range = document.getWordRangeAtPosition(position);
      const word = document.getText(range);
      const entry = docs[word];

      if (entry) {
        return new vscode.Hover(createDocMarkdown(word, entry));
      }
      return null;
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

          // Attach the rich documentation markdown popup window next to the menu
          item.documentation = createDocMarkdown(word, entry);

          completionItems.push(item);
        }

        return completionItems;
      },
    },
  );

  context.subscriptions.push(hoverProvider, completionProvider);
}

exports.activate = activate;
