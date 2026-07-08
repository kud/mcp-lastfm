#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { z } from "zod"

// Vitest sets VITEST=true in the test process. Import-time side effects
// (credential exits, starting the real transport) must be skipped under
// test — the generated tests do `import * as api from "../index.js"` to
// exercise tool handlers, and importing must stay pure or it either kills
// the runner via process.exit(1) or opens a real StdioServerTransport.
const runningUnderTest = process.env.VITEST === "true"

const API_KEY = process.env["MCP_LASTFM_API_KEY"]

// Optional default account for the user.* tools. When set, "what have I been
// listening to?" resolves against this username without the caller having to
// repeat it; an explicit `user` argument still wins, so multi-user lookups of
// other public profiles keep working.
const DEFAULT_USER = process.env["MCP_LASTFM_USERNAME"]

const API_BASE = "https://ws.audioscrobbler.com/2.0/"
const USER_AGENT = "mcp-lastfm/0.1.0 (+https://github.com/kud/mcp-lastfm)"

type Image = { size: string; "#text": string }

type LastfmError = { error: number; message: string }

const isLastfmError = (data: unknown): data is LastfmError =>
  typeof data === "object" &&
  data !== null &&
  "error" in data &&
  "message" in data

export const lastfmFetch = async <T>(
  method: string,
  params: Record<string, string | number | boolean | undefined> = {},
): Promise<T | null> => {
  const query = new URLSearchParams({
    method,
    api_key: API_KEY ?? "",
    format: "json",
  })
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) query.set(key, String(value))
  }
  try {
    const response = await fetch(`${API_BASE}?${query.toString()}`, {
      headers: { "User-Agent": USER_AGENT },
    })
    if (!response.ok) {
      console.error(`Last.fm API error: ${response.status} ${method}`)
      return null
    }
    const data = (await response.json()) as T | LastfmError
    if (isLastfmError(data)) {
      console.error(
        `Last.fm API error ${data.error}: ${data.message} (${method})`,
      )
      return null
    }
    return data as T
  } catch (e) {
    console.error(`Fetch failed: ${method}`, e)
    return null
  }
}

export const ok = (data: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
})

export const err = (msg: string) => ({
  content: [{ type: "text" as const, text: `Error: ${msg}` }],
})

const boolFlag = (value: boolean | undefined) =>
  value === undefined ? undefined : value ? "1" : "0"

const periodSchema = z
  .enum(["overall", "7day", "1month", "3month", "6month", "12month"])
  .describe("Time range for aggregated stats")
  .default("overall")

const limitSchema = z
  .number()
  .int()
  .positive()
  .optional()
  .describe("Results per page")
const pageSchema = z
  .number()
  .int()
  .positive()
  .optional()
  .describe("Page number")

const userSchema = z
  .string()
  .optional()
  .describe(
    "Last.fm username; defaults to MCP_LASTFM_USERNAME when set, so it can be omitted for your own account",
  )

// Argument wins over the configured default; returns null when neither is present.
const resolveUser = (user?: string) => user ?? DEFAULT_USER

const NO_USER_ERR =
  "no username: pass `user`, or set the MCP_LASTFM_USERNAME env var to default to your own account"

// ─── Search ───

type ArtistSearchResults = {
  results: {
    "opensearch:totalResults": string
    artistmatches: {
      artist: Array<{
        name: string
        listeners: string
        mbid?: string
        url: string
        image: Image[]
      }>
    }
  }
}

export const searchArtists = async ({
  artist,
  limit,
  page,
}: {
  artist: string
  limit?: number
  page?: number
}) => {
  const data = await lastfmFetch<ArtistSearchResults>("artist.search", {
    artist,
    limit,
    page,
  })
  return data ? ok(data.results) : err("failed to search artists")
}

type AlbumSearchResults = {
  results: {
    "opensearch:totalResults": string
    albummatches: {
      album: Array<{
        name: string
        artist: string
        url: string
        mbid?: string
        image: Image[]
      }>
    }
  }
}

