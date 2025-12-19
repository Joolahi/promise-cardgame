/*
* Rules.js - Rules of the game 
*/

class Rules {
    //Validate if the bid is allowed
    static isValidBid (bid, cardsThisRound, currentBids, isLastBidder) {
        if (bid < 0 || bid > cardsThisRound) {
            return {
                valid: false,
                reason: `Lupauksen tulee olla 0-${cardsThisRound}`
            };
        }

        //Last bidder rule
        if (isLastBidder) {
            const sum = currentBids.reduce((a, b) => a + b, 0);
            const forbidden = cardsThisRound - sum;

            if (forbidden >= 0 && forbidden <= cardsThisRound && bid === forbidden) {
                return{
                    valid: false,
                    reason: `Viimeinen pelaaja ei voi luvata ${forbidden}, koska se tekisi lupausten summan yhtä suureksi kuin korttien määrä.`
                };
            }
        }
        return {valid: true};
    }

    // Check if player can play the card (SUIT).
    static canPlayCard(card, hand, leadSuit){
        if (leadSuit === null ){
            return { valid: true};
        }

        // Check if player has wanted suit
        const hasSuit = hand.some(c => c.suit ===leadSuit);

        if(!hasSuit) {
            return {valid: true};
        }

        if (card.suit !== leadSuit) {
            return {
                valid: false,
                reason: 'Saamaa maata on pelattava - sinulla on kortteja samasta maasta.'
            };
        }
        return {valid: true};
    }

    //Define winner of the trick
    static getTrickWinner(trick, leadSuit) {
        if (!trick || trick.length === 0){
            return null;
        }

        let winningPlay = trick[0];

        if (leadSuit === null){
            return winningPlay.playerIndex;
        }
        
        for (let play of trick) {
            if(play.card.suit === leadSuit) {
                if(winningPlay.card.suit !== leadSuit || play.card.value > winningPlay.card.value) {
                    winningPlay = play;
                }
            } 
        }
        return winningPlay.playerIndex;
    }

    //Define who will start the round

    static getStartingPlayer(bids, dealerIndex) {
        const maxBid = Math.max(...bids);
        // indexOf returns the first index where maxbid exsits => first biggest bidder will start
        const starterIndex = bids.indexOf(maxBid);
        return starterIndex;
    }

    // Count the forbidden bid
    static getForbiddenBid(currentBids, cardsThisRound){
        const sum = currentBids.reduce((a, b) => a + b, 0)
        const forbidden = cardsThisRound - sum;

        if (forbidden >= 0 && forbidden <= cardsThisRound) {
            return forbidden;
        }

        return null;
    }

    // Check if the game is finnished 
    static isGameFinished(currentRound, startCards) {
        const totalRounds = (startCards * 2) - 1;
        return currentRound >= totalRounds;
    }

    // Validating amount of the players
    static isValidPlayerCount(count, min = 3, max = 5 ){
        return count >= min && count <= max;
    }
}

module.exports = Rules;