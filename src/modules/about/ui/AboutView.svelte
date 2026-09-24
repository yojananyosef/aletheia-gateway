<script lang="ts">
  import { BookOpen, Database, Scale, ShieldCheck } from 'lucide-svelte';
  import { AVAILABLE_TRANSLATIONS, type TranslationInfo } from '../../bible-reader/domain/entities/Translation';

  const translations = Object.values(AVAILABLE_TRANSLATIONS) as TranslationInfo[];
  const byLanguage = translations.reduce<Record<string, TranslationInfo[]>>((acc, t) => {
    const lang = t.languageName || t.language;
    (acc[lang] ||= []).push(t);
    return acc;
  }, {});
  const languages = Object.keys(byLanguage).sort();
</script>

<div class="about-view">
  <div class="about-header">
    <div class="about-titles">
      <h2>Acerca de</h2>
      <span>AletheiaGateway · La verdad en la Palabra</span>
    </div>
  </div>

  <section class="about-card">
    <h3><BookOpen size={16} /> Qué es este proyecto</h3>
    <p>
      AletheiaGateway es un lector y una herramienta de estudio bíblico: lectura en varias
      versiones, interlineal hebreo/griego con morfología, diccionario Strong, concordancia,
      comentarios y planes de lectura. Los datos viven en el proyecto y se validan
      versículo por versículo contra fuentes de referencia.
    </p>
    <p>
      Este proyecto fue inspirado por BibleGateway y por LogosKLogos.
    </p>
  </section>

  <section class="about-card">
    <h3><Database size={16} /> Versiones bíblicas incluidas</h3>
    {#each languages as lang}
      <h4>{lang}</h4>
      <ul>
        {#each byLanguage[lang] as t}
          <li>
            <strong>{t.name}</strong>
            {#if t.copyright}<span class="about-copy"> · {t.copyright}</span>{/if}
            {#if t.description}<span class="about-desc"> — {t.description}</span>{/if}
          </li>
        {/each}
      </ul>
    {/each}
  </section>

  <section class="about-card">
    <h3><ShieldCheck size={16} /> Fuentes del interlineal y créditos</h3>
    <ul>
      <li>
        <strong>Texto griego:</strong> 8.ª edición de Tischendorf, con morfología, Strong y lemas.
        Dominio público. Base de G. Clint Yale, análisis de Dr. Maurice A. Robinson
        (Westcott-Hort), edición de Ulrik Sandborg-Petersen.
      </li>
      <li>
        <strong>Texto hebreo:</strong> tradición del Códice de Leningrado (WLC), vía
        Open Scriptures Hebrew Bible.
      </li>
      <li>
        <strong>Léxicos y códigos morfológicos:</strong> datos de STEPBible (Tyndale House),
        licencia CC BY 4.0 — crédito a STEP Bible (stepbible.org).
      </li>
    </ul>
  </section>

  <section class="about-card">
    <h3><Scale size={16} /> Licencias</h3>
    <p>
      Los textos en dominio público (Tischendorf, WLC) pueden copiarse libremente. Los datos
      de STEPBible se usan bajo CC BY 4.0 con el crédito correspondiente. Las traducciones
      modernas conservan los derechos de sus respectivos editores según se indica arriba.
    </p>
  </section>
</div>

<style>
  .about-view {
    width: 100%;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .about-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 2px;
  }

  .about-titles h2 {
    margin: 0;
    font-family: var(--font-display);
    font-size: 1.375rem;
    font-weight: 900;
  }

  .about-titles span {
    color: var(--text-main);
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    font-weight: 800;
  }

  .about-card {
    padding: 14px 16px;
    background: var(--bg-surface);
    border: 3px solid var(--border-color);
    box-shadow: 5px 5px 0 var(--border-color);
  }

  .about-card h3 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 8px;
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    font-weight: 900;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .about-card h4 {
    margin: 12px 0 4px;
    font-size: 0.875rem;
    font-weight: 800;
  }

  .about-card p {
    margin: 0;
    font-size: 0.9375rem;
    line-height: 1.6;
  }

  .about-card p + p {
    margin-top: 8px;
  }

  .about-card ul {
    margin: 0;
    padding-left: 18px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 0.875rem;
    line-height: 1.55;
  }

  .about-copy {
    color: var(--text-muted);
    font-size: 0.8125rem;
  }

  .about-desc {
    color: var(--text-muted);
  }
</style>
