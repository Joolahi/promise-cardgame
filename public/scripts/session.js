// LocalStorage control
export function getOrCreateSessionId() {
    let sessionId = localStorage.getItem('lupaus_sessionId');

    if (!sessionId) {
        sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('lupaus_sessionId', sessionId);
        console.log('🆔 Luotiin uusi session ID:', sessionId);
    } else {
        console.log('🆔 Käytetään olemassa olevaa session ID:', sessionId);
    }

    return sessionId;
}

export function savePlayerSession(playerName, roomId) {
    localStorage.setItem('lupaus_playerName', playerName);
    localStorage.setItem('lupaus_roomId', roomId);
    console.log('💾 Session tallennettu:', { playerName, roomId });
}

export function loadPlayerSession() {
    return {
        sessionId: localStorage.getItem('lupaus_sessionId'),
        playerName: localStorage.getItem('lupaus_playerName'),
        roomId: localStorage.getItem('lupaus_roomId')
    };
}

export function clearPlayerSession() {
    localStorage.removeItem('lupaus_sessionId');
    localStorage.removeItem('lupaus_playerName');
    localStorage.removeItem('lupaus_roomId');
    console.log('🗑️ Session poistettu');
}