export const searchAlbums = async ({
  album,
  limit,
  page,
}: {
  album: string
  limit?: number
  page?: number
}) => {
  const data = await lastfmFetch<AlbumSearchResults>("album.search", {
    album,
    limit,
    page,
  })
  return data ? ok(data.results) : err("failed to search albums")
}

type TrackSearchResults = {
  results: {
    "opensearch:totalResults": string
    trackmatches: {
      track: Array<{
        name: string
        artist: string
        url: string
        listeners: string
        mbid?: string
        image: Image[]
      }>
    }
  }
}

export const searchTracks = async ({
  track,
  artist,
  limit,
  page,
}: {
  track: string
  artist?: string
  limit?: number
  page?: number
}) => {
  const data = await lastfmFetch<TrackSearchResults>("track.search", {
    track,
    artist,
    limit,
    page,
  })
  return data ? ok(data.results) : err("failed to search tracks")
}

// ─── Artist ───

type ArtistInfo = {
  artist: {
    name: string
    mbid?: string
    url: string
    image: Image[]
    stats: { listeners: string; plays: string }
    similar?: { artist: Array<{ name: string; url: string; image: Image[] }> }
    tags?: { tag: Array<{ name: string; url: string }> }
    bio?: { published: string; summary: string; content: string }
  }
}

export const getArtist = async ({
  artist,
  mbid,
  lang,
  autocorrect,
}: {
  artist?: string
  mbid?: string
  lang?: string
  autocorrect?: boolean
}) => {
  const data = await lastfmFetch<ArtistInfo>("artist.getInfo", {
    artist,
    mbid,
    lang,
    autocorrect: boolFlag(autocorrect),
  })
  return data ? ok(data.artist) : err("failed to fetch artist")
}

type SimilarArtists = {
  similarartists: {
    "@attr": { artist: string }
    artist: Array<{
      name: string
      mbid?: string
      match: string
      url: string
      image: Image[]
    }>
  }
}

export const getSimilarArtists = async ({
  artist,
  mbid,
  limit,
  autocorrect,
}: {
  artist?: string
  mbid?: string
  limit?: number
  autocorrect?: boolean
}) => {
  const data = await lastfmFetch<SimilarArtists>("artist.getSimilar", {
    artist,
    mbid,
    limit,
    autocorrect: boolFlag(autocorrect),
  })
  return data ? ok(data.similarartists) : err("failed to fetch similar artists")
}

type ArtistTopTracks = {
  toptracks: {
    "@attr": {
      artist: string
      page: string
      perPage: string
      totalPages: string
      total: string
    }
    track: Array<{
      name: string
      playcount: string
      listeners: string
      mbid?: string
      url: string
      artist: { name: string; mbid?: string; url: string }
      image: Image[]
      "@attr": { rank: string }
    }>
  }
}

export const getArtistTopTracks = async ({
  artist,
  mbid,
  limit,
  page,
  autocorrect,
}: {
  artist?: string
  mbid?: string
  limit?: number
  page?: number
  autocorrect?: boolean
}) => {
  const data = await lastfmFetch<ArtistTopTracks>("artist.getTopTracks", {
    artist,
    mbid,
    limit,
    page,
    autocorrect: boolFlag(autocorrect),
  })
  return data ? ok(data.toptracks) : err("failed to fetch artist top tracks")
}

type ArtistTopAlbums = {
  topalbums: {
    "@attr": {
      artist: string
      page: string
      perPage: string
      totalPages: string
      total: string
    }
    album: Array<{
      name: string
      playcount: string
      mbid?: string
      url: string
      artist: { name: string; mbid?: string; url: string }
      image: Image[]
      "@attr": { rank: string }
    }>
  }
}

export const getArtistTopAlbums = async ({
  artist,
  mbid,
  limit,
  page,
  autocorrect,
}: {
  artist?: string
  mbid?: string
  limit?: number
  page?: number
  autocorrect?: boolean
}) => {
  const data = await lastfmFetch<ArtistTopAlbums>("artist.getTopAlbums", {
    artist,
    mbid,
    limit,
    page,
    autocorrect: boolFlag(autocorrect),
  })
  return data ? ok(data.topalbums) : err("failed to fetch artist top albums")
}

