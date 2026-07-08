import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest"

vi.hoisted(() => {
  process.env.MCP_LASTFM_API_KEY = "test-key"
})

import {
  searchArtists,
  searchAlbums,
  searchTracks,
  getArtist,
  getSimilarArtists,
  getArtistTopTracks,
  getArtistTopAlbums,
  getAlbum,
  getTrack,
  getUserInfo,
  getUserRecentTracks,
  getUserTopArtists,
  getUserTopTracks,
  getUserTopAlbums,
  getChartTopArtists,
  getChartTopTracks,
  getTagTopArtists,
  getTagTopTracks,
} from "../index.js"

const mockFetch = vi.fn()

beforeAll(() => {
  vi.stubGlobal("fetch", mockFetch)
})

beforeEach(() => {
  mockFetch.mockReset()
})

const res = (data: unknown) =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve(data),
  } as Response)

const failRes = () =>
  Promise.resolve({
    ok: false,
    status: 500,
    json: () => Promise.resolve({}),
  } as Response)

const apiErrorRes = (message = "Invalid API key") =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ error: 10, message }),
  } as Response)

const text = (result: { content: Array<{ text: string }> }) =>
  result.content[0].text

const calledUrl = () => String(mockFetch.mock.calls[0][0])

describe("searchArtists", () => {
  it("returns artist matches on success", async () => {
    mockFetch.mockReturnValue(
      res({
        results: {
          "opensearch:totalResults": "1",
          artistmatches: {
            artist: [
              { name: "Radiohead", listeners: "100", url: "u", image: [] },
            ],
          },
        },
      }),
    )
    const result = await searchArtists({ artist: "Radiohead" })
    expect(text(result)).toContain("Radiohead")
    expect(calledUrl()).toContain("method=artist.search")
    expect(calledUrl()).toContain("artist=Radiohead")
  })

  it("returns error when fetch fails", async () => {
    mockFetch.mockReturnValue(failRes())
    const result = await searchArtists({ artist: "Radiohead" })
    expect(text(result)).toContain("Error:")
  })
})

describe("searchAlbums", () => {
  it("returns album matches on success", async () => {
    mockFetch.mockReturnValue(
      res({
        results: {
          "opensearch:totalResults": "1",
          albummatches: {
            album: [
              { name: "OK Computer", artist: "Radiohead", url: "u", image: [] },
            ],
          },
        },
      }),
    )
    const result = await searchAlbums({ album: "OK Computer" })
    expect(text(result)).toContain("OK Computer")
    expect(calledUrl()).toContain("method=album.search")
  })

  it("returns error on Last.fm API error payload", async () => {
    mockFetch.mockReturnValue(apiErrorRes())
    const result = await searchAlbums({ album: "OK Computer" })
    expect(text(result)).toContain("Error:")
  })
})

describe("searchTracks", () => {
  it("returns track matches on success", async () => {
    mockFetch.mockReturnValue(
      res({
        results: {
          "opensearch:totalResults": "1",
          trackmatches: {
            track: [
              {
                name: "Karma Police",
                artist: "Radiohead",
                url: "u",
                listeners: "1",
                image: [],
              },
            ],
          },
        },
      }),
    )
    const result = await searchTracks({ track: "Karma Police" })
    expect(text(result)).toContain("Karma Police")
    expect(calledUrl()).toContain("method=track.search")
  })

  it("returns error when fetch fails", async () => {
    mockFetch.mockReturnValue(failRes())
    const result = await searchTracks({ track: "Karma Police" })
    expect(text(result)).toContain("Error:")
  })
})

describe("getArtist", () => {
  it("returns artist info on success", async () => {
    mockFetch.mockReturnValue(
      res({
        artist: {
          name: "Radiohead",
          url: "u",
          image: [],
          stats: { listeners: "100", plays: "1000" },
        },
      }),
    )
    const result = await getArtist({ artist: "Radiohead" })
    expect(text(result)).toContain("Radiohead")
    expect(calledUrl()).toContain("method=artist.getInfo")
  })

  it("returns error when fetch fails", async () => {
    mockFetch.mockReturnValue(failRes())
    const result = await getArtist({ artist: "Radiohead" })
    expect(text(result)).toContain("Error:")
  })
})

