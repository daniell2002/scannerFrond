import { defineStore } from 'pinia'
import { ref } from 'vue'

let nextId = 1

export const useNotificationsStore = defineStore('notifications', () => {
  const items = ref([])

  function push(type, message, opts = {}) {
    const id = nextId++
    const timeout = opts.timeout ?? 4000
    const title = opts.title || ''
    items.value.push({ id, type, title, message })

    if (timeout > 0) {
      setTimeout(() => remove(id), timeout)
    }

    return id
  }

  const success = (message, opts) => push('success', message, opts)
  const error   = (message, opts) => push('error', message, opts)
  const info    = (message, opts) => push('info', message, opts)
  const warning = (message, opts) => push('warning', message, opts)

  function remove(id) {
    items.value = items.value.filter(item => item.id !== id)
  }

  function clear() {
    items.value = []
  }

  return { items, push, success, error, info, warning, remove, clear }
})