// ─── Album & Track ───

type AlbumInfo = {
  album: {
    name: string
    artist: string
    mbid?: string
    url: string
    image: Image[]
    listeners: string
    playcount: string
    tags?: { tag: Array<{ name: string; url: string }> }
    tracks?: {
      track: Array<{
        name: string
        url: string
        duration: string
        "@attr": { rank: string }
        artist: { name: string; mbid?: string; url: string }
      }>
    }
    wiki?: { published: string; summary: string; content: string }
  }
}

export const getAlbum = async ({
  artist,
  album,
  mbid,
  autocorrect,
}: {
  artist?: string
  album?: string
  mbid?: string
  autocorrect?: boolean
}) => {
  const data = await lastfmFetch<AlbumInfo>("album.getInfo", {
    artist,
    album,
    mbid,
    autocorrect: boolFlag(autocorrect),
  })
  return data ? ok(data.album) : err("failed to fetch album")
}

type TrackInfo = {
  track: {
    name: string
    mbid?: string
    url: string
    duration: string
    listeners: string
    playcount: string
    artist: { name: string; mbid?: string; url: string }
    album?: {
      artist: string
      title: string
      mbid?: string
      url: string
      image: Image[]
      "@attr"?: { position: string }
    }
    toptags?: { tag: Array<{ name: string; url: string }> }
    wiki?: { published: string; summary: string; content: string }
  }
}

export const getTrack = async ({
  artist,
  track,
  mbid,
  autocorrect,
}: {
  artist?: string
  track?: string
  mbid?: string
  autocorrect?: boolean
}) => {
  const data = await lastfmFetch<TrackInfo>("track.getInfo", {
    artist,
    track,
    mbid,
    autocorrect: boolFlag(autocorrect),
  })
  return data ? ok(data.track) : err("failed to fetch track")
}

// ─── User ───

type UserInfo = {
  user: {
    name: string
    realname?: string
    url: string
    image: Image[]
    country?: string
    age?: string
    gender?: string
    subscriber: string
    playcount: string
    registered: { unixtime: string }
  }
}

export const getUserInfo = async ({ user }: { user?: string }) => {
  const username = resolveUser(user)
  if (!username) return err(NO_USER_ERR)
  const data = await lastfmFetch<UserInfo>("user.getInfo", { user: username })
  return data ? ok(data.user) : err("failed to fetch user info")
}

type UserRecentTracks = {
  recenttracks: {
    "@attr": {
      user: string
      page: string
      perPage: string
      totalPages: string
      total: string
    }
    track: Array<{
      name: string
      mbid?: string
      artist: { "#text": string; mbid?: string }
      album: { "#text": string; mbid?: string }
      url: string
      image: Image[]
      date?: { "#text": string; uts: string }
      loved?: string
      "@attr"?: { nowplaying: string }
    }>
  }
}

export const getUserRecentTracks = async ({
  user,
  limit,
  page,
  from,
  to,
  extended,
}: {
  user?: string
  limit?: number
  page?: number
  from?: number
  to?: number
  extended?: boolean
}) => {
  const username = resolveUser(user)
  if (!username) return err(NO_USER_ERR)
  const data = await lastfmFetch<UserRecentTracks>("user.getRecentTracks", {
    user: username,
    limit,
    page,
    from,
    to,
    extended: boolFlag(extended),
  })
  return data ? ok(data.recenttracks) : err("failed to fetch recent tracks")
}

type UserTopArtists = {
  topartists: {
    "@attr": {
      user: string
      type: string
      page: string
      perPage: string
      totalPages: string
      total: string
    }
    artist: Array<{
      name: string
      playcount: string
      mbid?: string
      url: string
      image: Image[]
      "@attr": { rank: string }
    }>
  }
}

