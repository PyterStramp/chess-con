
//--------------DOM elements-------------

const room = document.getElementById("game-room");
const boxes = document.querySelectorAll(".box");
const playerWhite = document.getElementById("player-white");
const playerBlack = document.getElementById("player-black");
const waitingMessage = document.getElementById("waiting-message");
const playerWhiteTimer = playerWhite.querySelector(".timer");
const playerBlackTimer = playerBlack.querySelector(".timer");
const whiteCapturedPieces = document.getElementById("white-captured-pieces");
const blackCapturedPieces = document.getElementById("black-captured-pieces");

const piecesToPromoteContainer = document.getElementById("pieces-to-promote-container");
const piecesToPromote = document.getElementById("pieces-to-promote");
const gameOverMessageContainer = document.getElementById("game-over-message-container");
const winnerUsername = gameOverMessageContainer.querySelector("p strong");
const myScoreElement = document.getElementById("my-score");
const enemyScoreElement = document.getElementById("enemy-score");

//--------game variables------------------

let user = null;

let search = window.location.search.split("&");

let roomId = null;
let password = null;

let gameDetails = null; //time & players

let gameHasTimer = false;
let timer = null; //class timer
let myTurn = false;
//game
let kingIsAttacked = false;
let pawnToPromotePosition = null;
let castling = null;
let gameOver = false;
let myScore = 0;
let enemyScore = 0;

let isWhiteKingMoved = false;
let isBlackKingMoved = false;
let isWhiteLeftRookMoved = false;
let isWhiteRightRookMoved = false;
let isBlackLeftRookMoved = false;
let isBlackRightRookMoved = false;
let gameStartedAtTimeStamp = null;

if(search.length > 1) {
    roomId = search[0].split("=")[1];
    password = search[1].split("=")[1];
} else {
    roomId = search[0].split("=")[1];
}

//------------functions-----------------

const fetchUserCallback = (data) => {
    user=data;
    if (password) {
        socket.emit("user-connected", user, roomId, password);
    } else {
        socket.emit("user-connected", user, roomId);
    }

    socket.emit("get-game-details", roomId, user);
}

fetchData("/api/user-info", fetchUserCallback);

//chessboard
const displayChessPieces = () => {
    boxes.forEach(box => {
        box.innerHTML = "";
    });

    whitePieces.forEach(piece => {
        let box = document.getElementById(piece.position);
        box.innerHTML += `
            <div class="piece white" data-piece="${piece.piece}" data-points="${piece.points}">
                <img src="${piece.icon}" alt="Chess Piece">
            </div>
        `;
    });

    blackPieces.forEach(piece => {
        let box = document.getElementById(piece.position);
        box.innerHTML += `
            <div class="piece black" data-piece="${piece.piece}" data-points="${piece.points}">
                <img src="${piece.icon}" alt="Chess Piece">
            </div>
        `;
    });
    addPieceListeners();
}
//-------------

const onClickPiece = (e) => {
    if (!myTurn || gameOver) {
        return;
    }

    hidePossibleMoves();

    let element = e.target.closest(".piece");
    let position = element.parentNode.id;
    let piece = element.dataset.piece;

    if (selectedPiece && selectedPiece.piece === piece && selectedPiece.position === position) {
        hidePossibleMoves();
        selectedPiece = null;
        return;
    }
    selectedPiece = {position, piece}
    let possibleMoves = findPossibleMoves(position, piece);
    showPossibleMoves(possibleMoves);
}

const addPieceListeners = () => {
    document.querySelectorAll(`.piece.${player}`).forEach((piece)=> {
        piece.addEventListener("click", onClickPiece);
    });

    document.querySelectorAll(`.piece.${enemy}`).forEach((piece)=> {
        piece.style.cursor = "default";
    });
}

//possible moves

const showPossibleMoves = (possibleMoves) => {
    possibleMoves.forEach(box => {
        let possibleMoveBox = document.createElement('div')
        possibleMoveBox.classList.add("possible-move");

        possibleMoveBox.addEventListener("click", move);

        box.appendChild(possibleMoveBox);
    })
}

const hidePossibleMoves = () => {
    document.querySelectorAll('.possible-move').forEach(possibleMoveBox => {
        let parent = possibleMoveBox.parentNode;
        possibleMoveBox.removeEventListener('click', move)
        parent.removeChild(possibleMoveBox)
    })
}

