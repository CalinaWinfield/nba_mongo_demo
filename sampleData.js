/**
 * sampleData.js — NBA sample games & player documents
 * Matches the schema in stats.games (Home/Away team matchup with actual team scores and player box scores)
 */

function getSampleGames() {
  return [
    {
      _id: "69e79b9d56cd4d0b6aed1a8f",
      game_id: 38,
      game_date: "2026-01-09",
      home_team: {
        team_id: 8,
        team_name: "Denver Nuggets",
        team_score: 87,
      },
      away_team: {
        team_id: 1,
        team_name: "Atlanta Hawks",
        team_score: 110,
      },
      players: [
        {
          player_id: 107,
          name: "Nikola Jokic",
          team_id: 8,
          stats: {
            points: 34,
            rebounds: 13,
            assists: 9,
            steals: 1,
            blocks: 2,
            minutes: 36,
          },
        },
        {
          player_id: 108,
          name: "Jamal Murray",
          team_id: 8,
          stats: {
            points: 26,
            rebounds: 4,
            assists: 7,
            steals: 2,
            blocks: 0,
            minutes: 34,
          },
        },
        {
          player_id: 103,
          name: "Trae Young",
          team_id: 1,
          stats: {
            points: 28,
            rebounds: 3,
            assists: 10,
            steals: 1,
            blocks: 0,
            minutes: 37,
          },
        },
        {
          player_id: 104,
          name: "Dejounte Murray",
          team_id: 1,
          stats: {
            points: 20,
            rebounds: 6,
            assists: 5,
            steals: 1,
            blocks: 0,
            minutes: 35,
          },
        },
      ],
    },
    {
      _id: "69e79b9d56cd4d0b6aed1a90",
      game_id: 41,
      game_date: "2026-01-15",
      home_team: {
        team_id: 3,
        team_name: "San Antonio Spurs",
        team_score: 119,
      },
      away_team: {
        team_id: 9,
        team_name: "Milwaukee Bucks",
        team_score: 101,
      },
      players: [
        {
          player_id: 105,
          name: "Victor Wembanyama",
          team_id: 3,
          stats: {
            points: 31,
            rebounds: 11,
            assists: 4,
            steals: 1,
            blocks: 3,
            minutes: 33,
          },
        },
        {
          player_id: 106,
          name: "Keldon Johnson",
          team_id: 3,
          stats: {
            points: 17,
            rebounds: 6,
            assists: 2,
            steals: 1,
            blocks: 0,
            minutes: 29,
          },
        },
        {
          player_id: 109,
          name: "Giannis Antetokounmpo",
          team_id: 9,
          stats: {
            points: 35,
            rebounds: 12,
            assists: 5,
            steals: 1,
            blocks: 1,
            minutes: 36,
          },
        },
        {
          player_id: 110,
          name: "Damian Lillard",
          team_id: 9,
          stats: {
            points: 29,
            rebounds: 4,
            assists: 9,
            steals: 1,
            blocks: 0,
            minutes: 37,
          },
        },
      ],
    },
    {
      _id: "69e79b9d56cd4d0b6aed1a91",
      game_id: 67,
      game_date: "2026-03-14",
      home_team: {
        team_id: 1,
        team_name: "Atlanta Hawks",
        team_score: 122,
      },
      away_team: {
        team_id: 9,
        team_name: "Milwaukee Bucks",
        team_score: 99,
      },
      players: [
        {
          player_id: 103,
          name: "Trae Young",
          team_id: 1,
          stats: {
            points: 27,
            rebounds: 4,
            assists: 11,
            steals: 1,
            blocks: 0,
            minutes: 36,
          },
        },
        {
          player_id: 104,
          name: "Dejounte Murray",
          team_id: 1,
          stats: {
            points: 18,
            rebounds: 7,
            assists: 3,
            steals: 2,
            blocks: 0,
            minutes: 34,
          },
        },
        {
          player_id: 109,
          name: "Giannis Antetokounmpo",
          team_id: 9,
          stats: {
            points: 33,
            rebounds: 13,
            assists: 6,
            steals: 1,
            blocks: 1,
            minutes: 37,
          },
        },
        {
          player_id: 110,
          name: "Damian Lillard",
          team_id: 9,
          stats: {
            points: 28,
            rebounds: 3,
            assists: 8,
            steals: 1,
            blocks: 0,
            minutes: 36,
          },
        },
      ],
    },
  ];
}

/**
 * Returns team scores directly from home_team.team_score and away_team.team_score in database
 */
function enrichGameWithScores(game) {
  const homeScore =
    game.home_team?.team_score ??
    game.home_score ??
    (game.players || []).reduce(
      (sum, p) => (p.team_id === game.home_team?.team_id ? sum + (p.stats?.points || 0) : sum),
      0
    );

  const awayScore =
    game.away_team?.team_score ??
    game.away_score ??
    (game.players || []).reduce(
      (sum, p) => (p.team_id === game.away_team?.team_id ? sum + (p.stats?.points || 0) : sum),
      0
    );

  return {
    ...game,
    home_score: homeScore,
    away_score: awayScore,
  };
}

/**
 * Flattens nested game players into individual player log entries
 */
function flattenGamePlayers(games) {
  const flat = [];
  (games || []).forEach((game) => {
    const homeTeam = game.home_team || {};
    const awayTeam = game.away_team || {};

    (game.players || []).forEach((p) => {
      const isHome = p.team_id === homeTeam.team_id;
      const team = isHome ? homeTeam.team_name : awayTeam.team_name;
      const opponent = isHome ? awayTeam.team_name : homeTeam.team_name;

      flat.push({
        _id: `${game.game_id || game._id}_${p.player_id}`,
        game_id: game.game_id,
        game_date: game.game_date,
        gameDate: game.game_date, // backward compatibility
        player_id: p.player_id,
        player: p.name,
        name: p.name,
        team_id: p.team_id,
        team: team || "N/A",
        opponent: opponent || "N/A",
        is_home: isHome,
        points: p.stats?.points ?? 0,
        rebounds: p.stats?.rebounds ?? 0,
        assists: p.stats?.assists ?? 0,
        steals: p.stats?.steals ?? 0,
        blocks: p.stats?.blocks ?? 0,
        minutes: p.stats?.minutes ?? 0,
        stats: p.stats || {},
      });
    });
  });
  return flat;
}

/**
 * Backward compatibility alias for existing code
 */
function getSampleGameLogs() {
  return flattenGamePlayers(getSampleGames());
}

module.exports = {
  getSampleGames,
  enrichGameWithScores,
  flattenGamePlayers,
  getSampleGameLogs,
};
