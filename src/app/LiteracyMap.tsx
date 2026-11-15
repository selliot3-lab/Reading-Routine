/**
 * The founder's "Literacy Development" visual map from her M.Ed. coursework,
 * redrawn in The Reading Routine's style. Same eight components, same arrows,
 * same wording; only the look changed.
 */

type Node = { x: number; y: number; w: number; h: number; title: string; body: string; teach?: string };
type Arrow = {
  from: [number, number];
  to: [number, number];
  width: number;
  label: string;
  /** Where along the arrow (0 to 1) the label sits, so it stays clear of the bubbles. */
  at?: number;
  labelWidth?: number;
  /** For up/down arrows: the height of the visible shaft the label fills. */
  labelHeight?: number;
  both?: boolean;
};

const NODES: Node[] = [
  {
    x: 8, y: 40, w: 318, h: 280, title: "Phonological awareness",
    body: "The ability to identify and manipulate sound structures: words in a sentence, syllables in a word, phonemes (smallest units of sound) in words, beginning and end sounds, rhymes, deletions, segmenting (taking the word apart), blending (putting sounds in a word back together).",
    teach: "Songs, poems, rhymes, oral word games.",
  },
  {
    x: 420, y: 92, w: 342, h: 170, title: "Decoding",
    body: "The translation of phonological skills to text: identifying letters, letter combinations, and the sounds they represent. Blending written sounds allows for reading, whereas segmenting auditory sounds allows for writing.",
    teach: "Phonics activities, blending, segmenting.",
  },
  {
    x: 852, y: 8, w: 316, h: 256, title: "Morphology",
    body: "The study of the structure of words: root words, prefixes and suffixes. Identifying word parts (morphemes) aids with spelling, and studying their meaning can help students infer meaning in new words with similar structures.",
    teach: "Root words, prefixes, suffixes, common spellings, morphologically similar words and their shared meanings.",
  },
  { x: 72, y: 380, w: 214, h: 140, title: "Oral language", body: "Speaking and listening, read-alouds, discussions." },
  {
    x: 430, y: 372, w: 318, h: 206, title: "Fluency",
    body: "Made up of automaticity (speed of word recognition) and prosody (emotion and phrasing).",
    teach: "Sight word activities and repeated readings of short texts: weekly poems, readers' theatre, modelling, choral reading, coaching and repeated practice.",
  },
  {
    x: 4, y: 580, w: 318, h: 296, title: "Reading comprehension",
    body: "Making meaning from written text. Requires readers to use working memory, background knowledge, and inferencing.",
    teach: "High and low-level questioning, story elements, text features and structures, summarizing, visualizing, inferring, making connections. Graphic organizers to activate background knowledge.",
  },
  {
    x: 528, y: 660, w: 280, h: 216, title: "Vocabulary",
    body: "Knowledge of words and their meanings.",
    teach: "Use read-alouds and texts to introduce new words. Use explicit definitions, repeated exposures, and practise use orally. Have discussions with new words!",
  },
  {
    x: 930, y: 548, w: 240, h: 328, title: "Writing",
    body: "Turning thoughts and oral language into text. Involves segmenting sounds, spelling words, building sentences and creating compositions for different audiences and purposes.",
    teach: "Planning, goal-setting, recording, monitoring, revising, publishing, genres, text features. SRSD is an excellent, evidence-based model for strategy instruction.",
  },
];

const ARROWS: Arrow[] = [
  { from: [300, 160], to: [440, 160], width: 74, label: "P.A. skills are necessary for decoding to happen.", at: 0.48, labelWidth: 84 },
  { from: [870, 160], to: [745, 160], width: 66, label: "Recognition of morphemes increases decoding speed.", at: 0.5, labelWidth: 96 },
  { from: [590, 250], to: [590, 385], width: 100, label: "As decoding speed increases, word recognition becomes more automatic. Automaticity builds fluency.", at: 0.5, labelHeight: 104 },
  { from: [180, 392], to: [180, 300], width: 66, label: "Oral language builds P.A.", at: 0.5, labelHeight: 56 },
  { from: [272, 432], to: [448, 432], width: 96, label: "Listening to text and practising reading it aloud develops prosody. Repeated readings increase reading speed. Both are needed for fluent reading.", at: 0.5, labelWidth: 150 },
  { from: [180, 508], to: [180, 600], width: 112, label: "Talking before, during and after reading builds comprehension.", at: 0.5, labelHeight: 56 },
  { from: [660, 250], to: [985, 575], width: 62, label: "Segmenting phonemes, translating them to graphemes and re-blending to read back.", at: 0.3, labelWidth: 170 },
  { from: [1035, 258], to: [1035, 570], width: 76, label: "Knowledge of morphemes aids in spelling.", at: 0.5, labelHeight: 80 },
  { from: [990, 262], to: [735, 672], width: 62, label: "Knowing morpheme meanings helps infer new words with shared morphemes, building vocabulary.", at: 0.72, labelWidth: 170 },
  { from: [500, 520], to: [295, 650], width: 78, label: "Slow reading overloads working memory, making meaning hard to hold onto.", at: 0.76, labelWidth: 104 },
  { from: [250, 500], to: [560, 700], width: 62, label: "Vocabulary is best built through repeated oral language experiences in many contexts.", at: 0.68, labelWidth: 124 },
  { from: [628, 676], to: [628, 560], width: 84, label: "Vocabulary knowledge speeds up word recognition and reading.", at: 0.55, labelHeight: 74 },
  { from: [300, 772], to: [552, 772], width: 116, both: true, label: "Knowing what words mean helps readers understand the whole text; understanding most of a text lets readers infer new words and grow their vocabulary.", at: 0.5, labelWidth: 170 },
  { from: [790, 752], to: [952, 752], width: 96, label: "A large vocabulary lets writers express ideas more precisely and with more depth.", at: 0.5, labelWidth: 120 },
];

