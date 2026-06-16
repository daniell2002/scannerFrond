const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

async function request(method, path, body) {
  const token = localStorage.getItem('auth_token')
  let res
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    })
  } catch {
    throw new Error('No hay conexión con el backend. Verifica que esté ejecutándose.')
  }

  const data = await res.json().catch(() => ({}))

  if (res.status === 401) {
    localStorage.removeItem('auth_user')
    localStorage.removeItem('auth_token')

    // Evita bucles en la pantalla protegida cuando expira el token.
    if (window.location.pathname !== '/login') {
      window.location.replace('/login')
    }

    const err = new Error('SESSION_EXPIRED')
    err.code = 'SESSION_EXPIRED'
    throw err
  }

  if (!res.ok) throw new Error(data.message || `Error ${res.status}`)
  return data
}

export const api = {
  get:   (path)        => request('GET',   path),
  post:  (path, body)  => request('POST',  path, body),
  patch: (path, body)  => request('PATCH', path, body),
  del:   (path)        => request('DELETE', path),
}