describe("getSimilarArtists", () => {
  it("returns similar artists on success", async () => {
    mockFetch.mockReturnValue(
      res({
        similarartists: {
          "@attr": { artist: "Radiohead" },
          artist: [{ name: "Thom Yorke", match: "0.9", url: "u", image: [] }],
        },
      }),
    )
    const result = await getSimilarArtists({ artist: "Radiohead" })
    expect(text(result)).toContain("Thom Yorke")
    expect(calledUrl()).toContain("method=artist.getSimilar")
  })

  it("returns error when fetch fails", async () => {
    mockFetch.mockReturnValue(failRes())
    const result = await getSimilarArtists({ artist: "Radiohead" })
    expect(text(result)).toContain("Error:")
  })
})

describe("getArtistTopTracks", () => {
  it("returns top tracks on success", async () => {
    mockFetch.mockReturnValue(
      res({
        toptracks: {
          "@attr": {
            artist: "Radiohead",
            page: "1",
            perPage: "50",
            totalPages: "1",
            total: "1",
          },
          track: [
            {
              name: "Creep",
              playcount: "1",
              listeners: "1",
              url: "u",
              artist: { name: "Radiohead", url: "u" },
              image: [],
              "@attr": { rank: "1" },
            },
          ],
        },
      }),
    )
    const result = await getArtistTopTracks({ artist: "Radiohead" })
    expect(text(result)).toContain("Creep")
    expect(calledUrl()).toContain("method=artist.getTopTracks")
  })

  it("returns error when fetch fails", async () => {
    mockFetch.mockReturnValue(failRes())
    const result = await getArtistTopTracks({ artist: "Radiohead" })
    expect(text(result)).toContain("Error:")
  })
})

describe("getArtistTopAlbums", () => {
  it("returns top albums on success", async () => {
    mockFetch.mockReturnValue(
      res({
        topalbums: {
          "@attr": {
            artist: "Radiohead",
            page: "1",
            perPage: "50",
            totalPages: "1",
            total: "1",
          },
          album: [
            {
              name: "OK Computer",
              playcount: "1",
              url: "u",
              artist: { name: "Radiohead", url: "u" },
              image: [],
              "@attr": { rank: "1" },
            },
          ],
        },
      }),
    )
    const result = await getArtistTopAlbums({ artist: "Radiohead" })
    expect(text(result)).toContain("OK Computer")
    expect(calledUrl()).toContain("method=artist.getTopAlbums")
  })

  it("returns error when fetch fails", async () => {
    mockFetch.mockReturnValue(failRes())
    const result = await getArtistTopAlbums({ artist: "Radiohead" })
    expect(text(result)).toContain("Error:")
  })
})

describe("getAlbum", () => {
  it("returns album info on success", async () => {
    mockFetch.mockReturnValue(
      res({
        album: {
          name: "OK Computer",
          artist: "Radiohead",
          url: "u",
          image: [],
          listeners: "100",
          playcount: "1000",
        },
      }),
    )
    const result = await getAlbum({ artist: "Radiohead", album: "OK Computer" })
    expect(text(result)).toContain("OK Computer")
    expect(calledUrl()).toContain("method=album.getInfo")
  })

  it("returns error when fetch fails", async () => {
    mockFetch.mockReturnValue(failRes())
    const result = await getAlbum({ artist: "Radiohead", album: "OK Computer" })
    expect(text(result)).toContain("Error:")
  })
})

describe("getTrack", () => {
  it("returns track info on success", async () => {
    mockFetch.mockReturnValue(
      res({
        track: {
          name: "Karma Police",
          url: "u",
          duration: "260000",
          listeners: "100",
          playcount: "1000",
          artist: { name: "Radiohead", url: "u" },
        },
      }),
    )
    const result = await getTrack({
      artist: "Radiohead",
      track: "Karma Police",
    })
    expect(text(result)).toContain("Karma Police")
    expect(calledUrl()).toContain("method=track.getInfo")
  })

  it("returns error when fetch fails", async () => {
    mockFetch.mockReturnValue(failRes())
    const result = await getTrack({
      artist: "Radiohead",
      track: "Karma Police",
    })
    expect(text(result)).toContain("Error:")
  })
})

