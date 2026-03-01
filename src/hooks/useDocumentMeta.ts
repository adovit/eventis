import { useEffect } from 'react'

interface MetaConfig {
  title?: string
  description?: string
  ogImage?: string
  ogUrl?: string
  canonical?: string
}

// Finds an existing <meta> tag or creates a new one and appends it to <head>
function setMeta(attr: 'name' | 'property', key: string, content: string): void {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

/**
 * Sets document.title and Open Graph / SEO meta tags for the current page.
 * Resets title to "Eventis" and removes the canonical link on unmount.
 */
export function useDocumentMeta({ title, description, ogImage, ogUrl, canonical }: MetaConfig) {
  useEffect(() => {
    if (title) document.title = title

    if (description) {
      setMeta('name', 'description', description)
      setMeta('property', 'og:description', description)
    }

    if (title) setMeta('property', 'og:title', title)
    if (ogImage) setMeta('property', 'og:image', ogImage)
    if (ogUrl)   setMeta('property', 'og:url', ogUrl)

    // Canonical link — create or update <link rel="canonical">
    let canonicalEl = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (canonical) {
      if (!canonicalEl) {
        canonicalEl = document.createElement('link')
        canonicalEl.setAttribute('rel', 'canonical')
        document.head.appendChild(canonicalEl)
      }
      canonicalEl.setAttribute('href', canonical)
    }

    return () => {
      // Reset title and remove canonical on page navigation
      document.title = 'Eventis'
      document.querySelector('link[rel="canonical"]')?.remove()
    }
  }, [title, description, ogImage, ogUrl, canonical])
}
