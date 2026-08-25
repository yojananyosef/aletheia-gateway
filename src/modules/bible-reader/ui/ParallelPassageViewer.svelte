<script lang="ts">
  import { X, ArrowRight, ArrowUp, FileText, BookOpen } from 'lucide-svelte';
  import type { PassageVersionResult, SectionFootnote } from '../domain/entities/Chapter';
  import type { TranslationId } from '../domain/entities/Translation';
  import type { FontSizeOption } from './FontSizeSelector.svelte';
  import type { BibleHighlight } from '../domain/entities/BibleHighlight';
  import type { PersonalNote } from '../../notes/domain/Note';
  import type { Verse } from '../domain/entities/Verse';
  import { findBookInfo } from '../domain/entities/BibleBooks';
  import ColumnVersionDropdown from './ColumnVersionDropdown.svelte';

  interface Props {
    passages: PassageVersionResult[];
    fontSize?: FontSizeOption;
    highlights?: BibleHighlight[];
    notes?: PersonalNote[];
    onChangeColumnTranslation: (index: number, newTranslationId: TranslationId) => void;
    onRemoveColumn: (index: number) => void;
    onSelectPassage: (ref: string) => void;
    onOpenNoteModal?: (context: {
      reference: string;
      book: string;
      chapter: number;
      verseNumber?: number;
      translationId?: string;
      selectedText: string;
      existingNoteId?: string;
      existingContent?: string;
    }) => void;
  }

  let {
    passages = [],
    fontSize = 'medium',
    highlights = [],
    notes = [],
    onChangeColumnTranslation,
    onRemoveColumn,
    onSelectPassage,
    onOpenNoteModal,
  }: Props = $props();

  const fontSizeClasses: Record<FontSizeOption, string> = {
    'x-small': 'text-size-x-small',
    small: 'text-size-small',
    medium: 'text-size-medium',
    large: 'text-size-large',
    'x-large': 'text-size-x-large',
  };

  function escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getMatchingHighlights(book: string, chapter: number, verse: Verse, translationId: string): BibleHighlight[] {
    const normBook = book.toLowerCase().trim();
    const startNum = verse.number;
    const endNum = verse.endNumber || verse.number;
    return highlights.filter((h) => {
      const matchBook = h.book.toLowerCase().trim() === normBook;
      const matchChapter = h.chapter === chapter;
      const matchVerse = !h.verseNumber || (h.verseNumber >= startNum && h.verseNumber <= endNum);
      const matchTranslation = !h.translationId || h.translationId === '*' || h.translationId === translationId;
      return matchBook && matchChapter && matchVerse && matchTranslation;
    });
  }

  function getVerseNote(book: string, chapter: number, verse: Verse): PersonalNote | undefined {
    const normBook = book.toLowerCase().trim();
    const startNum = verse.number;
    const endNum = verse.endNumber || verse.number;
    return notes.find((n) => {
      const matchBook = n.book.toLowerCase().trim() === normBook;
      const matchChapter = n.chapter === chapter;
      const matchVerse = n.verseNumber !== undefined && n.verseNumber >= startNum && n.verseNumber <= endNum;
      return matchBook && matchChapter && matchVerse;
    });
  }

  function renderVerseText(
    verseText: string,
    verseHighlights: BibleHighlight[]
  ): string {
    if (!verseHighlights || verseHighlights.length === 0) {
      return escapeHtml(verseText);
    }

    type MatchSpan = { start: number; end: number; color: string; id: string; text: string };
    const matches: MatchSpan[] = [];

    for (const h of verseHighlights) {
      if (!h.text) continue;
      const target = h.text.trim();
      if (!target) continue;

      let searchIndex = 0;
      while (searchIndex < verseText.length) {
        const idx = verseText.toLowerCase().indexOf(target.toLowerCase(), searchIndex);
        if (idx === -1) break;
        matches.push({
          start: idx,
          end: idx + target.length,
          color: h.color,
          id: h.id,
          text: verseText.slice(idx, idx + target.length),
        });
        searchIndex = idx + target.length;
      }
    }

    if (matches.length === 0) {
      return escapeHtml(verseText);
    }

    // Sort matches by start position
    matches.sort((a, b) => a.start - b.start);

    // Merge overlapping spans
    const nonOverlapping: MatchSpan[] = [];
    let lastEnd = 0;
    for (const m of matches) {
      if (m.start >= lastEnd) {
        nonOverlapping.push(m);
        lastEnd = m.end;
      }
    }

    let html = '';
    let cursor = 0;
    for (const m of nonOverlapping) {
      if (m.start > cursor) {
        html += escapeHtml(verseText.slice(cursor, m.start));
      }
      html += `<mark class="bible-highlight bible-highlight-${m.color}" data-highlight-id="${escapeHtml(m.id)}">${escapeHtml(m.text)}</mark>`;
      cursor = m.end;
    }
    if (cursor < verseText.length) {
      html += escapeHtml(verseText.slice(cursor));
    }

    return html;
  }

  // Helper to collect all footnotes from all sections of a translation
  function getColumnFootnotes(passage: PassageVersionResult): SectionFootnote[] {
    const list: SectionFootnote[] = [];
    if (passage.sections && passage.sections.length > 0) {
      for (const sec of passage.sections) {
        if (sec.footnotes && sec.footnotes.length > 0) {
          list.push(...sec.footnotes);
        }
      }
    }
    return list;
  }

  // Smooth scroll to footnote item and briefly highlight it
  function handleScrollToFootnote(event: MouseEvent, targetId?: string) {
    event.preventDefault();
    if (!targetId) return;
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('footnote-target-highlight');
      setTimeout(() => {
        el.classList.remove('footnote-target-highlight');
      }, 2500);
    }
  }

  // Smooth scroll back to verse and briefly highlight it
  function handleScrollToVerse(event: MouseEvent, targetId?: string) {
    event.preventDefault();
    if (!targetId) return;
    const el = document.getElementById(targetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('verse-target-highlight');
      setTimeout(() => {
        el.classList.remove('verse-target-highlight');
      }, 2500);
    }
  }
