/*
* ScoreCalculator.js - Counting score 
*/

class ScoreCalculator {
    static calculateRoundScore(bid, tricks) {
        const success = bid === tricks;
        const points = success ? 10 + bid : 0;

        return {success, points};
    }

    // Count round scores for all players
    static calculateRoundResults(players, bids, tricks, currentRound){
        const results = [];

        for (let i = 0 ; i< players.length; i++) {
            const bid = bids[i];
            const tricksTaken = tricks[i];
            const {success, points} = ScoreCalculator.calculateRoundScore(bid, tricksTaken);

            results.push({
                playerIndex: i,
                playerName: players[i].playerName,
                round: currentRound,
                bid: bid,
                tricks: tricksTaken,
                success: success,
                points: points
            });
        }

        return results;
    }

    // Calculate total score
    static calculateTotalScore(scoreHistory) {
        return scoreHistory.reduce((sum, round) => sum + round.points, 0);
    }

    // Calculate final score and sort players
    static calculateFinalScores(players, scores ) {
        const finalScores = players.map((player, i) => {
            const total = ScoreCalculator.calculateTotalScore(scores[i]);
            return {
                playerIndex: i,
                playerName: player.playerName,
                total: total,
                rounds: scores[i]
            };
        });

        //sorting 
        finalScores.sort((a,b) => b.total - a.total);
        return finalScores;
    }

    //Get player rank
    static getPlayerRank(playerIndex, finalScores){
        const index = finalScores.findIndex(score => score.playerIndex === playerIndex);
        return index + 1;
    }

    //Get winner
    static getWinner(finalScores){
        return finalScores[0];
    }

    // Check if players bid is false
    static bidFalse(bid, tricks){
        return bid !== tricks
    }

    // Count statistics 
    static calculateStatistics(scores){
        const stats = {
            totalRounds: scores.length,
            successfulRounds: scores.filter(s => s.success).length,
            failedRounds: scores.filter(f => !f.success).length,
            totalPoints: ScoreCalculator.calculateTotalScore(scores),
            successRate: 0,
            averagePointsPerRound:0
        };

        if (stats.totalRounds > 0) {
            stats.successRate = (stats.successfulRounds / stats.totalRounds * 100).toFixed(1);
            stats.averagePointsPerRound = (stats.totalPoints / stats.totalRounds).toFixed(1);   
        }

        return stats;
    }
}

module.exports = ScoreCalculator