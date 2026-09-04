import { NextRequest, NextResponse } from "next/server";

const TMDB_BASE = "https://api.themoviedb.org/3";

export async function GET(request: NextRequest) {
  const token = process.env.TMDB_TOKEN;

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  const urlApi = query
    ? `${TMDB_BASE}/search/movie?language=es-MX&query=${encodeURIComponent(query)}`
    : `${TMDB_BASE}/movie/popular?language=es-MX&page=1`;

  try {
    const respuesta = await fetch(urlApi, {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!respuesta.ok) {
      const detalle = await respuesta.text();
      console.error(`TMDB respondió ${respuesta.status}:`, detalle);
      return NextResponse.json(
        { error: "Fallo de autenticación con TMDB" },
        { status: respuesta.status }
      );
    }

    const datos = await respuesta.json();
    return NextResponse.json(datos.results || []);
  } catch (error) {
    console.error("Error interno:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}