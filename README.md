<div align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white)
![npm](https://img.shields.io/npm/v/%40kud%2Fmcp-lastfm?style=flat-square&color=CB3837)
![MIT](https://img.shields.io/badge/licence-MIT-22C55E?style=flat-square)

**MCP server for Last.fm — discover artists, albums and tracks, and browse scrobble history and charts.**

<a href="https://kud.io/projects/mcp-lastfm">Website</a> · <a href="https://kud.io/projects/mcp-lastfm/docs">Documentation</a>

</div>

## Features

- **18 read-only tools** — search, artist, album/track, user, chart, and tag lookups, all backed by the official Last.fm API
- **Scrobble history at a glance** — pull any user's recent tracks, top artists, top tracks, and top albums over a chosen time period
- **Global and tag charts** — surface what's trending on Last.fm overall or within a specific tag, e.g. `shoegaze`
- **Just an API key** — a single `MCP_LASTFM_API_KEY`, no OAuth flow or session handshake; set an optional `MCP_LASTFM_USERNAME` to default the user tools to your own account
- **Safe by design** — read-only throughout; no scrobbling, no writes, nothing that touches a user's Last.fm account

## Install

```sh
npm install -g @kud/mcp-lastfm
```

Or install as a Claude plugin from the kud marketplace:

```
/plugin install lastfm@kud
```

> npm publish is pending — until `@kud/mcp-lastfm` lands on the registry, install from source (see [Development](#development)).

### Getting an API key

1. Go to [last.fm/api/account/create](https://www.last.fm/api/account/create) (you'll need to be signed in to a Last.fm account).
2. Fill in **Application name** (e.g. `mcp-lastfm`) and a short **description**. Leave **Callback URL** blank — it's only used for the web login flow, which this read-only server doesn't need.
3. Submit. Last.fm shows you an **API key** and a **shared secret** — you only need the **API key**. (The shared secret is for signed write calls like scrobbling, which aren't supported here.)

### Configuration

Add it to your MCP client config:

```json
{
  "mcpServers": {
    "lastfm": {
      "command": "mcp-lastfm",
      "env": {
        "MCP_LASTFM_API_KEY": "your-api-key",
        "MCP_LASTFM_USERNAME": "your-lastfm-username"
      }
    }
  }
}
```

| Variable              | Required | Purpose                                                                                                                                                                                                                  |
| --------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `MCP_LASTFM_API_KEY`  | yes      | Authenticates every request                                                                                                                                                                                              |
| `MCP_LASTFM_USERNAME` | no       | Default account for the `get_user_*` tools, so you can ask "what have I been listening to?" without repeating your username. An explicit `user` argument still overrides it, so you can look up anyone's public profile. |

## Usage

Once connected, ask your MCP client things like:

```console
> Search for the artist "Slowdive"
> What are Radiohead's top tracks?
> Show me my recent scrobbles
> What's trending on the shoegaze tag right now?
```

### Tools

**Search** — `search_artists` · `search_albums` · `search_tracks`

**Artist** — `get_artist` · `get_similar_artists` · `get_artist_top_tracks` · `get_artist_top_albums`

**Album & Track** — `get_album` · `get_track`

**User** — `get_user_info` · `get_user_recent_tracks` · `get_user_top_artists` · `get_user_top_tracks` · `get_user_top_albums`

**Chart** — `get_chart_top_artists` · `get_chart_top_tracks`

**Tag** — `get_tag_top_artists` · `get_tag_top_tracks`

## Development

```sh
git clone https://github.com/kud/mcp-lastfm.git
cd mcp-lastfm
npm install
MCP_LASTFM_API_KEY=your-api-key MCP_LASTFM_USERNAME=your-username npm run dev
```

Inspect the server interactively with the MCP inspector:

```sh
npm run inspect:dev
```

📚 **Full documentation → [mcp-lastfm/docs](https://kud.io/projects/mcp-lastfm/docs)**
</content>
