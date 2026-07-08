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
  getArtistTopTags,
  correctArtist,
  getAlbum,
  getAlbumTopTags,
  getTrack,
  getSimilarTracks,
  getTrackTopTags,
  correctTrack,
  getUserInfo,
  getUserRecentTracks,
  getUserTopArtists,
  getUserTopTracks,
  getUserTopAlbums,
  getUserLovedTracks,
  getUserFriends,
  getUserPersonalTags,
  getUserTopTags,
  getUserWeeklyAlbumChart,
  getUserWeeklyArtistChart,
  getUserWeeklyTrackChart,
  getUserWeeklyChartList,
  getChartTopArtists,
  getChartTopTracks,
  getChartTopTags,
  getTagTopArtists,
  getTagTopTracks,
  getTagInfo,
  getSimilarTags,
  getTagTopAlbums,
  getTopTags,
  getTagWeeklyChartList,
  getGeoTopArtists,
  getGeoTopTracks,
  getLibraryArtists,
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

describe("getArtistTopTags", () => {
  it("returns artist top tags on success", async () => {
    mockFetch.mockReturnValue(
      res({
        toptags: {
          "@attr": { artist: "Slowdive" },
          tag: [{ name: "shoegaze", count: "100", url: "u" }],
        },
      }),
    )
    const result = await getArtistTopTags({ artist: "Slowdive" })
    expect(text(result)).toContain("shoegaze")
    expect(calledUrl()).toContain("method=artist.getTopTags")
  })

  it("returns error when fetch fails", async () => {
    mockFetch.mockReturnValue(failRes())
    const result = await getArtistTopTags({ artist: "Slowdive" })
    expect(text(result)).toContain("Error:")
  })
})

describe("correctArtist", () => {
  it("returns a correction on success", async () => {
    mockFetch.mockReturnValue(
      res({
        corrections: {
          correction: {
            artist: { name: "Guns N' Roses", mbid: "m", url: "u" },
          },
        },
      }),
    )
    const result = await correctArtist({ artist: "Guns N Roses" })
    expect(text(result)).toContain("Guns N' Roses")
    expect(calledUrl()).toContain("method=artist.getCorrection")
  })

  it("returns error when fetch fails", async () => {
    mockFetch.mockReturnValue(failRes())
    const result = await correctArtist({ artist: "Guns N Roses" })
    expect(text(result)).toContain("Error:")
  })
})

describe("getAlbumTopTags", () => {
  it("returns album top tags on success", async () => {
    mockFetch.mockReturnValue(
      res({
        toptags: {
          tag: [{ name: "electronic", count: "80", url: "u" }],
          "@attr": { artist: "Boards of Canada", album: "Geogaddi" },
        },
      }),
    )
    const result = await getAlbumTopTags({
      artist: "Boards of Canada",
      album: "Geogaddi",
    })
    expect(text(result)).toContain("electronic")
    expect(calledUrl()).toContain("method=album.getTopTags")
  })

  it("returns error when fetch fails", async () => {
    mockFetch.mockReturnValue(failRes())
    const result = await getAlbumTopTags({
      artist: "Boards of Canada",
      album: "Geogaddi",
    })
    expect(text(result)).toContain("Error:")
  })
})

describe("getSimilarTracks", () => {
  it("returns similar tracks on success", async () => {
    mockFetch.mockReturnValue(
      res({
        similartracks: {
          "@attr": { artist: "Cher", track: "Believe" },
          track: [
            {
              name: "Ray of Light",
              match: "10.95",
              url: "u",
              artist: { name: "Madonna", url: "u" },
              image: [],
            },
          ],
        },
      }),
    )
    const result = await getSimilarTracks({ artist: "Cher", track: "Believe" })
    expect(text(result)).toContain("Ray of Light")
    expect(calledUrl()).toContain("method=track.getSimilar")
  })

  it("returns error when fetch fails", async () => {
    mockFetch.mockReturnValue(failRes())
    const result = await getSimilarTracks({ artist: "Cher", track: "Believe" })
    expect(text(result)).toContain("Error:")
  })
})

describe("getTrackTopTags", () => {
  it("returns track top tags on success", async () => {
    mockFetch.mockReturnValue(
      res({
        toptags: {
          "@attr": { artist: "Cher", track: "Believe" },
          tag: [{ name: "pop", count: "97", url: "u" }],
        },
      }),
    )
    const result = await getTrackTopTags({ artist: "Cher", track: "Believe" })
    expect(text(result)).toContain("pop")
    expect(calledUrl()).toContain("method=track.getTopTags")
  })

  it("returns error when fetch fails", async () => {
    mockFetch.mockReturnValue(failRes())
    const result = await getTrackTopTags({ artist: "Cher", track: "Believe" })
    expect(text(result)).toContain("Error:")
  })
})

