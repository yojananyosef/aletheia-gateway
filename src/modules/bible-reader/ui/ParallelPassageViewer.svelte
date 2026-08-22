<script lang="ts">
  import { X, ArrowRight } from 'lucide-svelte';
  import type { PassageVersionResult, SectionFootnote } from '../domain/entities/Chapter';
  import type { TranslationId } from '../domain/entities/Translation';
  import type { FontSizeOption } from './FontSizeSelector.svelte';
  import ColumnVersionDropdown from './ColumnVersionDropdown.svelte';

  interface Props {
    passages: PassageVersionResult[];
    fontSize?: FontSizeOption;
    onChangeColumnTranslation: (index: number, newTranslationId: TranslationId) => void;
    onRemoveColumn: (index: number) => void;
    onSelectPassage: (ref: string) => void;
  }

  let {
    passages = [],
    fontSize = 'medium',
    onChangeColumnTranslation,
    onRemoveColumn,
    onSelectPassage,
  }: Props = $props();

  const fontSizeClasses: Record<FontSizeOption, string> = {
    'x-small': 'text-size-x-small',
    small: 'text-size-small',
    medium: 'text-size-medium',
    large: 'text-size-large',
    'x-large': 'text-size-x-large',
  };

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
</script>

<div
  class="passage-list-parallel {fontSizeClasses[fontSize] || 'text-size-medium'}"
  style="--version-count: {passages.length || 1};"
>
  {#each passages as passage, index}
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
              title="Cerrar esta columna paralela"
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

      <!-- Vertically Stacked Passage Sections (BibleGateway Multi-Passage style) -->
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
                {#if verse.headings && verse.headings.length > 0 && verse.headings[0] !== section.title}
                  {#each verse.headings as heading}
                    <h3 class="verse-section-heading">{heading}</h3>
                  {/each}
                {/if}

                <p class="passage-text">
                  <span class="verse-num">{verse.number}</span>
                  {verse.text}

                  <!-- Footnote Link Superscript Anchor -->
                  {#if verse.footnotes && verse.footnotes.length > 0}
                    {#each verse.footnotes as fn}
                      {@const fnAnchorId = `fn-${passage.translationId}-${section.book}-${section.chapter}-${verse.number}-${fn.id}`}
                      <a
                        href="#{fnAnchorId}"
                        class="verse-footnote-link"
                        title="Ver nota al pie ({fn.caller}) para {section.book} {section.chapter}:{verse.number}"
                      >
                        [{fn.caller}]
                      </a>
                    {/each}
                  {/if}
                </p>
              {/each}
            </div>

            <!-- "Read Full Chapter" link (BibleGateway style for partial search) -->
            {#if section.isPartial}
              <div class="read-full-chapter-box">
                <button
                  type="button"
                  class="read-full-chapter-link"
                  title="Leer el capítulo completo ({section.fullChapterRef})"
                  onclick={() => onSelectPassage(section.fullChapterRef)}
                >
                  <span>Leer el capítulo completo</span>
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
              <li id={fn.anchorId} class="column-footnote-row">
                <span class="fn-marker">{fn.caller}</span>
                <span class="fn-ref">{fn.book} {fn.chapter}:{fn.verseNum}</span>
                <span class="fn-text">{fn.text}</span>
              </li>
            {/each}
          </ul>
        </section>
      {/if}

      <!-- Column Legal & Copyright Footer (BibleGateway style) -->
      <footer class="column-copyright-footer">
        <div class="copyright-version-name">{passage.translationName} ({passage.shortName || passage.translationId})</div>
        <p class="copyright-legal-text">{passage.copyright}</p>
      </footer>
    </article>
  {/each}
</div>