const findPossibleMoves = (position, piece) => {
    let splittedPosition = position.split("-");
    let yAxisPosition = parseInt(splittedPosition[1]);
    let xAxisPosition = splittedPosition[0];

    let yAxisIndex = yAxis.findIndex(y => y===yAxisPosition);
    let xAxisIndex = xAxis.findIndex(x => x===xAxisPosition);

    switch(piece) {
        case "pawn":
            return getPawnPossibleMoves(xAxisPosition, yAxisPosition, xAxisIndex, yAxisIndex);
        case "rook":
            return getRookPossibleMoves(xAxisPosition, yAxisPosition, xAxisIndex, yAxisIndex);
        case "bishop":
            return getBishopPossibleMoves(xAxisIndex, yAxisIndex);
        case "knight":
            return getKnightPossibleMoves(xAxisIndex, yAxisIndex);
        case "queen":
            return Array.prototype.concat(
                getBishopPossibleMoves(xAxisIndex, yAxisIndex),
                getRookPossibleMoves(xAxisPosition, yAxisPosition, xAxisIndex, yAxisIndex)
            );
        case "king":
            return getKingPossibleMoves(xAxisPosition, yAxisPosition, xAxisIndex, yAxisIndex);
        default:
            return [];
    }
}

//timer
const updateTimer = (currentPlayer, minutes, seconds) => {
    if(currentPlayer === 'white'){
        playerWhiteTimer.innerText = 
            `${minutes >= 10 ? minutes : "0" + minutes}:${seconds >= 10 ? seconds : "0" + seconds}`
    }else{
        playerBlackTimer.innerText = 
            `${minutes >= 10 ? minutes : "0" + minutes}:${seconds >= 10 ? seconds : "0" + seconds}` 
    }
}

const timerEndedCallback = () => {
    socket.emit('timer-ended', roomId, user.username, gameStartedAtTimeStamp)
}

//game logic---------------------------------------------
const setCursor = (cursor) => {
    document.querySelectorAll(`.piece.${player}`).forEach(piece => {
        piece.getElementsByClassName.cursor = cursor;
    });
}
const startGame = (playerTwo) => {
    playerBlack.querySelector(".username").innerText = playerTwo.username;

    waitingMessage.classList.add("hidden");
    playerBlack.classList.remove("hidden");

    displayChessPieces()
    setPiecesToPromote();
}

const setKingIsAttacked = (isAttacked) => {
    kingIsAttacked = isAttacked;

    let myKing = document.getElementById(getKingPosition(player)).children[0];

    if(isAttacked){
        myKing.classList.add('warning-block');
        displayToast("Your king is under attack");
    }else{
        myKing.classList.remove('warning-block');
    }
}

const endMyTurn = (newPieceBox, pawnPromoted=false, castlingPerformed=false, enPassantPerformed = false) => {
    if (kingIsAttacked) {
        setKingIsAttacked(false);
    }

    myTurn = false;

    setCursor("default");

    saveMove(newPieceBox, pawnPromoted, castlingPerformed, enPassantPerformed);

    checkIfKingIsAttacked(enemy);
}

//move logic

