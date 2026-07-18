import { TemplateStyle } from "../types";

export const TEMPLATE_STYLES: TemplateStyle[] = [
  {
    id: "style-night",
    name: "🌸 Serunai Merah Muda (Blossom Pink)",
    bgClass: "bg-gradient-to-br from-rose-50 via-pink-100 to-amber-50 text-rose-950 border border-rose-200/60 shadow-lg",
    textClass: "text-rose-950 placeholder-rose-400/60",
    fontClass: "font-serif",
    borderClass: "border-rose-300/50"
  },
  {
    id: "style-cosmic",
    name: "✨ Embun Pagi (Morning Dew)",
    bgClass: "bg-gradient-to-br from-indigo-50 via-violet-100 to-sky-100 text-indigo-950 border border-violet-200/60 shadow-lg",
    textClass: "text-indigo-950 placeholder-violet-400/60",
    fontClass: "font-sans",
    borderClass: "border-violet-300/50"
  },
  {
    id: "style-sunset",
    name: "🌅 Mentari Cerah (Sunny Sunset)",
    bgClass: "bg-gradient-to-br from-amber-50 via-orange-100 to-yellow-50 text-amber-950 border border-amber-200/60 shadow-lg",
    textClass: "text-amber-950 placeholder-amber-400/60",
    fontClass: "font-sans",
    borderClass: "border-amber-300/50"
  },
  {
    id: "style-forest",
    name: "🍃 Padang Hijau (Meadow Breeze)",
    bgClass: "bg-gradient-to-br from-emerald-50 via-teal-100 to-stone-50 text-emerald-950 border border-emerald-200/60 shadow-lg",
    textClass: "text-emerald-950 placeholder-emerald-400/60",
    fontClass: "font-mono",
    borderClass: "border-emerald-300/50"
  },
  {
    id: "style-ocean",
    name: "🌊 Biru Samudra (Ocean Breeze)",
    bgClass: "bg-gradient-to-br from-cyan-50 via-sky-100 to-blue-50 text-cyan-950 border border-cyan-200/60 shadow-lg",
    textClass: "text-cyan-950 placeholder-cyan-400/60",
    fontClass: "font-serif",
    borderClass: "border-cyan-300/50"
  },
  {
    id: "style-minimal-dark",
    name: "🤍 Minimalis Bersih (Pure White)",
    bgClass: "bg-white text-slate-800 border border-slate-200 shadow-lg",
    textClass: "text-slate-800 placeholder-slate-400",
    fontClass: "font-mono",
    borderClass: "border-slate-200"
  }
];

export const SIZE_DIMENSIONS = {
  SQUARE: "aspect-square w-full max-w-[420px] p-8",
  PORTRAIT: "aspect-[9/16] w-full max-w-[360px] p-8 min-h-[520px]",
  LANDSCAPE: "aspect-[16/9] w-full max-w-[560px] p-6 md:p-8"
};

export const FONT_PAIRINGS = {
  QUOTE: {
    title: "font-sans tracking-widest uppercase text-xs opacity-60 font-semibold",
    body: "font-serif text-lg md:text-xl italic leading-relaxed text-center",
    author: "font-sans text-xs tracking-wider opacity-85 text-center mt-4"
  },
  FREE_TEXT: {
    title: "font-sans font-bold text-base md:text-lg border-b pb-1 mb-3",
    body: "font-sans text-sm md:text-base leading-relaxed text-left",
    author: "font-serif text-xs italic text-right mt-4"
  },
  POETRY: {
    title: "font-serif font-bold text-lg md:text-xl text-center mb-4",
    body: "font-serif text-sm md:text-base leading-loose text-center whitespace-pre-wrap",
    author: "font-serif text-xs tracking-widest text-center mt-6"
  },
  PANTUN: {
    title: "font-sans font-semibold tracking-wider text-center text-sm uppercase opacity-75 mb-3",
    body: "font-serif text-sm md:text-base leading-extra-loose text-center italic whitespace-pre-wrap",
    author: "font-sans text-xs text-center mt-6"
  },
  SONG_LYRIC: {
    title: "font-mono font-bold text-base text-center tracking-wide mb-3",
    body: "font-mono text-xs md:text-sm leading-relaxed text-center whitespace-pre-wrap",
    author: "font-mono text-xs text-center opacity-75 mt-4"
  }
};
