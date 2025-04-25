// functions/api/search.js

const MAX_LIMIT = 500; // Max results per query

/**
 * Handles GET requests to search headlines using FTS5.
 * Expects query parameters: q (search term), limit, page.
 */
export async function onRequestGet(context) {
  const { request, env } = context; // env object contains bindings

  // Check if the D1 binding 'DB' exists
  if (!env.DB) {
    console.error("D1 Database binding 'DB' not found.");
    return new Response(JSON.stringify({ error: "Database configuration error." }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(request.url);
  const query = url.searchParams.get('q')?.trim() || '';
  let limit = parseInt(url.searchParams.get('limit') || '30', 10);
  let page = parseInt(url.searchParams.get('page') || '1', 10);

  // Validate and sanitize pagination parameters
  if (isNaN(limit) || limit <= 0 || limit > MAX_LIMIT) {
    limit = 30; // Use default or max limit
  }
  if (isNaN(page) || page <= 0) {
    page = 1;
  }
  const offset = (page - 1) * limit;

  try {
    let results = [];
    let totalCount = 0;
    const db = env.DB; // Use the D1 binding

    if (query) {
      // --- FTS Query ---
      // Prepare query for FTS5 MATCH operator.
      // Simple search terms are passed directly. FTS5 handles tokenization.
      // For more complex queries (AND, OR, NEAR), the client would need to format the 'query' string accordingly.
      const ftsQuerySql = `
        SELECT h.issue_date, h.number, h.headline, h.page, h.length
        FROM headlines_fts fts           -- Query the FTS table
        JOIN headlines h ON fts.rowid = h.id  -- Join back to get original columns
        WHERE fts.headlines_fts MATCH ?  -- Use MATCH for FTS
        ORDER BY rank                   -- Default FTS relevance ranking
        -- Or order by date: ORDER BY h.issue_date DESC, h.number ASC
        LIMIT ? OFFSET ?;
      `;
      const countSql = `
        SELECT COUNT(*) as count
        FROM headlines_fts
        WHERE headlines_fts MATCH ?;
        `;

      console.log(`Executing FTS query: [${ftsQuerySql}], Params: [${query}, ${limit}, ${offset}]`);
      console.log(`Executing Count query: [${countSql}], Params: [${query}]`);

      // Prepare statements
      const resultsStmt = db.prepare(ftsQuerySql).bind(query, limit, offset);
      const countStmt = db.prepare(countSql).bind(query);

      // Execute concurrently
      const [resultsData, countData] = await Promise.all([
          resultsStmt.all(),
          countStmt.first('count') // Directly get the count value
      ]);

      results = resultsData.results || []; // Extract results array
      totalCount = countData || 0;        // Get count number
      console.log(`FTS Query returned ${results.length} results, total potential matches: ${totalCount}`);
      // --- End FTS Query ---

    } else {
      // --- Handle empty query: Return latest entries ---
       const latestSql = `
        SELECT issue_date, number, headline, page, length
        FROM headlines
        ORDER BY issue_date DESC, number ASC
        LIMIT ? OFFSET ?;
      `;
       const countSql = `SELECT COUNT(*) as count FROM headlines;`; // Total count in the table

      console.log(`Executing Latest query: [${latestSql}], Params: [${limit}, ${offset}]`);

       const resultsStmt = db.prepare(latestSql).bind(limit, offset);
       const countStmt = db.prepare(countSql);

       const [resultsData, countData] = await Promise.all([
           resultsStmt.all(),
           countStmt.first('count')
       ]);
       results = resultsData.results || [];
       totalCount = countData || 0;
       console.log(`Empty query returned ${results.length} latest results, total headlines: ${totalCount}`);
    }

    // Return successful response
    return new Response(JSON.stringify({ results, totalCount, page, limit }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (e) {
    // Log the error for debugging on the Cloudflare side
    console.error("D1 Query Error:", e);
    console.error("Error Cause:", e.cause); // D1 often includes more details in `cause`

    let errorMsg = "Failed to perform search.";
    let status = 500;

    // Attempt to provide more specific feedback if possible
     if (e.message?.includes("MATCH") || e.cause?.message?.includes("MATCH")) {
         errorMsg = "Search query syntax error. Please check your search terms.";
         status = 400; // Bad Request
     } else if (e.message?.includes("D1_") || e.cause?.message?.includes("D1_")) {
         errorMsg = `Database query error: ${e.cause?.message || e.message}`;
     } else if (e.message?.includes("rate limit") || e.message?.includes("too many requests")){
         errorMsg = "Search service is temporarily busy due to high demand. Please try again shortly.";
         status = 429; // Too Many Requests
     }
    // You might get generic errors if Cloudflare intercepts first (e.g., platform limits)

    return new Response(JSON.stringify({ error: errorMsg }), {
      status: status,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Main fetch handler for the function.
 * Ensures only GET requests are processed by onRequestGet.
 */
export async function onRequest(context) {
    if (context.request.method === 'GET') {
        return await onRequestGet(context);
    }
    // Return 405 Method Not Allowed for other request methods
    return new Response(`${context.request.method} method not allowed.`, { status: 405 });
}