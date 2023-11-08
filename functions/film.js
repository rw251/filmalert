import { sessionStart, jsonResponse } from '../src/fn/utils';

export async function onRequest(context) {
  const { isNewSession, sessionId } = sessionStart(context);
  if (isNewSession) {
    return await jsonResponse({ nocookie: true });
  }

  const url = new URL(context.request.url);
  const action = url.searchParams.get('action');

  if (action === 'list') {
    const { success, results } = await context.env.FILM_DB.prepare(
      `
        SELECT f.imdb, channel, time, title, year 
        FROM films f
        INNER JOIN filmUserLkup lkup ON lkup.imdb = f.imdb
        INNER JOIN users u ON u.user_id = lkup.user_id
        WHERE session_id = ?`
    )
      .bind(sessionId)
      .all();
    return await jsonResponse({ results });
  } else if (action === 'remove') {
    const imdb = url.searchParams.get('i');
    const resp = await context.env.FILM_DB.prepare(
      'DELETE FROM filmUserLkup WHERE user_id IN (SELECT user_id FROM users WHERE session_id = ?1) AND imdb = ?2'
    )
      .bind(sessionId, imdb)
      .run();
    return await jsonResponse({ resp });
  } else if (action === 'add') {
    const year = url.searchParams.get('y');
    const imdb = url.searchParams.get('i');
    const title = url.searchParams.get('t');
    const stmt1 = context.env.FILM_DB.prepare(
      'INSERT INTO films (imdb, year, title) VALUES (?1, ?2, ?3) ON CONFLICT DO NOTHING'
    ).bind(imdb, year, title);
    const stmt2 = context.env.FILM_DB.prepare(
      'INSERT INTO filmUserLkup (user_id, imdb) SELECT user_id, ?1 FROM users WHERE session_id = ?2 ON CONFLICT DO NOTHING'
    ).bind(imdb, sessionId);
    const info = await context.env.FILM_DB.batch([stmt1, stmt2]);
    return await jsonResponse({ info });
  }
}
