export const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

async function request(method, path, body) {
  const token = localStorage.getItem('auth_token')
  const isFormData = body instanceof FormData
  let res
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body !== undefined ? { body: isFormData ? body : JSON.stringify(body) } : {}),
    })
  } catch {
    throw new Error('No hay conexión con el backend. Verifica que esté ejecutándose.')
  }

  const data = await res.json().catch(() => ({}))

  // 401 con sesión abierta = sesión vencida o cuenta desactivada.
  // Sin token (p. ej. en el login) es un error normal y se muestra su mensaje.
  if (res.status === 401 && token) {
    localStorage.removeItem('auth_user')
    localStorage.removeItem('auth_token')
    // Motivo para mostrarlo en la pantalla de ingreso
    if (data.message) sessionStorage.setItem('auth_notice', data.message)

    // Evita bucles en la pantalla protegida cuando expira el token.
    if (window.location.pathname !== '/login') {
      window.location.replace('/login')
    }

    const err = new Error('SESSION_EXPIRED')
    err.code = 'SESSION_EXPIRED'
    throw err
  }

  if (!res.ok) {
    const err = new Error(data.message || `Error ${res.status}`)
    err.status = res.status
    err.data   = data
    throw err
  }
  return data
}

export const api = {
  get:   (path)        => request('GET',   path),
  post:  (path, body)  => request('POST',  path, body),
  patch: (path, body)  => request('PATCH', path, body),
  del:   (path)        => request('DELETE', path),
}