const move = (e) => {
    let boxToMove = e.target.parentNode;
    let currentBox = document.getElementById(selectedPiece.position);
    let piece = currentBox.querySelector(".piece");

    hidePossibleMoves();

    let pieceToRemove = null;
    let pieceToRemovePieceImg = null;

    if (
        selectedPiece.piece === "king" &&
        Math.abs(
            xAxis.findIndex((x) => x === currentBox.id[0]) -
            xAxis.findIndex((x) => x === boxToMove.id[0])
        ) > 1
    ) {
        
        performCastling(player, currentBox.id, boxToMove.id);
        return;
    }

    if (boxToMove.children.length > 0) {
        pieceToRemove = boxToMove.children[0];
        pieceToRemovePieceImg = pieceToRemove.children[0];
    }

    if (piece.dataset.piece === "king") {
        if (player === "white") {
            isWhiteKingMoved = true;
        } else {
            isBlackKingMoved = true;
        }
    } else if (piece.dataset.piece === "rook") {
        if (player === "white") {
            if (selectedPiece.position === "A-8") {
                isWhiteLeftRookMoved = true;
            } else if (selectedPiece.position === "H-8") {
                isWhiteRightRookMoved = true;
            }
        } else {
            if (selectedPiece.position === "A-1") {
                isBlackLeftRookMoved = true;
            } else if (selectedPiece.position === "H-1") {
                isBlackRightRookMoved = true;
            }
        }
    }

    currentBox.innerHTML="";
    if(pieceToRemove){
        capturePiece(pieceToRemove)
        boxToMove.innerHTML = ""
    }

    boxToMove.appendChild(piece)

    let boxesNeededForCheck = {
        currentBox, boxToMove
    }

    let piecesNeededForCheck = {
        piece, pieceToRemove, pieceToRemovePieceImg
    }

    let isMovePossible = canMakeMove(boxesNeededForCheck, piecesNeededForCheck);

    if(!isMovePossible){
        return;
    }
    if (piece.dataset.piece === 'pawn') {
        //pawn promotion check
        if(
            (player === 'white' && boxToMove.id[2] === '1') ||
            (player === 'black' && boxToMove.id[2] === '8')
        ){
            let canBePromoted = isPawnAtTheEndOfTheBoard(player, boxToMove.id);

            if(canBePromoted){
                pawnToPromotePosition = boxToMove.id;

                piecesToPromoteContainer.classList.remove('hidden');

                return;
            }
        }
        
        if(enPassantPositions[boxToMove.id]){
            performEnPassant(player, currentBox.id, boxToMove.id);

            return;
        }

    }

    if(checkForDraw()){
        endGame();
        socket.emit("draw", roomId);
    }

    endMyTurn(boxToMove);
}

const canMakeMove = ({currentBox, boxToMove},{piece, pieceToRemove, pieceToRemovePieceImg}) => {
    
    let moveIsNotValid = checkIfKingIsAttacked(player);

    if(moveIsNotValid){
        selectedPiece = null;

        if(pieceToRemove){
            pieceToRemove.appendChild(pieceToRemovePieceImg);

            boxToMove.removeChild(piece);
            boxToMove.appendChild(pieceToRemove);

            if(pieceToRemove.classList.contains("black")){
                blackCapturedPieces.removeChild(blackCapturedPieces.lastChild);
            }else{
                whiteCapturedPieces.removeChild(whiteCapturedPieces.lastChild);
            }
        }

        currentBox.appendChild(piece);

        displayToast("Your King is attacked, reconsider the move");

        return false
    }

    return true
}

const capturePiece = (pieceToRemove) => {
    let pawnImg = pieceToRemove.children[0];

    let li = document.createElement('li')
    li.appendChild(pawnImg);

    if(pieceToRemove.classList.contains('black')){
        blackCapturedPieces.appendChild(li);

        if(!gameOver){
            if(player === 'white'){
                myScore += parseInt(pieceToRemove.dataset.points);
            }else{
                enemyScore += parseInt(pieceToRemove.dataset.points);
            }
        }
    }else{
        whiteCapturedPieces.appendChild(li);

        if(!gameOver){
            if(player === 'black'){
                myScore += parseInt(pieceToRemove.dataset.points);
            }else{
                enemyScore += parseInt(pieceToRemove.dataset.points);
            }
        }
    }
}

const checkIfKingIsAttacked = (playerToCheck) => {
    let kingPosition = getKingPosition(playerToCheck);

    let check = isCheck(kingPosition, playerToCheck === player);

    if(check){
        if(player !== playerToCheck){
            if(isCheckmate(kingPosition)){
                socket.emit('checkmate', roomId, user.username, myScore, gameStartedAtTimeStamp);
                endGame(user.username);
            }else{
                socket.emit('check', roomId);
            }
        } 
        
        return true;
    }

    return false;
}

const saveMove = (newPieceBox, pawnPromoted, castlingPerformed, enPassantPerformed) => {
    let move = {
        from: selectedPiece.position,
        to: newPieceBox.id,
        piece: selectedPiece.piece,
        pieceColor: player
    };

    selectedPiece = null;
    pawnToPromotePosition = null;
    if (gameHasTimer) {
        let currentTime;
        if (player==='white'){
            currentTime = playerWhiteTimer.innerText;
        } else {
            currentTime = playerBlackTimer.innerText;
        }

        move.time = currentTime;
        timer.stop();
    }

    if (pawnPromoted) {
        let promotedPiece = newPieceBox.children[0];

        let pawnPromotion = {
            promotedTo: promotedPiece.dataset.piece,
            pieceImg: promotedPiece.children[0].src
        }

        socket.emit('move-made', roomId, move, pawnPromotion);
    } else if (castlingPerformed) {
        socket.emit('move-made', roomId, move, null, castling);
    } else if (enPassantPerformed) {
        socket.emit('move-made', roomId, move, null, null, true);
    } else {
        socket.emit('move-made', roomId, move);
    }

}

