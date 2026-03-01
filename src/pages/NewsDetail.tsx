import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import { Badge, Skeleton } from '../components/ui'

interface Article {
  id: string
  slug: string
  title: string
  excerpt: string | null
  body: string
  cover_image_url: string | null
  category: string | null
  author_name: string
  published_at: string | null
  is_published: boolean
  created_at: string
}

const CATEGORY_VARIANT: Record<string, 'brand' | 'success' | 'info' | 'warning'> = {
  Renginiai:  'brand',
  Menininkai: 'success',
  Naujienos:  'info',
  Patarimai:  'warning',
}

// Skeleton layout matching the article detail page structure
function ArticleDetailSkeleton() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Skeleton className="h-4 w-32 mb-6" />
      <Skeleton className="aspect-video w-full rounded-2xl mb-6" />
      <Skeleton className="h-4 w-24 mb-4" />
      <Skeleton className="h-8 w-3/4 mb-3" />
      <Skeleton className="h-8 w-1/2 mb-6" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-2/3 mb-2" />
    </div>
  )
}

export default function NewsDetail() {
  const { slug } = useParams<{ slug: string }>()
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useDocumentMeta({
    title: article ? `${article.title} | Eventis` : 'Eventis',
    description: article?.excerpt ?? undefined,
    ogImage: article?.cover_image_url ?? undefined,
    ogUrl: typeof window !== 'undefined' ? window.location.href : undefined,
    canonical: typeof window !== 'undefined' ? window.location.href : undefined,
  })

  useEffect(() => {
    if (!slug) return

    async function load() {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single()

      if (error) {
        // PGRST116 = no rows found
        setNotFound(true)
      } else {
        setArticle(data)
      }
      setLoading(false)
    }
    load()
  }, [slug])

  // Share article — falls back to clipboard copy if Web Share API unavailable
  function handleShare() {
    const url = window.location.href
    if ('share' in navigator) {
      navigator.share({ title: article?.title ?? 'Eventis', url }).catch(() => null)
    } else {
      navigator.clipboard.writeText(url).catch(() => null)
    }
  }

  if (loading) return <ArticleDetailSkeleton />

  if (notFound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-14rem)] gap-4">
        <h1 className="text-2xl font-bold text-neutral-800">Straipsnis nerastas</h1>
        <p className="text-neutral-500">Patikrinkite nuorodą arba grįžkite į naujienų sąrašą.</p>
        <Link to="/naujienos" className="text-brand-600 hover:underline text-sm">
          ← Visos naujienos
        </Link>
      </div>
    )
  }

  if (!article) return null

  const dateLabel = article.published_at
    ? new Date(article.published_at).toLocaleDateString('lt-LT', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : null

  const badgeVariant = article.category
    ? (CATEGORY_VARIANT[article.category] ?? 'neutral')
    : 'neutral'

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Back link */}
      <Link to="/naujienos" className="inline-flex items-center text-sm text-neutral-500 hover:text-brand-600 mb-6 transition-colors">
        ← Visos naujienos
      </Link>

      {/* Cover image */}
      {article.cover_image_url && (
        <div className="rounded-2xl overflow-hidden mb-6 aspect-video">
          <img
            src={article.cover_image_url}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Meta row: category + date + author + share */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {article.category && (
          <Badge variant={badgeVariant}>{article.category}</Badge>
        )}
        {dateLabel && (
          <span className="text-sm text-neutral-400">{dateLabel}</span>
        )}
        <span className="text-sm text-neutral-400">· {article.author_name}</span>
        <button
          onClick={handleShare}
          className="ml-auto text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors"
        >
          Dalintis ↗
        </button>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold text-neutral-900 mb-6 leading-tight">
        {article.title}
      </h1>

      {/* Body — plain text preserved with whitespace-pre-wrap, no markdown lib */}
      <div className="text-base text-neutral-700 leading-relaxed whitespace-pre-wrap">
        {article.body}
      </div>
    </div>
  )
}
