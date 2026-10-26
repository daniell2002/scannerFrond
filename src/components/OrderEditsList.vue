<template>
  <!-- Correcciones de una orden: quién, cuándo, por qué y qué cambió (la más reciente primero) -->
  <ol class="ed-list">
    <li v-for="(e, i) in list" :key="i" class="ed-item">
      <div class="ed-top">
        <strong>{{ e.byName || 'Sistema' }}</strong>
        <span v-if="e.byRole" class="ed-role">{{ roleLabel(e.byRole) }}</span>
        <span class="ed-date">{{ fmtDate(e.at) }}</span>
      </div>
      <p class="ed-reason"><i class="fas fa-quote-left"></i>{{ e.reason }}</p>
      <ul class="ed-changes">
        <li v-for="(c, field) in e.changes" :key="field">
          <span class="ed-field">{{ FIELDS[field] || field }}</span>
          <template v-if="field === 'photos'">
            <span class="ed-photos">
              <a v-for="(p, j) in removed(c)" :key="'r' + j" :href="BASE + p" target="_blank" rel="noopener" class="ed-ph is-removed" title="Foto quitada (se conserva como respaldo)">
                <img :src="BASE + p" alt="Foto quitada" />
              </a>
              <i class="fas fa-arrow-right ed-arrow"></i>
              <a v-for="(p, j) in added(c)" :key="'a' + j" :href="BASE + p" target="_blank" rel="noopener" class="ed-ph is-added" title="Foto agregada">
                <img :src="BASE + p" alt="Foto agregada" />
              </a>
              <span class="ed-ph-count">{{ (c.from || []).length }} → {{ (c.to || []).length }} {{ (c.to || []).length === 1 ? 'foto' : 'fotos' }}</span>
            </span>
          </template>
          <template v-else>
            <span class="ed-from">{{ show(field, c.from) }}</span>
            <i class="fas fa-arrow-right ed-arrow"></i>
            <span class="ed-to">{{ show(field, c.to) }}</span>
          </template>
        </li>
      </ul>
    </li>
  </ol>
</template>

<script setup>
import { computed } from 'vue'
import { BASE } from '../api'
import { roleLabel } from '../utils/modules'

const props = defineProps({ edits: { type: Array, default: () => [] } })

const FIELDS = { code: 'Código', product: 'Cliente', attendedBy: 'Atendido por', photos: 'Fotos', scheduledAt: 'Fecha de la orden' }
const list = computed(() => [...props.edits].reverse())
const fmtDate = (d) => new Date(d).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })
// Ingreso con fecha anterior: de la fecha en que se ingresó a la fecha de la orden
const show = (field, v) => !v ? '—' : field === 'scheduledAt' ? new Date(v).toLocaleDateString('es-CO', { dateStyle: 'medium' }) : v
const removed = (c) => (c.from || []).filter(p => !(c.to || []).includes(p))
const added   = (c) => (c.to || []).filter(p => !(c.from || []).includes(p))
</script>

<style scoped>
.ed-list { list-style:none; margin:0; padding:0; }
.ed-item { padding:0.85rem 0; border-bottom:1px dashed var(--line); }
.ed-item:first-child { padding-top:0.25rem; }
.ed-item:last-child { border-bottom:none; }
.ed-top { display:flex; align-items:baseline; gap:0.5rem; flex-wrap:wrap; font-size:0.85rem; color:var(--ink-900); }
.ed-role { font-size:0.72rem; color:var(--ink-500); background:var(--surface); padding:0.05rem 0.45rem; border-radius:999px; }
.ed-date { margin-left:auto; font-size:0.75rem; color:var(--ink-500); }
.ed-reason { margin:0.35rem 0 0.5rem; font-size:0.82rem; color:var(--ink-700); }
.ed-reason i { font-size:0.65rem; color:var(--ink-400); margin-right:0.4rem; }
.ed-changes { list-style:none; margin:0; padding:0; display:flex; flex-direction:column; gap:0.35rem; }
.ed-changes > li { display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap; font-size:0.8rem; }
.ed-field { min-width:6.5rem; font-weight:600; color:var(--ink-500); }
.ed-from { color:var(--danger); text-decoration:line-through; }
.ed-to { color:var(--success); font-weight:600; }
.ed-arrow { font-size:0.6rem; color:var(--ink-400); }
.ed-photos { display:inline-flex; align-items:center; gap:0.35rem; flex-wrap:wrap; }
.ed-ph { width:40px; height:50px; border-radius:0.3rem; overflow:hidden; border:2px solid transparent; }
.ed-ph img { width:100%; height:100%; object-fit:cover; }
.ed-ph.is-removed { border-color:var(--danger); opacity:0.75; }
.ed-ph.is-added { border-color:var(--success); }
.ed-ph-count { font-size:0.72rem; color:var(--ink-500); margin-left:0.25rem; }
</style>