const moveEnemy = (move, pawnPromotion=null, enPassantPerformed=false) => {
    pawnsToPerformEnPassant = {}
    enPassantPositions = {}

    const {from , to, piece} = move;

    let boxMovedFrom = document.getElementById(from);
    let boxMovedTo = document.getElementById(to);

    if(boxMovedTo.children.length > 0){
        let pieceToRemove = boxMovedTo.children[0];

        capturePiece(pieceToRemove);
    }

    boxMovedTo.innerHTML = "";

    let enemyPiece = boxMovedFrom.children[0];

    if(pawnPromotion){
         const {promotedTo, pieceImg} = pawnPromotion;

        enemyPiece.dataset.piece = promotedTo;
        enemyPiece.children[0].src = pieceImg;
    }

    boxMovedFrom.innerHTML = "";
    boxMovedTo.appendChild(enemyPiece);

    if(enPassantPerformed){
        let capturedPieceBox = null;
        if(player === 'white'){
            capturedPieceBox = document.getElementById(`${to[0]}-${parseInt(to[2]) - 1}`);
        }else{
            capturedPieceBox = document.getElementById(`${to[0]}-${parseInt(to[2]) + 1}`);
        }

        capturePiece(capturedPieceBox.children[0]);

        capturedPieceBox.innerHTML = "";
    }

     if(piece === 'pawn'){
        let canPerformEnPassant = checkForEnPassant(move);

        if(canPerformEnPassant){
            pawnsToPerformEnPassant[to] = true;
        }
    }

    myTurn = true;
    setCursor('pointer');

    if(gameHasTimer){
        timer.start();
    }
}

// Castling Logic
const performCastling = (currentPlayer, kingStartPosition, kingTargetPosition) => {
    let kingBox = document.getElementById(kingStartPosition);
    let king = kingBox.children[0]; // Rey seleccionado

    // Calcular la posición inicial de la torre y su destino según el enroque (izquierdo o derecho)
    let rookStartPosition, rookTargetPosition;

    if (kingTargetPosition[0] === "C") {
        // Enroque largo
        rookStartPosition = "A" + kingTargetPosition.substr(1); // Torre inicial (A-8 o A-1)
        rookTargetPosition = "D" + kingTargetPosition.substr(1); // Torre destino (D-8 o D-1)
    } else if (kingTargetPosition[0] === "G") {
        // Enroque corto
        rookStartPosition = "H" + kingTargetPosition.substr(1); // Torre inicial (H-8 o H-1)
        rookTargetPosition = "F" + kingTargetPosition.substr(1); // Torre destino (F-8 o F-1)
    } else {
        displayToast("Invalid castling move");
        return;
    }

    // Validar que la torre esté en la posición correcta
    let rookBox = document.getElementById(rookStartPosition);
    if (!rookBox || rookBox.children.length === 0 || rookBox.children[0].dataset.piece !== "rook") {
        displayToast("Invalid castling: Rook not in position");
        return;
    }

    let rook = rookBox.children[0]; // Torre seleccionada

    // Limpiar las casillas iniciales
    kingBox.innerHTML = "";
    rookBox.innerHTML = "";

    // Obtener las casillas de destino
    let newKingBox = document.getElementById(kingTargetPosition);
    let newRookBox = document.getElementById(rookTargetPosition);

    // Mover el rey y la torre
    newKingBox.appendChild(king);
    newRookBox.appendChild(rook);

    // Verificar si el movimiento deja al rey en jaque
/*     if (isCheck(kingTargetPosition)) {
        // Revertir si el rey está en jaque
        newKingBox.innerHTML = "";
        newRookBox.innerHTML = "";
        kingBox.appendChild(king);
        rookBox.appendChild(rook);

        displayToast("Your king is under attack");
        return;
    } */

    // Actualizar las variables globales de enroque
    if (rookStartPosition[0] === "A") {
        isLeftCastlingPerformed = true;
    } else {
        isRightCastlingPerformed = true;
    }

    // Registrar el enroque
    castling = {
        kingStartPosition,
        kingTargetPosition,
        rookStartPosition,
        rookTargetPosition,
    };

    // Finalizar el turno del jugador
    if (currentPlayer === player) {
        endMyTurn(newKingBox, false, true);
    } else {
        myTurn = true;
        setCursor("pointer");

        if (gameHasTimer) {
            timer.start();
        }
    }
}