describe("getUserInfo", () => {
  it("returns user info on success", async () => {
    mockFetch.mockReturnValue(
      res({
        user: {
          name: "kud",
          url: "u",
          image: [],
          subscriber: "0",
          playcount: "1000",
          registered: { unixtime: "1000000" },
        },
      }),
    )
    const result = await getUserInfo({ user: "kud" })
    expect(text(result)).toContain("kud")
    expect(calledUrl()).toContain("method=user.getInfo")
  })

  it("returns error when fetch fails", async () => {
    mockFetch.mockReturnValue(failRes())
    const result = await getUserInfo({ user: "kud" })
    expect(text(result)).toContain("Error:")
  })

  it("errors without hitting the API when no user and no default are set", async () => {
    const result = await getUserInfo({})
    expect(text(result)).toContain("no username")
    expect(mockFetch).not.toHaveBeenCalled()
  })
})

describe("getUserRecentTracks", () => {
  it("returns recent tracks on success", async () => {
    mockFetch.mockReturnValue(
      res({
        recenttracks: {
          "@attr": {
            user: "kud",
            page: "1",
            perPage: "50",
            totalPages: "1",
            total: "1",
          },
          track: [
            {
              name: "Karma Police",
              artist: { "#text": "Radiohead" },
              album: { "#text": "OK Computer" },
              url: "u",
              image: [],
              date: { "#text": "01 Jan 2024", uts: "1704067200" },
            },
          ],
        },
      }),
    )
    const result = await getUserRecentTracks({ user: "kud" })
    expect(text(result)).toContain("Karma Police")
    expect(calledUrl()).toContain("method=user.getRecentTracks")
  })

  it("returns error when fetch fails", async () => {
    mockFetch.mockReturnValue(failRes())
    const result = await getUserRecentTracks({ user: "kud" })
    expect(text(result)).toContain("Error:")
  })
})

describe("getUserTopArtists", () => {
  it("returns top artists on success", async () => {
    mockFetch.mockReturnValue(
      res({
        topartists: {
          "@attr": {
            user: "kud",
            type: "overall",
            page: "1",
            perPage: "50",
            totalPages: "1",
            total: "1",
          },
          artist: [
            {
              name: "Radiohead",
              playcount: "10",
              url: "u",
              image: [],
              "@attr": { rank: "1" },
            },
          ],
        },
      }),
    )
    const result = await getUserTopArtists({ user: "kud", period: "overall" })
    expect(text(result)).toContain("Radiohead")
    expect(calledUrl()).toContain("method=user.getTopArtists")
  })

  it("returns error when fetch fails", async () => {
    mockFetch.mockReturnValue(failRes())
    const result = await getUserTopArtists({ user: "kud" })
    expect(text(result)).toContain("Error:")
  })
})

describe("getUserTopTracks", () => {
  it("returns top tracks on success", async () => {
    mockFetch.mockReturnValue(
      res({
        toptracks: {
          "@attr": {
            user: "kud",
            type: "overall",
            page: "1",
            perPage: "50",
            totalPages: "1",
            total: "1",
          },
          track: [
            {
              name: "Creep",
              duration: "1",
              playcount: "10",
              url: "u",
              artist: { name: "Radiohead", url: "u" },
              image: [],
              "@attr": { rank: "1" },
            },
          ],
        },
      }),
    )
    const result = await getUserTopTracks({ user: "kud" })
    expect(text(result)).toContain("Creep")
    expect(calledUrl()).toContain("method=user.getTopTracks")
  })

  it("returns error when fetch fails", async () => {
    mockFetch.mockReturnValue(failRes())
    const result = await getUserTopTracks({ user: "kud" })
    expect(text(result)).toContain("Error:")
  })
})