export const getUserTopArtists = async ({
  user,
  period,
  limit,
  page,
}: {
  user?: string
  period?: string
  limit?: number
  page?: number
}) => {
  const username = resolveUser(user)
  if (!username) return err(NO_USER_ERR)
  const data = await lastfmFetch<UserTopArtists>("user.getTopArtists", {
    user: username,
    period,
    limit,
    page,
  })
  return data ? ok(data.topartists) : err("failed to fetch user top artists")
}

type UserTopTracks = {
  toptracks: {
    "@attr": {
      user: string
      type: string
      page: string
      perPage: string
      totalPages: string
      total: string
    }
    track: Array<{
      name: string
      duration: string
      playcount: string
      mbid?: string
      url: string
      artist: { name: string; mbid?: string; url: string }
      image: Image[]
      "@attr": { rank: string }
    }>
  }
}

export const getUserTopTracks = async ({
  user,
  period,
  limit,
  page,
}: {
  user?: string
  period?: string
  limit?: number
  page?: number
}) => {
  const username = resolveUser(user)
  if (!username) return err(NO_USER_ERR)
  const data = await lastfmFetch<UserTopTracks>("user.getTopTracks", {
    user: username,
    period,
    limit,
    page,
  })
  return data ? ok(data.toptracks) : err("failed to fetch user top tracks")
}

type UserTopAlbums = {
  topalbums: {
    "@attr": {
      user: string
      type: string
      page: string
      perPage: string
      totalPages: string
      total: string
    }
    album: Array<{
      name: string
      playcount: string
      mbid?: string
      url: string
      artist: { name: string; mbid?: string; url: string }
      image: Image[]
      "@attr": { rank: string }
    }>
  }
}

export const getUserTopAlbums = async ({
  user,
  period,
  limit,
  page,
}: {
  user?: string
  period?: string
  limit?: number
  page?: number
}) => {
  const username = resolveUser(user)
  if (!username) return err(NO_USER_ERR)
  const data = await lastfmFetch<UserTopAlbums>("user.getTopAlbums", {
    user: username,
    period,
    limit,
    page,
  })
  return data ? ok(data.topalbums) : err("failed to fetch user top albums")
}

// ─── Chart ───

type ChartTopArtists = {
  artists: {
    "@attr": {
      page: string
      perPage: string
      totalPages: string
      total: string
    }
    artist: Array<{
      name: string
      playcount: string
      listeners: string
      mbid?: string
      url: string
      image: Image[]
    }>
  }
}

export const getChartTopArtists = async ({
  limit,
  page,
}: {
  limit?: number
  page?: number
}) => {
  const data = await lastfmFetch<ChartTopArtists>("chart.getTopArtists", {
    limit,
    page,
  })
  return data ? ok(data.artists) : err("failed to fetch chart top artists")
}

type ChartTopTracks = {
  tracks: {
    "@attr": {
      page: string
      perPage: string
      totalPages: string
      total: string
    }
    track: Array<{
      name: string
      duration?: string
      playcount: string
      listeners: string
      mbid?: string
      url: string
      artist: { name: string; mbid?: string; url: string }
      image: Image[]
    }>
  }
}

export const getChartTopTracks = async ({
  limit,
  page,
}: {
  limit?: number
  page?: number
}) => {
  const data = await lastfmFetch<ChartTopTracks>("chart.getTopTracks", {
    limit,
    page,
  })
  return data ? ok(data.tracks) : err("failed to fetch chart top tracks")
}

// ─── Tag ───

type TagTopArtists = {
  topartists: {
    "@attr": {
      tag: string
      page: string
      perPage: string
      totalPages: string
      total: string
    }
    artist: Array<{
      name: string
      mbid?: string
      url: string
      image: Image[]
      "@attr": { rank: string }
    }>
  }
}

export const getTagTopArtists = async ({
  tag,
  limit,
  page,
}: {
  tag: string
  limit?: number
  page?: number
}) => {
  const data = await lastfmFetch<TagTopArtists>("tag.getTopArtists", {
    tag,
    limit,
    page,
  })
  return data ? ok(data.topartists) : err("failed to fetch tag top artists")
}

