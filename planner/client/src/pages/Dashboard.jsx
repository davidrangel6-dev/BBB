import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => {
        if (!res.ok) throw new Error(`request failed: ${res.status}`);
        return res.json();
      })
      .then((data) => setCategories(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <section className="mt-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Categories
        </h2>

        {loading && <p className="mt-2 text-gray-500">Loading categories...</p>}
        {error && <p className="mt-2 text-red-600">Failed to load categories: {error}</p>}

        {!loading && !error && (
          <div className="mt-3 flex flex-wrap gap-2">
            {categories.map((category) => (
              <span
                key={category.id}
                className="flex min-h-[44px] items-center rounded-full px-4 text-sm font-semibold text-white shadow-sm"
                style={{ backgroundColor: category.color }}
              >
                {category.name}
              </span>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
