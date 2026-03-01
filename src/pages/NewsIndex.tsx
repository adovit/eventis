import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import { Badge, EmptyState, Skeleton } from '../components/ui'

interface Article {
  id: string
  slug: string
  title: string
  excerpt: string | null
  cover_image_url: string | null
  category: string | null
  published_at: string | null
  author_name: string
}

const CATEGORIES = ['Renginiai', 'Menininkai', 'Naujienos', 'Patarimai'] as const

// Maps article category to Badge variant
const CATEGORY_VARIANT: Record<string, 'brand' | 'success' | 'info' | 'warning'> = {
  Renginiai:  'brand',
  Menininkai: 'success',
  Naujienos:  'info',
  Patarimai:  'warning',
}

// Skeleton for a single article card while loading
function ArticleCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
      <Skeleton className="aspect-[3/2] w-full" rounded="rounded-none" />
      <div className="p-4">
        <Skeleton className="h-4 w-24 mb-3" />
        <Skeleton className="h-5 w-full mb-1" />
        <Skeleton className="h-5 w-3/4 mb-3" />
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-2/3 mb-3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  )
}

export default function NewsIndex() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('')

  useDocumentMeta({
    title: 'Naujienos | Eventis',
    description: 'Aktualijos, renginių apžvalgos ir patarimai apie Lietuvos renginius.',
  })

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('articles')
        .select('id, slug, title, excerpt, cover_image_url, category, published_at, author_name')
        .eq('is_published', true)
        .lte('published_at', new Date().toISOString())
        .order('published_at', { ascending: false })

      if (error) {
        console.error('[NewsIndex] Supabase error:', error)
      } else {
        setArticles(data ?? [])
      }
      setLoading(false)
    }
    load()
  }, [])

  // Apply category filter client-side
  const filtered = activeCategory
    ? articles.filter((a) => a.category === activeCategory)
    : articles

  return (
    <>
      {/* ── Page hero ──────────────────────────────────────────── */}
      <div className="bg-white border-b border-neutral-100">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <h1 className="text-2xl font-bold text-neutral-900">Naujienos</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Aktualijos, renginių apžvalgos ir patarimai.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* ── Category filter tabs ──────────────────────────────── */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button
            onClick={() => setActiveCategory('')}
            className={[
              'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
              activeCategory === ''
                ? 'bg-brand-600 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200',
            ].join(' ')}
          >
            Visi
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={[
                'px-4 py-1.5 rounded-full text-sm font-medium transition-colors',
                activeCategory === cat
                  ? 'bg-brand-600 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200',
              ].join(' ')}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* ── Article grid ─────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <ArticleCardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="📰"
            title="Netrukus pasirodys naujienos"
            description="Sekite aktualijas apie Lietuvos renginius."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function ArticleCard({ article }: { article: Article }) {
  const dateLabel = article.published_at
    ? new Date(article.published_at).toLocaleDateString('lt-LT', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : null

  const badgeVariant = article.category
    ? (CATEGORY_VARIANT[article.category] ?? 'neutral')
    : 'neutral'

  return (
    <Link
      to={`/naujienos/${article.slug}`}
      className="group block bg-white rounded-2xl border border-neutral-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
    >
      {/* Cover image */}
      {article.cover_image_url ? (
        <div className="aspect-[3/2] overflow-hidden bg-neutral-100">
          <img
            src={article.cover_image_url}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      ) : (
        <div className="aspect-[3/2] bg-brand-50 flex items-center justify-center text-3xl text-brand-300">
          📰
        </div>
      )}

      <div className="p-4">
        {article.category && (
          <div className="mb-2">
            <Badge variant={badgeVariant}>{article.category}</Badge>
          </div>
        )}
        <h2 className="font-semibold text-neutral-900 text-base leading-snug line-clamp-2 mb-2">
          {article.title}
        </h2>
        {article.excerpt && (
          <p className="text-sm text-neutral-500 line-clamp-3 mb-3">{article.excerpt}</p>
        )}
        <p className="text-xs text-neutral-400">
          {dateLabel} · {article.author_name}
        </p>
      </div>
    </Link>
  )
}
