# mcp-lastfm

## API Reference

Official API docs: https://www.last.fm/api/intro

Root endpoint: `https://ws.audioscrobbler.com/2.0/` (method-based, not REST — every
call is a GET with `method`, `api_key`, and `format=json` query params).

This server is read-only and covers every method reachable with a plain `api_key`
(no signed `api_sig`, no session): discovery (`artist.*`, `album.*`, `track.*`,
`tag.*`, `geo.*`), aggregate charts (`chart.*`), a user's library (`library.getArtists`),
and personal listening data (`user.*`) — 41 tools in total. Write/authenticated
methods (scrobbling, `track.love`/`unlove`, `*.addTags`/`removeTag`, and every
`auth.*` method) require the signed shared-secret or session-key flow and are
deliberately out of scope.

Auth: `MCP_LASTFM_API_KEY` — a plain API key query param, no signing or session
required for these read methods.

Optional `MCP_LASTFM_USERNAME` sets a default account for the `user.*` tools: the
`user` argument is optional and resolves to `args.user ?? MCP_LASTFM_USERNAME`,
erroring only when neither is present. An explicit `user` always overrides the
default, so multi-user lookups of other public profiles still work.

Quirks worth knowing when touching `src/index.ts`:

- All numeric fields in Last.fm's JSON responses are strings (`"1234"`, not `1234`).
- List responses wrap results in a resource-named object (e.g. `toptracks`,
  `topalbums`, `recenttracks`) carrying an `@attr` key with pagination metadata
  (`page`, `perPage`, `totalPages`, `total`). Search endpoints use OpenSearch-style
  keys instead (`opensearch:totalResults`, etc.).
- `mbid` (MusicBrainz ID) is often an empty string rather than absent.
- Errors come back as HTTP 200 with `{ error: <code>, message: <string> }` in the
  body — `lastfmFetch` checks for this and treats it as a failure.
