export const RES_NAME =
  typeof window !== 'undefined' && typeof window.GetParentResourceName === 'function'
    ? window.GetParentResourceName()
    : 'cx-hud'

export const IN_NUI =
  typeof window !== 'undefined' && typeof window.GetParentResourceName === 'function'

export function nuiPost(endpoint, body) {
  if (!IN_NUI) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log('[nui:dev] →', endpoint, body || {})
    }
    return Promise.resolve()
  }
  return fetch('https://' + RES_NAME + '/' + endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  }).catch(() => {})
}