type TagTopTracks = {
  toptracks: {
    "@attr": {
      tag: string
      page: string
      perPage: string
      totalPages: string
      total: string
    }
    track: Array<{
      name: string
      mbid?: string
      url: string
      duration?: string
      artist: { name: string; mbid?: string; url: string }
      image: Image[]
      "@attr": { rank: string }
    }>
  }
}

export const getTagTopTracks = async ({
  tag,
  limit,
  page,
}: {
  tag: string
  limit?: number
  page?: number
}) => {
  const data = await lastfmFetch<TagTopTracks>("tag.getTopTracks", {
    tag,
    limit,
    page,
  })
  return data ? ok(data.toptracks) : err("failed to fetch tag top tracks")
}

// ─── Server ───

const server = new McpServer({ name: "lastfm", version: "0.1.0" })

// ─── Search ───
server.registerTool(
  "search_artists",
  {
    description: "Search for artists by name",
    inputSchema: {
      artist: z.string().describe("Artist name to search for"),
      limit: limitSchema,
      page: pageSchema,
    },
  },
  searchArtists,
)

server.registerTool(
  "search_albums",
  {
    description: "Search for albums by name",
    inputSchema: {
      album: z.string().describe("Album name to search for"),
      limit: limitSchema,
      page: pageSchema,
    },
  },
  searchAlbums,
)

server.registerTool(
  "search_tracks",
  {
    description: "Search for tracks by name, optionally narrowed by artist",
    inputSchema: {
      track: z.string().describe("Track name to search for"),
      artist: z.string().optional().describe("Narrow results to this artist"),
      limit: limitSchema,
      page: pageSchema,
    },
  },
  searchTracks,
)

// ─── Artist ───
server.registerTool(
  "get_artist",
  {
    description:
      "Get detailed info for an artist: bio, stats, tags, similar artists",
    inputSchema: {
      artist: z
        .string()
        .optional()
        .describe("Artist name (required unless mbid given)"),
      mbid: z.string().optional().describe("MusicBrainz artist ID"),
      lang: z
        .string()
        .optional()
        .describe("ISO 639 alpha-2 language code for the bio"),
      autocorrect: z
        .boolean()
        .optional()
        .describe("Correct misspelled artist names"),
    },
  },
  getArtist,
)

server.registerTool(
  "get_similar_artists",
  {
    description: "Get artists similar to a given artist",
    inputSchema: {
      artist: z
        .string()
        .optional()
        .describe("Artist name (required unless mbid given)"),
      mbid: z.string().optional().describe("MusicBrainz artist ID"),
      limit: limitSchema,
      autocorrect: z
        .boolean()
        .optional()
        .describe("Correct misspelled artist names"),
    },
  },
  getSimilarArtists,
)

server.registerTool(
  "get_artist_top_tracks",
  {
    description: "Get an artist's most popular tracks",
    inputSchema: {
      artist: z
        .string()
        .optional()
        .describe("Artist name (required unless mbid given)"),
      mbid: z.string().optional().describe("MusicBrainz artist ID"),
      limit: limitSchema,
      page: pageSchema,
      autocorrect: z
        .boolean()
        .optional()
        .describe("Correct misspelled artist names"),
    },
  },
  getArtistTopTracks,
)

server.registerTool(
  "get_artist_top_albums",
  {
    description: "Get an artist's most popular albums",
    inputSchema: {
      artist: z
        .string()
        .optional()
        .describe("Artist name (required unless mbid given)"),
      mbid: z.string().optional().describe("MusicBrainz artist ID"),
      limit: limitSchema,
      page: pageSchema,
      autocorrect: z
        .boolean()
        .optional()
        .describe("Correct misspelled artist names"),
    },
  },
  getArtistTopAlbums,
)

// ─── Album & Track ───
server.registerTool(
  "get_album",
  {
    description: "Get detailed info for an album: tracklist, tags, wiki",
    inputSchema: {
      artist: z
        .string()
        .optional()
        .describe("Artist name (required unless mbid given)"),
      album: z
        .string()
        .optional()
        .describe("Album name (required unless mbid given)"),
      mbid: z.string().optional().describe("MusicBrainz release ID"),
      autocorrect: z
        .boolean()
        .optional()
        .describe("Correct misspelled artist/album names"),
    },
  },
  getAlbum,
)

