const vscode = require("vscode");

const REF_BASE = "https://docs.cycling74.com/reference/";

const genDocs = {
  // --- CORE & DECLARATIONS ---
  History: {
    cat: "dsp",
    syntax: "history name(initialValue);",
    desc: "Declares a single-sample delay (Z-1) to create feedback loops or integrators.",
  },
  Param: {
    cat: "common",
    syntax: "param name(default, [min, max]);",
    desc: "Declares a named parameter that can be controlled from the Max patcher UI.",
  },
  Buffer: {
    cat: "dsp",
    syntax: "buffer name;",
    desc: "References an external buffer~ object for reading and writing audio data.",
  },
  Data: {
    cat: "dsp",
    syntax: "data name(size, [channels]);",
    desc: "Declares a local memory array (64-bit floats) internal to the Gen object.",
  },
  in: {
    cat: "common",
    syntax: "in1, in2...",
    desc: "Input signal (gen~) or matrix plane (jit.gen).",
  },
  out: {
    cat: "common",
    syntax: "out1 = ...;",
    desc: "Output signal (gen~) or matrix plane (jit.gen).",
  },

  // --- COMMON MATH OPERATORS ---
  abs: {
    cat: "common",
    syntax: "abs(x);",
    desc: "Returns the absolute (positive) value of the input.",
  },
  acos: { cat: "common", syntax: "acos(x);", desc: "Arc cosine of x." },
  asin: { cat: "common", syntax: "asin(x);", desc: "Arc sine of x." },
  atan: { cat: "common", syntax: "atan(x);", desc: "Arc tangent of x." },
  atan2: {
    cat: "common",
    syntax: "atan2(y, x);",
    desc: "Arc tangent of y/x using signs to determine the quadrant.",
  },
  ceil: {
    cat: "common",
    syntax: "ceil(x);",
    desc: "Smallest integer value greater than or equal to x.",
  },
  clamp: {
    cat: "common",
    syntax: "clamp(x, min, max);",
    desc: "Restricts x to the range [min, max].",
  },
  cos: { cat: "common", syntax: "cos(x);", desc: "Cosine of x (radians)." },
  cosh: { cat: "common", syntax: "cosh(x);", desc: "Hyperbolic cosine of x." },
  exp: {
    cat: "common",
    syntax: "exp(x);",
    desc: "e raised to the power of x.",
  },
  floor: {
    cat: "common",
    syntax: "floor(x);",
    desc: "Largest integer value less than or equal to x.",
  },
  hypot: {
    cat: "common",
    syntax: "hypot(x, y);",
    desc: "Returns the length of the hypotenuse (sqrt(x*x + y*y)).",
  },
  log: {
    cat: "common",
    syntax: "log(x);",
    desc: "Natural logarithm (base e).",
  },
  log10: { cat: "common", syntax: "log10(x);", desc: "Base-10 logarithm." },
  max: {
    cat: "common",
    syntax: "max(a, b);",
    desc: "Returns the greater of two values.",
  },
  min: {
    cat: "common",
    syntax: "min(a, b);",
    desc: "Returns the lesser of two values.",
  },
  mix: {
    cat: "common",
    syntax: "mix(a, b, t);",
    desc: "Linear interpolation between a and b based on t (0-1).",
  },
  pow: {
    cat: "common",
    syntax: "pow(base, exp);",
    desc: "Returns base raised to the power of exp.",
  },
  scale: {
    cat: "common",
    syntax: "scale(x, iL, iH, oL, oH, [exp]);",
    desc: "Maps an input value to a new output range.",
  },
  sin: { cat: "common", syntax: "sin(x);", desc: "Sine of x (radians)." },
  sqrt: { cat: "common", syntax: "sqrt(x);", desc: "Square root of x." },
  tan: { cat: "common", syntax: "tan(x);", desc: "Tangent of x (radians)." },

  // --- GEN~ (DSP) OPERATORS ---
  cycle: {
    cat: "dsp",
    syntax: "cycle(freq, [phase]);",
    desc: "Wavetable oscillator. Defaults to a sine wave if no buffer is named.",
  },
  delay: {
    cat: "dsp",
    syntax: "delay(x, samples, [feedback]);",
    desc: "A simple delay line. Max delay must be fixed if using params.",
  },
  delta: {
    cat: "dsp",
    syntax: "delta(x);",
    desc: "Returns the sample-to-sample difference (x - history_x).",
  },
  noise: {
    cat: "dsp",
    syntax: "noise();",
    desc: "Generates white noise (uniform distribution between -1 and 1).",
  },
  phasor: {
    cat: "dsp",
    syntax: "phasor(freq);",
    desc: "Non-bandlimited sawtooth ramp from 0 to 1.",
  },
  peek: {
    cat: "dsp",
    syntax: "peek(buffer, index, [channel]);",
    desc: "Reads a value from a buffer/data at a specific sample index.",
  },
  poke: {
    cat: "dsp",
    syntax: "poke(buffer, val, index, [channel]);",
    desc: "Writes a value into a buffer/data at a specific sample index.",
  },
  sah: {
    cat: "dsp",
    syntax: "sah(input, threshold, [mode]);",
    desc: "Sample and hold: captures input when trigger crosses threshold.",
  },
  train: {
    cat: "dsp",
    syntax: "train(period, [width]);",
    desc: "Generates a pulse train (0 or 1) based on period in samples.",
  },

  // --- GEN JITTER OPERATORS ---
  cell: {
    cat: "jitter",
    syntax: "cell;",
    desc: "The integer coordinates of the current matrix cell.",
  },
  dim: {
    cat: "jitter",
    syntax: "dim;",
    desc: "The dimensions (width, height, etc.) of the input matrix.",
  },
  norm: {
    cat: "jitter",
    syntax: "norm;",
    desc: "Normalized coordinates [0, 1] for the current cell.",
  },
  snorm: {
    cat: "jitter",
    syntax: "snorm;",
    desc: "Signed normalized coordinates [-1, 1] for the current cell.",
  },
  sample: {
    cat: "jitter",
    syntax: "sample(in, coord, [boundmode]);",
    desc: "Samples a matrix at normalized coordinates with interpolation.",
  },
  nearest: {
    cat: "jitter",
    syntax: "nearest(in, coord, [boundmode]);",
    desc: "Samples a matrix at normalized coordinates using nearest-neighbor.",
  },
  swiz: {
    cat: "jitter",
    syntax: "swiz(vector, ...indices);",
    desc: "Extracts or reorders components of a vector (e.g. swiz(in1, 2, 1, 0)).",
  },
  dot: {
    cat: "jitter",
    syntax: "dot(a, b);",
    desc: "Returns the dot product of two vectors.",
  },
  length: {
    cat: "jitter",
    syntax: "length(v);",
    desc: "Returns the magnitude (length) of a vector.",
  },
  normalize: {
    cat: "jitter",
    syntax: "normalize(v);",
    desc: "Returns a vector with the same direction but length 1.",
  },

  // --- CONVERSION & UTILITY ---
  mtof: {
    cat: "common",
    syntax: "mtof(midi);",
    desc: "MIDI note to Frequency (Hz).",
  },
  ftom: {
    cat: "common",
    syntax: "ftom(hz);",
    desc: "Frequency (Hz) to MIDI note.",
  },
  atodb: {
    cat: "common",
    syntax: "atodb(amp);",
    desc: "Linear amplitude to Decibels.",
  },
  dbtoa: {
    cat: "common",
    syntax: "dbtoa(db);",
    desc: "Decibels to Linear amplitude.",
  },
  mstosamps: {
    cat: "dsp",
    syntax: "mstosamps(ms);",
    desc: "Milliseconds to number of samples based on sample rate.",
  },
  sampstoms: {
    cat: "dsp",
    syntax: "sampstoms(samples);",
    desc: "Number of samples to milliseconds.",
  },
};