//pawn promotion

const setPiecesToPromote = () => {
    if(player === 'white'){
        whitePieces.forEach(piece => {
            if(piece.piece !== 'pawn' && piece.piece !== 'king'){
                const li = document.createElement("li");
                li.setAttribute("data-piece", piece.piece);

                const img = document.createElement("img");
                img.src = piece.icon;

                li.appendChild(img);
                piecesToPromote.appendChild(li);
            }
        })
    }else{
        blackPieces.forEach(piece => {
            if(piece.piece !== 'pawn' && piece.piece !== 'king'){
                const li = document.createElement("li");
                li.setAttribute("data-piece", piece.piece);

                const img = document.createElement("img");
                img.src = piece.icon;

                li.appendChild(img);
                piecesToPromote.appendChild(li);
            }
        })
    }

    addListenerToPiecesToPromote();
}

const onChoosePieceToPromote = e => {
    if(!pawnToPromotePosition){
        return;
    }

    const pieceToPromote = e.target.closest("li");
    const pieceToPromoteImg = pieceToPromote.children[0];
    const pieceToPromoteType = pieceToPromote.dataset.piece;

    let pieceToChange = document.getElementById(pawnToPromotePosition).children[0];

    pieceToChange.innerHTML = ""
    pieceToChange.appendChild(pieceToPromoteImg);
    pieceToChange.dataset.piece = pieceToPromoteType;

    piecesToPromoteContainer.classList.add('hidden');

    endMyTurn(document.getElementById(pawnToPromotePosition), true);
}

const addListenerToPiecesToPromote = () => {
    for(let i = 0; i < piecesToPromote.children.length; i++){
        piecesToPromote.children[i].addEventListener("click", onChoosePieceToPromote)
    }
}

// En Passant Logic
const checkForEnPassant = (enemyMove) => {
    const {from, to, piece} = enemyMove;

    if(piece !== 'pawn' || (from[2] !== '7' && from[2] !== '2')){
        return false;
    }

    let enemyPawn = null;

    if(player === 'white'){
        enemyPawn = blackPieces.find(enemyPiece => enemyPiece.piece === 'pawn' && enemyPiece.position === from);
    }else{
        enemyPawn = whitePieces.find(enemyPiece => enemyPiece.piece === 'pawn' && enemyPiece.position === from);
    }

    if(!enemyPawn){
        return false;
    }

    if(Math.abs(parseInt(to[2]) - parseInt(from[2])) === 2){
        let splittedPos = to.split("-");
        let xAxisPos = splittedPos[0];
        let yAxisPos = +splittedPos[1];

        let xAxisIndex = xAxis.findIndex(x => x === xAxisPos);

        if(xAxisIndex - 1 >= 0){
            let leftBox = document.getElementById(`${xAxis[xAxisIndex - 1]}-${yAxisPos}`);

            if(
                leftBox.children.length > 0 &&
                leftBox.children[0].classList.contains(player) &&
                leftBox.children[0].dataset.piece === 'pawn'
            ){
                return true;
            }
        }

        if(xAxisIndex + 1 < xAxis.length){
            let rightBox = document.getElementById(`${xAxis[xAxisIndex + 1]}-${yAxisPos}`);

            if(
                rightBox.children.length > 0 &&
                rightBox.children[0].classList.contains(player) &&
                rightBox.children[0].dataset.piece === 'pawn'
            ){
                return true;
            }
        }
    }

    return false
}

const performEnPassant = (currentPlayer, prevPawnPosition, newPawnPosition) => {
    let capturedPawnPos = newPawnPosition[0] + '-' + prevPawnPosition[2];
    let capturedPawnBox = document.getElementById(capturedPawnPos);

    capturePiece(capturedPawnBox.children[0]);

    if(currentPlayer === player){
        endMyTurn(document.getElementById(newPawnPosition), false, false, true);

        delete pawnsToPerformEnPassant[capturedPawnPos];
        delete enPassantPositions[newPawnPosition];
    }else{
        myTurn = true;
        setCursor('pointer');

        if(gameHasTimer){
            timer.start();
        }
    }
}

