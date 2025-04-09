/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable prefer-destructuring */
/* eslint-disable max-len */
/* eslint-disable prettier/prettier */
/* eslint-disable max-lines-per-function */

import { color } from './color';

export const INVERTED_DEFAULT_COLOR = 257;
export const TERMINAL_CLASS_PREFIX = 'xterm-dom-renderer-owner-';
export const ROW_CONTAINER_CLASS = 'xterm-rows';
export const FG_CLASS_PREFIX = 'xterm-fg-';
export const BG_CLASS_PREFIX = 'xterm-bg-';
export const FOCUS_CLASS = 'xterm-focus';
export const SELECTION_CLASS = 'xterm-selection';

export const enum RowCss {
  BOLD_CLASS = 'xterm-bold',
  DIM_CLASS = 'xterm-dim',
  ITALIC_CLASS = 'xterm-italic',
  UNDERLINE_CLASS = 'xterm-underline',
  OVERLINE_CLASS = 'xterm-overline',
  STRIKETHROUGH_CLASS = 'xterm-strikethrough',
  CURSOR_CLASS = 'xterm-cursor',
  CURSOR_BLINK_CLASS = 'xterm-cursor-blink',
  CURSOR_STYLE_BLOCK_CLASS = 'xterm-cursor-block',
  CURSOR_STYLE_OUTLINE_CLASS = 'xterm-cursor-outline',
  CURSOR_STYLE_BAR_CLASS = 'xterm-cursor-bar',
  CURSOR_STYLE_UNDERLINE_CLASS = 'xterm-cursor-underline',
}