describe("correctTrack", () => {
  it("returns a correction on success", async () => {
    mockFetch.mockReturnValue(
      res({
        corrections: {
          correction: {
            track: {
              name: "Mr. Brownstone",
              url: "u",
              artist: { name: "Guns N' Roses", url: "u" },
            },
          },
        },
      }),
    )
    const result = await correctTrack({
      artist: "Guns N Roses",
      track: "Mr Brownstone",
    })
    expect(text(result)).toContain("Mr. Brownstone")
    expect(calledUrl()).toContain("method=track.getCorrection")
  })

  it("returns error when fetch fails", async () => {
    mockFetch.mockReturnValue(failRes())
    const result = await correctTrack({
      artist: "Guns N Roses",
      track: "Mr Brownstone",
    })
    expect(text(result)).toContain("Error:")
  })
})

describe("getUserLovedTracks", () => {
  it("returns loved tracks on success", async () => {
    mockFetch.mockReturnValue(
      res({
        lovedtracks: {
          "@attr": {
            user: "kud",
            page: "1",
            perPage: "50",
            totalPages: "1",
            total: "1",
          },
          track: [
            {
              name: "Souvlaki Space Station",
              url: "u",
              artist: { name: "Slowdive", url: "u" },
              image: [],
            },
          ],
        },
      }),
    )
    const result = await getUserLovedTracks({ user: "kud" })
    expect(text(result)).toContain("Souvlaki Space Station")
    expect(calledUrl()).toContain("method=user.getLovedTracks")
  })

  it("returns error when fetch fails", async () => {
    mockFetch.mockReturnValue(failRes())
    const result = await getUserLovedTracks({ user: "kud" })
    expect(text(result)).toContain("Error:")
  })

  it("errors without hitting the API when no user and no default are set", async () => {
    const result = await getUserLovedTracks({})
    expect(text(result)).toContain("no username")
    expect(mockFetch).not.toHaveBeenCalled()
  })
})

describe("getUserFriends", () => {
  it("returns friends on success", async () => {
    mockFetch.mockReturnValue(
      res({
        friends: {
          "@attr": {
            user: "kud",
            page: "1",
            perPage: "50",
            totalPages: "1",
            total: "1",
          },
          user: [{ name: "rj", url: "u", image: [], subscriber: "0" }],
        },
      }),
    )
    const result = await getUserFriends({ user: "kud" })
    expect(text(result)).toContain("rj")
    expect(calledUrl()).toContain("method=user.getFriends")
  })

  it("returns error when fetch fails", async () => {
    mockFetch.mockReturnValue(failRes())
    const result = await getUserFriends({ user: "kud" })
    expect(text(result)).toContain("Error:")
  })
})

describe("getUserPersonalTags", () => {
  it("returns personal taggings on success", async () => {
    mockFetch.mockReturnValue(
      res({
        taggings: {
          "@attr": {
            user: "kud",
            tag: "shoegaze",
            page: "1",
            perPage: "50",
            totalPages: "1",
            total: "1",
          },
          artists: {
            artist: [{ name: "Slowdive", url: "u", image: [] }],
          },
        },
      }),
    )
    const result = await getUserPersonalTags({
      user: "kud",
      tag: "shoegaze",
      taggingtype: "artist",
    })
    expect(text(result)).toContain("Slowdive")
    expect(calledUrl()).toContain("method=user.getPersonalTags")
  })

  it("returns error when fetch fails", async () => {
    mockFetch.mockReturnValue(failRes())
    const result = await getUserPersonalTags({
      user: "kud",
      tag: "shoegaze",
      taggingtype: "artist",
    })
    expect(text(result)).toContain("Error:")
  })
})

describe("getUserTopTags", () => {
  it("returns user top tags on success", async () => {
    mockFetch.mockReturnValue(
      res({
        toptags: {
          "@attr": { user: "kud" },
          tag: [{ name: "shoegaze", count: "12", url: "u" }],
        },
      }),
    )
    const result = await getUserTopTags({ user: "kud" })
    expect(text(result)).toContain("shoegaze")
    expect(calledUrl()).toContain("method=user.getTopTags")
  })

  it("returns error when fetch fails", async () => {
    mockFetch.mockReturnValue(failRes())
    const result = await getUserTopTags({ user: "kud" })
    expect(text(result)).toContain("Error:")
  })
})

