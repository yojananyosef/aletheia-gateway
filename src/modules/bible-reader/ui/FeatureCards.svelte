<script lang="ts">
  import { BookOpen, Heart, Headphones, ArrowRight } from 'lucide-svelte';

  interface Props {
    onSelectPassage: (ref: string) => void;
  }

  let { onSelectPassage }: Props = $props();
</script>

<section class="home-cards">
  <button
    type="button"
    class="feature-card feature-blue"
    onclick={() => onSelectPassage('Génesis 1:1')}
  >
    <span class="card-icon">
      <BookOpen size={20} />
    </span>
    <span>
      <small>COMIENZA A LEER</small>
      <strong>Encuentra un pasaje</strong>
      <em>Explora miles de capítulos y versiones.</em>
    </span>
    <ArrowRight size={20} />
  </button>

  <button
    type="button"
    class="feature-card feature-cream"
    onclick={() => onSelectPassage('Filipenses 4:13')}
  >
    <span class="card-icon">
      <Heart size={20} />
    </span>
    <span>
      <small>PARA CADA DÍA</small>
      <strong>Versículo del día</strong>
      <em>“Todo lo puedo en Cristo que me fortalece.”</em>
    </span>
    <ArrowRight size={20} />
  </button>

  <button
    type="button"
    class="feature-card feature-soft"
    onclick={() => onSelectPassage('Salmos 23')}
  >
    <span class="card-icon">
      <Headphones size={20} />
    </span>
    <span>
      <small>ESCUCHA LA PALABRA</small>
      <strong>Audio Biblia</strong>
      <em>Conecta con las Escrituras donde estés.</em>
    </span>
    <ArrowRight size={20} />
  </button>
</section>