</script>

<div
  class="passage-list-parallel {fontSizeClasses[fontSize] || 'text-size-medium'}"
  style="--version-count: {passages.length || 1};"
>
  {#each passages as passage, index (passage.translationId || index)}
    {@const columnFootnotes = getColumnFootnotes(passage)}
    {@const sections = passage.sections && passage.sections.length > 0 ? passage.sections : [{
      reference: passage.reference,
      book: passage.book || 'Génesis',
      chapter: passage.chapter || 1,
      fullChapterRef: `${passage.book || 'Génesis'} ${passage.chapter || 1}`,
      isPartial: false,
      title: passage.title,
      verses: passage.verses || [],
      footnotes: [],
    }]}

    <article class="translation-block">
      <!-- Column Header: Passage Reference + Close X on top, Full-Width Version Selector below -->
      <div class="column-top-header">
        <div class="column-title-row">
          <span class="column-ref-label truncate">{passage.reference}</span>

          <!-- Close Column Button (X) -->
          {#if passages.length > 1}
            <button
              type="button"
              class="column-close-btn"
              data-tooltip="Cerrar esta columna paralela"
              aria-label="Cerrar columna {passage.translationId}"
              onclick={() => onRemoveColumn(index)}
            >
              <X size={14} />
            </button>
          {/if}
        </div>

        <!-- Custom Neobrutalist Version Selector Dropdown (Full Column Width) -->
        <ColumnVersionDropdown
          currentId={passage.translationId}
          onSelect={(newId) => onChangeColumnTranslation(index, newId)}
        />
      </div>

      <!-- Vertically Stacked Passage Sections -->
      <div class="verses-content">
        {#each sections as section, secIndex}
          <div class="passage-section-card {secIndex > 0 ? 'mt-6 pt-5 border-t-2 border-dashed border-[#1a1a18]/20' : ''}">
            
            <!-- Section Reference Subheader if multi-passage -->
            {#if sections.length > 1}
              <div class="section-ref-badge">
                <span>{section.reference}</span>
              </div>
            {/if}

            <!-- Section Headings if present -->
            {#if section.title && section.title !== section.reference && section.title !== `${section.book} ${section.chapter}`}
              <h3 class="verse-section-heading">{section.title}</h3>
            {/if}

            <!-- Verses Content -->
            <div class="section-verses-list">
              {#each section.verses as verse}
                {@const verseDisplayLabel = verse.verseDisplay || verse.number}
                {@const verseDomId = `verse-${passage.translationId}-${section.book}-${section.chapter}-${verse.number}`}
                {@const verseHighlights = getMatchingHighlights(section.book, section.chapter, verse, passage.translationId)}
                {@const verseNote = getVerseNote(section.book, section.chapter, verse)}

                {#if verse.headings && verse.headings.length > 0 && verse.headings[0] !== section.title}
                  {#each verse.headings as heading}
                    <h3 class="verse-section-heading">{heading}</h3>
                  {/each}
                {/if}

                <p
                  id={verseDomId}
                  class="passage-text"
                  data-book={section.book}
                  data-chapter={section.chapter}
                  data-verse={verse.number}
                  data-verse-display={verseDisplayLabel}
                  data-translation={passage.translationId}
                >
                  <span class="verse-num">{verseDisplayLabel}</span>
                  
                  <span class="verse-text-content">{@html renderVerseText(verse.text, verseHighlights)}</span>

                  <!-- Footnote Link Superscript Anchor with smooth scroll -->
                  {#if verse.footnotes && verse.footnotes.length > 0}
                    {#each verse.footnotes as fn}
                      <a
                        href="#{fn.anchorId}"
                        class="verse-footnote-link"
                        data-tooltip="Ver nota al pie ({fn.caller}) para {section.book} {section.chapter}:{verseDisplayLabel}"
                        onclick={(e) => handleScrollToFootnote(e, fn.anchorId)}
                      >
                        [{fn.caller}]
                      </a>
                    {/each}
                  {/if}

                  <!-- Personal Note Badge/Button on Verse if note exists -->
                  {#if verseNote}
                    <button
                      type="button"
                      class="verse-note-indicator-btn"
                      data-tooltip="Ver nota personal ({verseNote.content.slice(0, 35)}...)"
                      aria-label="Ver nota personal"
                      onclick={() => onOpenNoteModal?.({
                        reference: `${section.book} ${section.chapter}:${verseDisplayLabel}`,
                        book: section.book,
                        chapter: section.chapter,
                        verseNumber: verse.number,
                        translationId: passage.translationId,
                        selectedText: verse.text,
                        existingNoteId: verseNote.id,
                        existingContent: verseNote.content,
                      })}
                    >
                      <FileText size={12} />
                    </button>
                  {/if}
                </p>
              {/each}
            </div>

            <!-- "Read Full Chapter" Neobrutalist Button -->
            {#if section.isPartial}
              <div class="read-full-chapter-box">
                <button
                  type="button"
                  class="read-full-chapter-btn"
                  data-tooltip="Leer el capítulo completo ({section.fullChapterRef})"
                  onclick={() => onSelectPassage(section.fullChapterRef)}
                >
                  <BookOpen size={14} />
                  <span>Leer capítulo completo</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            {/if}
          </div>
        {/each}
      </div>

      <!-- Footnotes Section at the bottom of the Column -->
      {#if columnFootnotes.length > 0}
        <section class="column-footnotes-section">
          <h4 class="column-footnotes-title">Notas al pie</h4>
          <ul class="column-footnotes-list">
            {#each columnFootnotes as fn}
              {@const verseTargetId = `verse-${passage.translationId}-${fn.book}-${fn.chapter}-${fn.verseNum}`}
              {@const bookCode = findBookInfo(fn.book)?.code || fn.book}
              <li id={fn.anchorId} class="column-footnote-row">
                <span class="fn-marker">{fn.caller}</span>
                <span class="fn-ref-badge">{bookCode} {fn.chapter}:{fn.verseNum}</span>
                <span class="fn-text">{fn.text}</span>
                <button
                  type="button"
                  class="fn-backlink-btn"
                  aria-label="Volver al versículo {fn.verseNum}"
                  data-tooltip="Volver al versículo {fn.verseNum}"
                  onclick={(e) => handleScrollToVerse(e, verseTargetId)}
                >
                  <ArrowUp size={13} strokeWidth={2.5} />
                </button>
              </li>
            {/each}
          </ul>
        </section>
      {/if}

      <!-- Column Legal & Copyright Footer -->
      <footer class="column-copyright-footer">
        <div class="copyright-version-name">{passage.translationName} ({passage.shortName || passage.translationId})</div>
        <p class="copyright-legal-text">{passage.copyright}</p>
      </footer>
    </article>
  {/each}
</div>

<style>
  .verse-note-indicator-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    margin-left: 6px;
    vertical-align: middle;
    background-color: var(--accent-attention);
    color: var(--text-main);
    border: 1.5px solid var(--border-color);
    border-radius: 0;
    box-shadow: 1.5px 1.5px 0 var(--border-color);
    cursor: pointer;
    transition: transform 0.08s ease, box-shadow 0.08s ease;
  }

  .verse-note-indicator-btn:hover {
    transform: scale(1.15);
    background-color: var(--accent-desire);
    color: #fff;
    box-shadow: 2px 2px 0 var(--border-color);
  }
</style>