describe("getUserWeeklyAlbumChart", () => {
  it("returns weekly album chart on success", async () => {
    mockFetch.mockReturnValue(
      res({
        weeklyalbumchart: {
          "@attr": { user: "kud", from: "1", to: "2" },
          album: [
            {
              name: "Souvlaki",
              url: "u",
              playcount: "10",
              artist: { "#text": "Slowdive" },
              "@attr": { rank: "1" },
            },
          ],
        },
      }),
    )
    const result = await getUserWeeklyAlbumChart({ user: "kud" })
    expect(text(result)).toContain("Souvlaki")
    expect(calledUrl()).toContain("method=user.getWeeklyAlbumChart")
  })

  it("returns error when fetch fails", async () => {
    mockFetch.mockReturnValue(failRes())
    const result = await getUserWeeklyAlbumChart({ user: "kud" })
    expect(text(result)).toContain("Error:")
  })
})

describe("getUserWeeklyArtistChart", () => {
  it("returns weekly artist chart on success", async () => {
    mockFetch.mockReturnValue(
      res({
        weeklyartistchart: {
          "@attr": { user: "kud", from: "1", to: "2" },
          artist: [
            {
              name: "Slowdive",
              url: "u",
              playcount: "10",
              "@attr": { rank: "1" },
            },
          ],
        },
      }),
    )
    const result = await getUserWeeklyArtistChart({ user: "kud" })
    expect(text(result)).toContain("Slowdive")
    expect(calledUrl()).toContain("method=user.getWeeklyArtistChart")
  })

  it("returns error when fetch fails", async () => {
    mockFetch.mockReturnValue(failRes())
    const result = await getUserWeeklyArtistChart({ user: "kud" })
    expect(text(result)).toContain("Error:")
  })
})

describe("getUserWeeklyTrackChart", () => {
  it("returns weekly track chart on success", async () => {
    mockFetch.mockReturnValue(
      res({
        weeklytrackchart: {
          "@attr": { user: "kud", from: "1", to: "2" },
          track: [
            {
              name: "Alison",
              url: "u",
              playcount: "10",
              artist: { "#text": "Slowdive" },
              "@attr": { rank: "1" },
            },
          ],
        },
      }),
    )
    const result = await getUserWeeklyTrackChart({ user: "kud" })
    expect(text(result)).toContain("Alison")
    expect(calledUrl()).toContain("method=user.getWeeklyTrackChart")
  })

  it("returns error when fetch fails", async () => {
    mockFetch.mockReturnValue(failRes())
    const result = await getUserWeeklyTrackChart({ user: "kud" })
    expect(text(result)).toContain("Error:")
  })
})

describe("getUserWeeklyChartList", () => {
  it("returns weekly chart list on success", async () => {
    mockFetch.mockReturnValue(
      res({
        weeklychartlist: {
          "@attr": { user: "kud" },
          chart: [{ from: "1108296002", to: "1108900802" }],
        },
      }),
    )
    const result = await getUserWeeklyChartList({ user: "kud" })
    expect(text(result)).toContain("1108296002")
    expect(calledUrl()).toContain("method=user.getWeeklyChartList")
  })

  it("returns error when fetch fails", async () => {
    mockFetch.mockReturnValue(failRes())
    const result = await getUserWeeklyChartList({ user: "kud" })
    expect(text(result)).toContain("Error:")
  })
})

describe("getChartTopTags", () => {
  it("returns chart top tags on success", async () => {
    mockFetch.mockReturnValue(
      res({
        tags: {
          "@attr": {
            page: "1",
            perPage: "50",
            totalPages: "5",
            total: "250",
          },
          tag: [
            {
              name: "rock",
              url: "u",
              reach: "309437",
              taggings: "3064604",
            },
          ],
        },
      }),
    )
    const result = await getChartTopTags({})
    expect(text(result)).toContain("rock")
    expect(calledUrl()).toContain("method=chart.getTopTags")
  })

  it("returns error when fetch fails", async () => {
    mockFetch.mockReturnValue(failRes())
    const result = await getChartTopTags({})
    expect(text(result)).toContain("Error:")
  })
})

describe("getTagInfo", () => {
  it("returns tag info on success", async () => {
    mockFetch.mockReturnValue(
      res({
        tag: {
          name: "shoegaze",
          url: "u",
          reach: "1000",
          taggings: "5000",
        },
      }),
    )
    const result = await getTagInfo({ tag: "shoegaze" })
    expect(text(result)).toContain("shoegaze")
    expect(calledUrl()).toContain("method=tag.getInfo")
  })

  it("returns error when fetch fails", async () => {
    mockFetch.mockReturnValue(failRes())
    const result = await getTagInfo({ tag: "shoegaze" })
    expect(text(result)).toContain("Error:")
  })
})

describe("getSimilarTags", () => {
  it("returns similar tags on success", async () => {
    mockFetch.mockReturnValue(
      res({
        similartags: {
          tag: [{ name: "dream pop", url: "u", streamable: "1" }],
        },
      }),
    )
    const result = await getSimilarTags({ tag: "shoegaze" })
    expect(text(result)).toContain("dream pop")
    expect(calledUrl()).toContain("method=tag.getSimilar")
  })

  it("returns error when fetch fails", async () => {
    mockFetch.mockReturnValue(failRes())
    const result = await getSimilarTags({ tag: "shoegaze" })
    expect(text(result)).toContain("Error:")
  })
})