function arrowPath(a: Arrow): string {
  const [x1, y1] = a.from;
  const [x2, y2] = a.to;
  const len = Math.hypot(x2 - x1, y2 - y1);
  const ux = (x2 - x1) / len;
  const uy = (y2 - y1) / len;
  const nx = -uy;
  const ny = ux;
  const half = a.width / 2;
  const head = Math.min(a.width * 0.9, len * 0.4);
  const headHalf = a.width * 0.85;
  const pt = (x: number, y: number) => `${x.toFixed(1)},${y.toFixed(1)}`;
  const bx = x2 - ux * head;
  const by = y2 - uy * head;
  const ax = a.both ? x1 + ux * head : x1;
  const ay = a.both ? y1 + uy * head : y1;
  const pts = [
    ...(a.both ? [pt(x1, y1), pt(ax + nx * headHalf, ay + ny * headHalf)] : []),
    pt(ax + nx * half, ay + ny * half),
    pt(bx + nx * half, by + ny * half),
    pt(bx + nx * headHalf, by + ny * headHalf),
    pt(x2, y2),
    pt(bx - nx * headHalf, by - ny * headHalf),
    pt(bx - nx * half, by - ny * half),
    pt(ax - nx * half, ay - ny * half),
    ...(a.both ? [pt(ax - nx * headHalf, ay - ny * headHalf)] : []),
  ];
  return `M${pts.join(" L")} Z`;
}

function ArrowLabel({ a }: { a: Arrow }) {
  const [x1, y1] = a.from;
  const [x2, y2] = a.to;
  const t = a.at ?? 0.5;
  const cx = x1 + (x2 - x1) * t;
  const cy = y1 + (y2 - y1) * t;
  let angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
  if (angle > 90) angle -= 180;
  if (angle < -90) angle += 180;
  // Up/down arrows keep their words level, like the original map.
  const upright = Math.abs(angle) > 60;
  if (upright) angle = 0;
  const w = upright ? a.width - 10 : (a.labelWidth ?? 120);
  const h = upright ? (a.labelHeight ?? 90) : a.width - 6;
  return (
    <g transform={`translate(${cx} ${cy}) rotate(${angle})`}>
      <foreignObject x={-w / 2} y={-h / 2} width={w} height={h}>
        <div className="lm-arrow-label">{a.label}</div>
      </foreignObject>
    </g>
  );
}

export function LiteracyMap() {
  return (
    <div className="lm-wrap">
      <svg viewBox="0 0 1176 884" className="lm-svg" role="img" aria-labelledby="lm-title lm-desc">
        <title id="lm-title">Literacy development map</title>
        <desc id="lm-desc">
          Eight connected parts of literacy: oral language, phonological awareness, decoding, morphology, fluency, vocabulary,
          reading comprehension and writing, with arrows showing how each one builds the others.
        </desc>
        <text x="588" y="62" textAnchor="middle" className="lm-title">
          Literacy Development
        </text>
        {ARROWS.map((a, i) => (
          <path key={`a${i}`} d={arrowPath(a)} className="lm-arrow" />
        ))}
        {NODES.map((n) => (
          <g key={n.title}>
            <rect x={n.x} y={n.y} width={n.w} height={n.h} rx={Math.min(n.w, n.h) / 2.6} className="lm-node" />
            <foreignObject x={n.x + 18} y={n.y + 14} width={n.w - 36} height={n.h - 28}>
              <div className="lm-node-inner">
                <div className="lm-node-title">{n.title}</div>
                <div className="lm-node-body">{n.body}</div>
                {n.teach && (
                  <div className="lm-node-body">
                    <strong>Teach:</strong> {n.teach}
                  </div>
                )}
              </div>
            </foreignObject>
          </g>
        ))}
        {ARROWS.map((a, i) => (
          <ArrowLabel key={`l${i}`} a={a} />
        ))}
      </svg>
    </div>
  );
}