export function makeCss(renderer: any, terminalSelector: string) {
  const colors = renderer._themeService.colors;
  const themeStyleElement = document.createElement('style')

  // Base CSS
  let styles =
    `..${terminalSelector} .${ROW_CONTAINER_CLASS} {` +
    // Disabling pointer events circumvents a browser behavior that prevents `click` events from
    // being delivered if the target element is replaced during the click. This happened due to
    // refresh() being called during the mousedown handler to start a selection.
    ' pointer-events: none;' +
    ` color: ${colors.foreground.css};` +
    ` font-family: ${renderer._optionsService.rawOptions.fontFamily};` +
    ` font-size: ${renderer._optionsService.rawOptions.fontSize}px;` +
    ' font-kerning: none;' +
    ' white-space: pre' +
    '}';
  styles +=
    `..${terminalSelector} .${ROW_CONTAINER_CLASS} .xterm-dim {` +
    ` color: ${color.multiplyOpacity(colors.foreground, 0.5).css};` +
    '}';
  // Text styles
  styles +=
    `.${terminalSelector} span:not(.${RowCss.BOLD_CLASS}) {` +
    ` font-weight: ${renderer._optionsService.rawOptions.fontWeight};` +
    '}' +
    `.${terminalSelector} span.${RowCss.BOLD_CLASS} {` +
    ` font-weight: ${renderer._optionsService.rawOptions.fontWeightBold};` +
    '}' +
    `.${terminalSelector} span.${RowCss.ITALIC_CLASS} {` +
    ' font-style: italic;' +
    '}';
  // Blink animation
  const blinkAnimationUnderlineId = `blink_underline_${renderer._terminalClass}`;
  const blinkAnimationBarId = `blink_bar_${renderer._terminalClass}`;
  const blinkAnimationBlockId = `blink_block_${renderer._terminalClass}`;
  styles +=
    `@keyframes ${blinkAnimationUnderlineId} {` +
    ' 50% {' +
    '  border-bottom-style: hidden;' +
    ' }' +
    '}';
  styles +=
    `@keyframes ${blinkAnimationBarId} {` +
    ' 50% {' +
    '  box-shadow: none;' +
    ' }' +
    '}';
  styles +=
    `@keyframes ${blinkAnimationBlockId} {` +
    ' 0% {' +
    `  background-color: ${colors.cursor.css};` +
    `  color: ${colors.cursorAccent.css};` +
    ' }' +
    ' 50% {' +
    '  background-color: inherit;' +
    `  color: ${colors.cursor.css};` +
    ' }' +
    '}';
  // Cursor
  styles +=
    `.${terminalSelector} .${ROW_CONTAINER_CLASS}.${FOCUS_CLASS} .${RowCss.CURSOR_CLASS}.${RowCss.CURSOR_BLINK_CLASS}.${RowCss.CURSOR_STYLE_UNDERLINE_CLASS} {` +
    ` animation: ${blinkAnimationUnderlineId} 1s step-end infinite;` +
    '}' +
    `.${terminalSelector} .${ROW_CONTAINER_CLASS}.${FOCUS_CLASS} .${RowCss.CURSOR_CLASS}.${RowCss.CURSOR_BLINK_CLASS}.${RowCss.CURSOR_STYLE_BAR_CLASS} {` +
    ` animation: ${blinkAnimationBarId} 1s step-end infinite;` +
    '}' +
    `.${terminalSelector} .${ROW_CONTAINER_CLASS}.${FOCUS_CLASS} .${RowCss.CURSOR_CLASS}.${RowCss.CURSOR_BLINK_CLASS}.${RowCss.CURSOR_STYLE_BLOCK_CLASS} {` +
    ` animation: ${blinkAnimationBlockId} 1s step-end infinite;` +
    '}' +
    // !important helps fix an issue where the cursor will not render on top of the selection,
    // however it's very hard to fix this issue and retain the blink animation without the use of
    // !important. So this edge case fails when cursor blink is on.
    `.${terminalSelector} .${ROW_CONTAINER_CLASS} .${RowCss.CURSOR_CLASS}.${RowCss.CURSOR_STYLE_BLOCK_CLASS} {` +
    ` background-color: ${colors.cursor.css};` +
    ` color: ${colors.cursorAccent.css};` +
    '}' +
    `.${terminalSelector} .${ROW_CONTAINER_CLASS} .${RowCss.CURSOR_CLASS}.${RowCss.CURSOR_STYLE_BLOCK_CLASS}:not(.${RowCss.CURSOR_BLINK_CLASS}) {` +
    ` background-color: ${colors.cursor.css} !important;` +
    ` color: ${colors.cursorAccent.css} !important;` +
    '}' +
    `.${terminalSelector} .${ROW_CONTAINER_CLASS} .${RowCss.CURSOR_CLASS}.${RowCss.CURSOR_STYLE_OUTLINE_CLASS} {` +
    ` outline: 1px solid ${colors.cursor.css};` +
    ' outline-offset: -1px;' +
    '}' +
    `.${terminalSelector} .${ROW_CONTAINER_CLASS} .${RowCss.CURSOR_CLASS}.${RowCss.CURSOR_STYLE_BAR_CLASS} {` +
    ` box-shadow: ${renderer._optionsService.rawOptions.cursorWidth}px 0 0 ${colors.cursor.css} inset;` +
    '}' +
    `.${terminalSelector} .${ROW_CONTAINER_CLASS} .${RowCss.CURSOR_CLASS}.${RowCss.CURSOR_STYLE_UNDERLINE_CLASS} {` +
    ` border-bottom: 1px ${colors.cursor.css};` +
    ' border-bottom-style: solid;' +
    ' height: calc(100% - 1px);' +
    '}';
  // Selection
  styles +=
    `.${terminalSelector} .${SELECTION_CLASS} {` +
    ' position: absolute;' +
    ' top: 0;' +
    ' left: 0;' +
    ' z-index: 1;' +
    ' pointer-events: none;' +
    '}' +
    `.${terminalSelector}.focus .${SELECTION_CLASS} div {` +
    ' position: absolute;' +
    ` background-color: ${colors.selectionBackgroundOpaque.css};` +
    '}' +
    `.${terminalSelector} .${SELECTION_CLASS} div {` +
    ' position: absolute;' +
    ` background-color: ${colors.selectionInactiveBackgroundOpaque.css};` +
    '}';
  // Colors
  for (const [i, c] of colors.ansi.entries()) {
    styles +=
      `.${terminalSelector} .${FG_CLASS_PREFIX}${i} { color: ${c.css}; }` +
      `.${terminalSelector} .${FG_CLASS_PREFIX}${i}.${RowCss.DIM_CLASS} { color: ${color.multiplyOpacity(c, 0.5).css}; }` +
      `.${terminalSelector} .${BG_CLASS_PREFIX}${i} { background-color: ${c.css}; }`;
  }
  styles +=
    `.${terminalSelector} .${FG_CLASS_PREFIX}${INVERTED_DEFAULT_COLOR} { color: ${color.opaque(colors.background).css}; }` +
    `.${terminalSelector} .${FG_CLASS_PREFIX}${INVERTED_DEFAULT_COLOR}.${RowCss.DIM_CLASS} { color: ${color.multiplyOpacity(color.opaque(colors.background), 0.5).css}; }` +
    `.${terminalSelector} .${BG_CLASS_PREFIX}${INVERTED_DEFAULT_COLOR} { background-color: ${colors.foreground.css}; }`;

  themeStyleElement.textContent = styles;

  return themeStyleElement;
}
