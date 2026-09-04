"use client";

import { useEffect, useState } from "react";

type Movie = {
  id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
  release_date: string;
  overview: string;
};

type HistorialItem = {
  id: string;
  tmdbId: number;
  title: string;
  status: "vista" | "por-ver";
  posterPath: string | null;
};

const STORAGE_KEY = "historial-peliculas";

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export default function Home() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [historial, setHistorial] = useState<HistorialItem[]>([]);
  const [hidratado, setHidratado] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setHistorial(JSON.parse(raw));
    } catch (err) {
      console.error(err);
    } finally {
      setHidratado(true);
    }
  }, []);

  useEffect(() => {
    if (hidratado) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(historial));
    }
  }, [historial, hidratado]);

  async function cargarPeliculas() {
    try {
      setLoading(true);
      setError("");
      const respuesta = await fetch("/api/movies");
      if (!respuesta.ok) throw new Error("Error al consultar la API");
      const datos = await respuesta.json();
      setMovies(Array.isArray(datos) ? datos : []);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar las películas.");
    } finally {
      setLoading(false);
    }
  }

  async function buscarPeliculas() {
    if (!search.trim()) {
      cargarPeliculas();
      return;
    }
    try {
      setLoading(true);
      setError("");
      const respuesta = await fetch(
        `/api/movies?query=${encodeURIComponent(search)}`
      );
      if (!respuesta.ok) throw new Error("Error en la búsqueda");
      const datos = await respuesta.json();
      setMovies(Array.isArray(datos) ? datos : []);
    } catch (err) {
      console.error(err);
      setError("No se pudieron buscar películas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarPeliculas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function agregarAlHistorial(movie: Movie, status: HistorialItem["status"]) {
    if (historial.some((h) => h.tmdbId === movie.id)) return;
    setHistorial((prev) => [
      ...prev,
      {
        id: makeId(),
        tmdbId: movie.id,
        title: movie.title,
        status,
        posterPath: movie.poster_path,
      },
    ]);
  }

  function eliminarDelHistorial(id: string) {
    setHistorial((prev) => prev.filter((h) => h.id !== id));
  }

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-3 text-center text-4xl font-bold">
          🎬 Historial de Películas
        </h1>
        <p className="mb-8 text-center text-gray-400">
          Explora películas y guarda tu historial
        </p>

        <div className="mx-auto mb-10 flex max-w-2xl gap-3">
          <input
            type="text"
            placeholder="🔎 Buscar película..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && buscarPeliculas()}
            className="flex-1 rounded-xl border border-gray-700 bg-gray-900 px-5 py-3 text-white outline-none focus:border-blue-500"
          />
          <button
            onClick={buscarPeliculas}
            className="rounded-xl bg-blue-600 px-6 py-3 font-bold hover:bg-blue-700"
          >
            Buscar
          </button>
        </div>

        {loading && <p className="py-10 text-center text-xl">⏳ Cargando…</p>}
        {error && <p className="py-10 text-center text-red-400">{error}</p>}

        {!loading && !error && (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {movies.map((movie) => {
              const yaAgregada = historial.some((h) => h.tmdbId === movie.id);
              return (
                <article
                  key={movie.id}
                  className="overflow-hidden rounded-2xl bg-gray-900 shadow-lg transition hover:-translate-y-2 hover:shadow-2xl"
                >
                  {movie.poster_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                      alt={movie.title}
                      className="h-[320px] w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-[320px] items-center justify-center bg-gray-800 text-gray-500">
                      Sin póster
                    </div>
                  )}
                  <div className="p-4">
                    <h2 className="line-clamp-2 text-lg font-bold">
                      {movie.title}
                    </h2>
                    <p className="mt-2 text-sm text-gray-400">
                      📅 {movie.release_date || "Sin fecha"}
                    </p>
                    <p className="mt-1 text-sm text-yellow-400">
                      ⭐ {movie.vote_average?.toFixed(1)}
                    </p>
                    {yaAgregada ? (
                      <p className="mt-3 text-center text-xs text-green-400">
                        En tu historial
                      </p>
                    ) : (
                      <div className="mt-3 flex gap-2">
                        <button
                          onClick={() => agregarAlHistorial(movie, "vista")}
                          className="flex-1 rounded-lg bg-gray-800 py-1.5 text-xs hover:bg-gray-700"
                        >
                          Vista
                        </button>
                        <button
                          onClick={() => agregarAlHistorial(movie, "por-ver")}
                          className="flex-1 rounded-lg bg-gray-800 py-1.5 text-xs hover:bg-gray-700"
                        >
                          Por ver
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-bold">Tu historial</h2>
          {historial.length === 0 ? (
            <p className="text-gray-400">Aún no has agregado películas.</p>
          ) : (
            <ul className="grid gap-3">
              {historial.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between rounded-xl bg-gray-900 p-4"
                >
                  <div>
                    <p className="font-bold">{item.title}</p>
                    <span
                      className={`text-xs ${
                        item.status === "vista"
                          ? "text-green-400"
                          : "text-gray-400"
                      }`}
                    >
                      {item.status === "vista" ? "Vista" : "Por ver"}
                    </span>
                  </div>
                  <button
                    onClick={() => eliminarDelHistorial(item.id)}
                    className="rounded-lg bg-red-900/40 px-3 py-1.5 text-xs text-red-300 hover:bg-red-900/70"
                  >
                    Eliminar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}