// function activate(context) {
//   let hoverProvider = vscode.languages.registerHoverProvider("genexpr", {
//     provideHover(document, position) {
//       const range = document.getWordRangeAtPosition(position);
//       const word = document.getText(range);
//       const entry = genDocs[word];

//       if (entry) {
//         const prefix = `gen_${entry.cat}`;
//         const url = `${REF_BASE}${prefix}_${word}`;

//         const hoverText = new vscode.MarkdownString();
//         hoverText.appendMarkdown(`### ${word}\n\n`);
//         hoverText.appendCodeblock(entry.syntax, "cpp");
//         hoverText.appendMarkdown(`\n${entry.desc}`);
//         hoverText.appendMarkdown(`\n\n---\n[Official Reference](${url})`);

//         hoverText.isTrusted = true;
//         return new vscode.Hover(hoverText);
//       }
//       return null;
//     },
//   });

//   context.subscriptions.push(hoverProvider);
// }
function createDocMarkdown(word, entry) {
  const prefix = `gen_${entry.cat}`;
  const url = `${REF_BASE}${prefix}_${word}`;

  const md = new vscode.MarkdownString();
  md.appendMarkdown(`### ${word}\n\n`);
  md.appendCodeblock(entry.syntax, "cpp");
  md.appendMarkdown(`\n${entry.desc}`);
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
      const entry = genDocs[word];

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

        for (const [word, entry] of Object.entries(genDocs)) {
          // Create a dynamic auto-complete item
          const item = new vscode.CompletionItem(
            word,
            vscode.CompletionItemKind.Function,
          );

          // Inject the snippet syntax so pressing 'Tab' auto-fills parameters
          item.insertText = new vscode.SnippetString(entry.snippet);

          // Add short preview text in the menu list
          item.detail = entry.syntax;

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