describe("getTagTopAlbums", () => {
  it("returns tag top albums on success", async () => {
    mockFetch.mockReturnValue(
      res({
        topalbums: {
          "@attr": {
            tag: "shoegaze",
            page: "1",
            perPage: "50",
            totalPages: "1",
            total: "1",
          },
          album: [
            {
              name: "Souvlaki",
              url: "u",
              artist: { name: "Slowdive", url: "u" },
              image: [],
              "@attr": { rank: "1" },
            },
          ],
        },
      }),
    )
    const result = await getTagTopAlbums({ tag: "shoegaze" })
    expect(text(result)).toContain("Souvlaki")
    expect(calledUrl()).toContain("method=tag.getTopAlbums")
  })

  it("returns error when fetch fails", async () => {
    mockFetch.mockReturnValue(failRes())
    const result = await getTagTopAlbums({ tag: "shoegaze" })
    expect(text(result)).toContain("Error:")
  })
})

describe("getTopTags", () => {
  it("returns global top tags on success", async () => {
    mockFetch.mockReturnValue(
      res({
        toptags: {
          tag: [{ name: "rock", count: "1994155", url: "u" }],
        },
      }),
    )
    const result = await getTopTags()
    expect(text(result)).toContain("rock")
    expect(calledUrl()).toContain("method=tag.getTopTags")
  })

  it("returns error when fetch fails", async () => {
    mockFetch.mockReturnValue(failRes())
    const result = await getTopTags()
    expect(text(result)).toContain("Error:")
  })
})

describe("getTagWeeklyChartList", () => {
  it("returns tag weekly chart list on success", async () => {
    mockFetch.mockReturnValue(
      res({
        weeklychartlist: {
          "@attr": { tag: "shoegaze" },
          chart: [{ from: "1108296002", to: "1108900802" }],
        },
      }),
    )
    const result = await getTagWeeklyChartList({ tag: "shoegaze" })
    expect(text(result)).toContain("1108296002")
    expect(calledUrl()).toContain("method=tag.getWeeklyChartList")
  })

  it("returns error when fetch fails", async () => {
    mockFetch.mockReturnValue(failRes())
    const result = await getTagWeeklyChartList({ tag: "shoegaze" })
    expect(text(result)).toContain("Error:")
  })
})

describe("getGeoTopArtists", () => {
  it("returns geo top artists on success", async () => {
    mockFetch.mockReturnValue(
      res({
        topartists: {
          "@attr": {
            country: "United Kingdom",
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
    const result = await getGeoTopArtists({ country: "United Kingdom" })
    expect(text(result)).toContain("Slowdive")
    expect(calledUrl()).toContain("method=geo.getTopArtists")
  })

  it("returns error when fetch fails", async () => {
    mockFetch.mockReturnValue(failRes())
    const result = await getGeoTopArtists({ country: "United Kingdom" })
    expect(text(result)).toContain("Error:")
  })
})

describe("getGeoTopTracks", () => {
  it("returns geo top tracks on success", async () => {
    mockFetch.mockReturnValue(
      res({
        tracks: {
          "@attr": { country: "United Kingdom" },
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
    const result = await getGeoTopTracks({ country: "United Kingdom" })
    expect(text(result)).toContain("Alison")
    expect(calledUrl()).toContain("method=geo.getTopTracks")
  })

  it("returns error when fetch fails", async () => {
    mockFetch.mockReturnValue(failRes())
    const result = await getGeoTopTracks({ country: "United Kingdom" })
    expect(text(result)).toContain("Error:")
  })
})

describe("getLibraryArtists", () => {
  it("returns library artists on success", async () => {
    mockFetch.mockReturnValue(
      res({
        artists: {
          "@attr": {
            user: "kud",
            page: "1",
            perPage: "50",
            totalPages: "1",
            total: "1",
          },
          artist: [{ name: "Slowdive", playcount: "100", url: "u", image: [] }],
        },
      }),
    )
    const result = await getLibraryArtists({ user: "kud" })
    expect(text(result)).toContain("Slowdive")
    expect(calledUrl()).toContain("method=library.getArtists")
  })

  it("returns error when fetch fails", async () => {
    mockFetch.mockReturnValue(failRes())
    const result = await getLibraryArtists({ user: "kud" })
    expect(text(result)).toContain("Error:")
  })

  it("errors without hitting the API when no user and no default are set", async () => {
    const result = await getLibraryArtists({})
    expect(text(result)).toContain("no username")
    expect(mockFetch).not.toHaveBeenCalled()
  })
})