//check for draw

const checkForDraw = () => {
    let myTotalPieces = document.querySelectorAll(`.piece.${player}`).length
    let enemyTotalPieces = document.querySelectorAll(`.piece.${enemy}`).length

    return myTotalPieces === enemyTotalPieces && myTotalPieces === 1
}

// Game Over Logic
const endGame = (winner=null) => {
    gameOver = true;
    myTurn = false;
    setCursor("default");

    if(gameHasTimer){
        timer.stop();
    }

    if(winner){
        winnerUsername.innerText = winner;

        let winningPoints = 0;

        if(winner === user.username){
            winningPoints = ~~((myScore / totalPiecesPoints) * 100);
            myScoreElement.innerText = winningPoints;
            enemyScoreElement.innerText = -winningPoints;
            myScoreElement.classList.add("positive-score");
            socket.emit("update-score", roomId, winningPoints, -winningPoints);
        }else{
            winningPoints = ~~((enemyScore / totalPiecesPoints) * 100);
            myScoreElement.innerText = -winningPoints;
            enemyScoreElement.innerText = +winningPoints;
            enemyScoreElement.classList.add("positive-score");
        }
    }else{
        winnerUsername.innerText = "Nobody";
    }

    gameOverMessageContainer.classList.remove("hidden");
}

displayChessPieces();

//Socket--------------------------------

socket.on('receive-game-details', (details) => {
    gameDetails = details;
    let playerOne = gameDetails.players[0];

    gameHasTimer = gameDetails.time > 0;

    if (!gameHasTimer) {
        playerWhiteTimer.classList.add("hidden");
        playerBlackTimer.classList.add("hidden");
    } else {
        playerBlackTimer.innerText = gameDetails.time + ":00";
        playerWhiteTimer.innerText = gameDetails.time + ":00";
    }

    playerWhite.querySelector(".username").innerText = playerOne.username;

    if (playerOne.username === user.username) {
        player = 'white';
        enemy = 'black';

        myTurn = true;
    } else {
        const zoneDate = new Intl.DateTimeFormat('en-CA', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hourCycle: 'h23',
            timeZone: 'America/Bogota'
        }).format(new Date());
        gameStartedAtTimeStamp = zoneDate
        .replace(/(\d{2})\/(\d{2})\/(\d{4}),/, '$3-$2-$1')
        .replace(',', '')
        .replace(/\s?(a\.m\.|p\.m\.|AM|PM)/i, '');

        player = 'black';
        enemy = 'white';

        setCursor('default');
        startGame(user);

    }
    if (gameHasTimer) {
        timer = new Timer(player, roomId, gameDetails.time, 0, updateTimer, timerEndedCallback);
    }

    hideSpinner();
    room.classList.remove("hidden");
});

//fist player and someone join the room, then this event is emitted

socket.on('game-started', (playerTwo) => {
    const zoneDate = new Intl.DateTimeFormat('en-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
        timeZone: 'America/Bogota'
    }).format(new Date());
    gameStartedAtTimeStamp = zoneDate
    .replace(/(\d{2})\/(\d{2})\/(\d{4}),/, '$3-$2-$1')
    .replace(',', '')
    .replace(/\s?(a\.m\.|p\.m\.|AM|PM)/i, '');
    startGame(playerTwo);
    if (gameHasTimer) {
        timer.start();
    }
});

socket.on('enemy-moved', (move) => {
    moveEnemy(move);
})

socket.on("enemy-moved_castling", (enemyCastling) => {
    const { kingStartPosition, kingTargetPosition } = enemyCastling;

    performCastling(enemy, kingStartPosition, kingTargetPosition);


});

socket.on('enemy-moved_pawn-promotion', (move, pawnPromotion) => {
    moveEnemy(move, pawnPromotion);
});

socket.on('enemy-moved_en-passant', (move) => {
    moveEnemy(move, null, true);
});

socket.on("enemy-timer-updated", (minutes, seconds) => {
    updateTimer(enemy, minutes, seconds)
});

socket.on("king-is-attacked", () => {
    setKingIsAttacked(true);
});

socket.on("you-lost", (winner, newEnemyScore = null) => {
    if(newEnemyScore){
        enemyScore = newEnemyScore;
    }

    endGame(winner);
})

socket.on("you-won", () => {
    endGame(user.username);
})

socket.on("draw", () => {
    endGame();
});