server.registerTool(
  "get_track",
  {
    description: "Get detailed info for a track: stats, album, tags, wiki",
    inputSchema: {
      artist: z
        .string()
        .optional()
        .describe("Artist name (required unless mbid given)"),
      track: z
        .string()
        .optional()
        .describe("Track name (required unless mbid given)"),
      mbid: z.string().optional().describe("MusicBrainz track ID"),
      autocorrect: z
        .boolean()
        .optional()
        .describe("Correct misspelled artist/track names"),
    },
  },
  getTrack,
)

// ─── User ───
server.registerTool(
  "get_user_info",
  {
    description: "Get a Last.fm user's profile info",
    inputSchema: {
      user: userSchema,
    },
  },
  getUserInfo,
)

server.registerTool(
  "get_user_recent_tracks",
  {
    description:
      "Get a user's recent scrobbles, including the currently playing track",
    inputSchema: {
      user: userSchema,
      limit: limitSchema,
      page: pageSchema,
      from: z
        .number()
        .int()
        .optional()
        .describe("Unix timestamp — only scrobbles after this"),
      to: z
        .number()
        .int()
        .optional()
        .describe("Unix timestamp — only scrobbles before this"),
      extended: z
        .boolean()
        .optional()
        .describe("Include extended artist/loved data"),
    },
  },
  getUserRecentTracks,
)

server.registerTool(
  "get_user_top_artists",
  {
    description: "Get a user's most-played artists over a time period",
    inputSchema: {
      user: userSchema,
      period: periodSchema,
      limit: limitSchema,
      page: pageSchema,
    },
  },
  getUserTopArtists,
)

server.registerTool(
  "get_user_top_tracks",
  {
    description: "Get a user's most-played tracks over a time period",
    inputSchema: {
      user: userSchema,
      period: periodSchema,
      limit: limitSchema,
      page: pageSchema,
    },
  },
  getUserTopTracks,
)

server.registerTool(
  "get_user_top_albums",
  {
    description: "Get a user's most-played albums over a time period",
    inputSchema: {
      user: userSchema,
      period: periodSchema,
      limit: limitSchema,
      page: pageSchema,
    },
  },
  getUserTopAlbums,
)

// ─── Chart ───
server.registerTool(
  "get_chart_top_artists",
  {
    description: "Get the current global top artists chart",
    inputSchema: {
      limit: limitSchema,
      page: pageSchema,
    },
  },
  getChartTopArtists,
)

server.registerTool(
  "get_chart_top_tracks",
  {
    description: "Get the current global top tracks chart",
    inputSchema: {
      limit: limitSchema,
      page: pageSchema,
    },
  },
  getChartTopTracks,
)

// ─── Tag ───
server.registerTool(
  "get_tag_top_artists",
  {
    description: "Get the top artists tagged with a given tag",
    inputSchema: {
      tag: z.string().describe("Tag name, e.g. 'shoegaze'"),
      limit: limitSchema,
      page: pageSchema,
    },
  },
  getTagTopArtists,
)

server.registerTool(
  "get_tag_top_tracks",
  {
    description: "Get the top tracks tagged with a given tag",
    inputSchema: {
      tag: z.string().describe("Tag name, e.g. 'shoegaze'"),
      limit: limitSchema,
      page: pageSchema,
    },
  },
  getTagTopTracks,
)

// ─── Main ───

const main = async () => {
  if (!API_KEY) {
    console.error("MCP_LASTFM_API_KEY env var is required")
    process.exit(1)
  }
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error("mcp-lastfm running")
}

// Tests import this module to exercise tool handlers against a mocked
// fetch; without this guard, importing would run the credential check
// above and a real StdioServerTransport, aborting the test runner or
// leaving an unhandled rejection. The real CLI still starts normally —
// VITEST is only ever set by the vitest process itself.
if (!runningUnderTest) {
  main().catch((e) => {
    console.error("Fatal:", e)
    process.exit(1)
  })
}