describe("getUserTopAlbums", () => {
  it("returns top albums on success", async () => {
    mockFetch.mockReturnValue(
      res({
        topalbums: {
          "@attr": {
            user: "kud",
            type: "overall",
            page: "1",
            perPage: "50",
            totalPages: "1",
            total: "1",
          },
          album: [
            {
              name: "OK Computer",
              playcount: "10",
              url: "u",
              artist: { name: "Radiohead", url: "u" },
              image: [],
              "@attr": { rank: "1" },
            },
          ],
        },
      }),
    )
    const result = await getUserTopAlbums({ user: "kud" })
    expect(text(result)).toContain("OK Computer")
    expect(calledUrl()).toContain("method=user.getTopAlbums")
  })

  it("returns error when fetch fails", async () => {
    mockFetch.mockReturnValue(failRes())
    const result = await getUserTopAlbums({ user: "kud" })
    expect(text(result)).toContain("Error:")
  })
})

describe("getChartTopArtists", () => {
  it("returns chart top artists on success", async () => {
    mockFetch.mockReturnValue(
      res({
        artists: {
          "@attr": { page: "1", perPage: "50", totalPages: "1", total: "1" },
          artist: [
            {
              name: "Radiohead",
              playcount: "10",
              listeners: "10",
              url: "u",
              image: [],
            },
          ],
        },
      }),
    )
    const result = await getChartTopArtists({})
    expect(text(result)).toContain("Radiohead")
    expect(calledUrl()).toContain("method=chart.getTopArtists")
  })

  it("returns error when fetch fails", async () => {
    mockFetch.mockReturnValue(failRes())
    const result = await getChartTopArtists({})
    expect(text(result)).toContain("Error:")
  })
})

describe("getChartTopTracks", () => {
  it("returns chart top tracks on success", async () => {
    mockFetch.mockReturnValue(
      res({
        tracks: {
          "@attr": { page: "1", perPage: "50", totalPages: "1", total: "1" },
          track: [
            {
              name: "Creep",
              playcount: "10",
              listeners: "10",
              url: "u",
              artist: { name: "Radiohead", url: "u" },
              image: [],
            },
          ],
        },
      }),
    )
    const result = await getChartTopTracks({})
    expect(text(result)).toContain("Creep")
    expect(calledUrl()).toContain("method=chart.getTopTracks")
  })

  it("returns error when fetch fails", async () => {
    mockFetch.mockReturnValue(failRes())
    const result = await getChartTopTracks({})
    expect(text(result)).toContain("Error:")
  })
})

describe("getTagTopArtists", () => {
  it("returns tag top artists on success", async () => {
    mockFetch.mockReturnValue(
      res({
        topartists: {
          "@attr": {
            tag: "shoegaze",
            page: "1",
            perPage: "50",
            totalPages: "1",
            total: "1",
          },
          artist: [
            { name: "Slowdive", url: "u", image: [], "@attr": { rank: "1" } },
          ],
        },
      }),
    )
    const result = await getTagTopArtists({ tag: "shoegaze" })
    expect(text(result)).toContain("Slowdive")
    expect(calledUrl()).toContain("method=tag.getTopArtists")
  })

  it("returns error when fetch fails", async () => {
    mockFetch.mockReturnValue(failRes())
    const result = await getTagTopArtists({ tag: "shoegaze" })
    expect(text(result)).toContain("Error:")
  })
})

describe("getTagTopTracks", () => {
  it("returns tag top tracks on success", async () => {
    mockFetch.mockReturnValue(
      res({
        toptracks: {
          "@attr": {
            tag: "shoegaze",
            page: "1",
            perPage: "50",
            totalPages: "1",
            total: "1",
          },
          track: [
            {
              name: "Alison",
              url: "u",
              artist: { name: "Slowdive", url: "u" },
              image: [],
              "@attr": { rank: "1" },
            },
          ],
        },
      }),
    )
    const result = await getTagTopTracks({ tag: "shoegaze" })
    expect(text(result)).toContain("Alison")
    expect(calledUrl()).toContain("method=tag.getTopTracks")
  })

  it("returns error when fetch fails", async () => {
    mockFetch.mockReturnValue(failRes())
    const result = await getTagTopTracks({ tag: "shoegaze" })
    expect(text(result)).toContain("Error:")
  })
})
