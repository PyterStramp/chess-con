
//---------initial variables-----------

const xAxis = ["A", "B", "C", "D", "E", "F", "G", "H"];
const yAxis = [1, 2, 3, 4, 5, 6, 7, 8];

const whitePiecesEndingPosition = ['A-1', 'B-1', 'C-1', 'D-1', 'E-1', 'F-1', 'G-1', 'H-1'];
const blackPiecesEndingPosition = ['A-8', 'B-8', 'C-8', 'D-8', 'E-8', 'F-8', 'G-8', 'H-8'];

let pawnsToPerformEnPassant = {}
let enPassantPositions = {};

let player = null;
let enemy = null;

let isLeftCastlingPerformed = false;
let isRightCastlingPerformed = false;

let selectedPiece = null;

const pieceData = {
    rook: {
        icon: {
            white: "../assets/chess-icons/white/chess-rook-white.svg",
            black: "../assets/chess-icons/black/chess-rook-black.svg"
        },
        points: 5,
    },
    knight: {
        icon: {
            white: "../assets/chess-icons/white/chess-knight-white.svg",
            black: "../assets/chess-icons/black/chess-knight-black.svg"
        },
        points: 3,
    },
    bishop: {
        icon: {
            white: "../assets/chess-icons/white/chess-bishop-white.svg",
            black: "../assets/chess-icons/black/chess-bishop-black.svg"
        },
        points: 3,
    },
    queen: {
        icon: {
            white: "../assets/chess-icons/white/chess-queen-white.svg",
            black: "../assets/chess-icons/black/chess-queen-black.svg"
        },
        points: 9,
    },
    king: {
        icon: {
            white: "../assets/chess-icons/white/chess-king-white.svg",
            black: "../assets/chess-icons/black/chess-king-black.svg"
        },
        points: 10,
    },
    pawn: {
        icon: {
            white: "../assets/chess-icons/white/chess-pawn-white.svg",
            black: "../assets/chess-icons/black/chess-pawn-black.svg"
        },
        points: 1,
    }
};

const whitePositions = [
    { pos: "A-8", piece: 'rook' },
    { pos: "B-8", piece: 'knight' },
    { pos: "C-8", piece: 'bishop' },
    { pos: "D-8", piece: 'queen' },
    { pos: "E-8", piece: 'king' },
    { pos: "F-8", piece: 'bishop' },
    { pos: "G-8", piece: 'knight' },
    { pos: "H-8", piece: 'rook' },
    { pos: "A-7", piece: 'pawn' },
    { pos: "B-7", piece: 'pawn' },
    { pos: "C-7", piece: 'pawn' },
    { pos: "D-7", piece: 'pawn' },
    { pos: "E-7", piece: 'pawn' },
    { pos: "F-7", piece: 'pawn' },
    { pos: "G-7", piece: 'pawn' },
    { pos: "H-7", piece: 'pawn' },
];

const blackPositions = [
    { pos: "A-1", piece: 'rook' },
    { pos: "B-1", piece: 'knight' },
    { pos: "C-1", piece: 'bishop' },
    { pos: "D-1", piece: 'queen' },
    { pos: "E-1", piece: 'king' },
    { pos: "F-1", piece: 'bishop' },
    { pos: "G-1", piece: 'knight' }, 
    { pos: "H-1", piece: 'rook' },
    { pos: "A-2", piece: 'pawn' },
    { pos: "B-2", piece: 'pawn' },
    { pos: "C-2", piece: 'pawn' },
    { pos: "D-2", piece: 'pawn' },
    { pos: "E-2", piece: 'pawn' },
    { pos: "F-2", piece: 'pawn' },
    { pos: "G-2", piece: 'pawn' },
    { pos: "H-2", piece: 'pawn' },
];

const whitePieces = whitePositions.map(({ pos, piece }) => ({
    position: pos,
    icon: pieceData[piece].icon.white,
    points: pieceData[piece].points,
    piece: piece,
}));

const blackPieces = blackPositions.map(({ pos, piece }) => ({
    position: pos,
    icon: pieceData[piece].icon.black,
    points: pieceData[piece].points,
    piece: piece,
}));

const totalPiecesPoints = whitePieces.reduce((acc, piece) => acc + piece.points, 0);

const isKingMoved = (player) => {
    return player === "white" ? isWhiteKingMoved : isBlackKingMoved;
};

const isRookMoved = (player, direction) => {
    if (player === "white") {
        return direction === "right" ? isWhiteRightRookMoved : isWhiteLeftRookMoved;
    } else {
        return direction === "right" ? isBlackRightRookMoved : isBlackLeftRookMoved;
    }
};

const getPawnPossibleMoves = (xAxisPos, yAxisPos, xAxisIndex, yAxisIndex) => {
    let possibleMoves = [];
    let forwardMoves = 1;

    let yAxisIndexForCapture = null;
    let canMoveForward = false;

    if (player === 'white') {
        if (yAxisPos === 7) {
            forwardMoves = 2;
        }

        yAxisIndexForCapture = yAxisIndex -1;
        canMoveForward = yAxisIndex>0;

        for (let y = yAxisIndex -1; y >= yAxisIndex - forwardMoves; y--) {
            if (y<0) {
                break;
            }
            let box = document.getElementById(`${xAxisPos}-${yAxis[y]}`);

            if (box.childElementCount === 0) {
                possibleMoves.push(box);
            } else {
                break;
            }
        }
    } else {
        if (yAxisPos === 2) {
            forwardMoves = 2;
        }

        yAxisIndexForCapture = yAxisIndex + 1;
        canMoveForward = yAxisIndex>0;

        for (let y = yAxisIndex +1; y <= yAxisIndex + forwardMoves; y++) {
            if (y>yAxis.length) {
                break;
            }
            let box = document.getElementById(`${xAxisPos}-${yAxis[y]}`);

            if (box.childElementCount === 0) {
                possibleMoves.push(box);
            } else {
                break;
            }
        }
    }

    if(canMoveForward){
        if(xAxisIndex>0){
            let pieceCaptureLeft = document.getElementById(`${xAxis[xAxisIndex-1]}-${yAxis[yAxisIndexForCapture]}`);

            if (pieceCaptureLeft.childElementCount > 0 && pieceCaptureLeft.children[0].classList.contains(enemy)) {
                possibleMoves.push(pieceCaptureLeft);
            }
        }
        if(xAxisIndex >xAxis.length -1){
            let pieceCaptureRight = document.getElementById(`${xAxis[xAxisIndex+1]}-${yAxis[yAxisIndexForCapture]}`);

            if (pieceCaptureRight.childElementCount > 0 && pieceCaptureRight.children[0].classList.contains(enemy)) {
                possibleMoves.push(pieceCaptureRight);
            }
        }
    }

    if(Object.keys(pawnsToPerformEnPassant).length > 0){
        if(xAxisIndex - 1 >= 0){
            let leftBox = document.getElementById(`${xAxis[xAxisIndex - 1]}-${yAxisPos}`);

            if(
                leftBox.children.length > 0 &&
                leftBox.children[0].classList.contains(enemy) &&
                leftBox.children[0].dataset.piece === 'pawn' &&
                pawnsToPerformEnPassant[`${xAxis[xAxisIndex - 1]}-${yAxisPos}`]
            ){
                pawnsToPerformEnPassant[`${xAxis[xAxisIndex - 1]}-${yAxis[yAxisIndexForCapture]}`] = true;

                let boxForEnPassant = document.getElementById(`${xAxis[xAxisIndex - 1]}-${yAxis[yAxisIndexForCapture]}`);

                possibleMoves.push(boxForEnPassant);
            }
        }

        if(xAxisIndex + 1 < xAxis.length){
            let rightBox = document.getElementById(`${xAxis[xAxisIndex + 1]}-${yAxisPos}`);

            if(
                rightBox.children.length > 0 &&
                rightBox.children[0].classList.contains(enemy) &&
                rightBox.children[0].dataset.piece === 'pawn' &&
                pawnsToPerformEnPassant[`${xAxis[xAxisIndex + 1]}-${yAxisPos}`]
            ){
                enPassantPositions[`${xAxis[xAxisIndex + 1]}-${yAxis[yAxisIndexForCapture]}`] = true;

                let boxForEnPassant = document.getElementById(`${xAxis[xAxisIndex + 1]}-${yAxis[yAxisIndexForCapture]}`);

                possibleMoves.push(boxForEnPassant);
            }
        }
    }

    return possibleMoves;
}

const getRookPossibleMoves = (xAxisPos, yAxisPos, xAxisIndex, yAxisIndex) => {
    let possibleMoves = [];

    let topCollision = false;
    let bottomCollision = false;
    let rightCollision = false;
    let leftCollision = false;
    let yInc = 1;
    let xInc = 1;
    while(!topCollision || !bottomCollision || !leftCollision || !rightCollision){
        if(!topCollision || !bottomCollision){
            if(yAxisIndex + yInc < yAxis.length){
                if(!topCollision){
                    let topBlock = document.getElementById(`${xAxisPos}-${yAxis[yAxisIndex + yInc]}`);

                    if(topBlock.childElementCount > 0){
                        if(topBlock.children[0].classList.contains(enemy)){
                            possibleMoves.push(topBlock);
                        }

                        topCollision = true;
                    }else{
                        possibleMoves.push(topBlock);
                    }
                }
            }else{
                topCollision = true;
            }

            if(yAxisIndex - yInc > -1){
                if(!bottomCollision){
                    let bottomBlock = document.getElementById(`${xAxisPos}-${yAxis[yAxisIndex - yInc]}`);
    
                    if(bottomBlock.childElementCount > 0){
                        if(bottomBlock.children[0].classList.contains(enemy)){
                            possibleMoves.push(bottomBlock);
                        }
    
                        bottomCollision = true;
                    }else{
                        possibleMoves.push(bottomBlock);
                    }
                }
            }else{
                bottomCollision = true;
            }

            yInc++;
        }

        if(!leftCollision || !rightCollision){
            if(xAxisIndex + xInc < xAxis.length){
                if(!rightCollision){
                    let rightBlock = document.getElementById(`${xAxis[xAxisIndex + xInc]}-${yAxisPos}`);

                    if(rightBlock.childElementCount > 0){
                        if(rightBlock.children[0].classList.contains(enemy)){
                            possibleMoves.push(rightBlock);
                        }

                        rightCollision = true;
                    }else{
                        possibleMoves.push(rightBlock);
                    }
                }
            }else{
                rightCollision = true;
            }

            if(xAxisIndex - xInc > -1){
                if(!leftCollision){
                    let leftBlock = document.getElementById(`${xAxis[xAxisIndex - xInc]}-${yAxisPos}`);

                    if(leftBlock.childElementCount > 0){
                        if(leftBlock.children[0].classList.contains(enemy)){
                            possibleMoves.push(leftBlock);
                        }
                        leftCollision = true;
                    }else{
                        possibleMoves.push(leftBlock);
                    }
                }
                
            }else{
                leftCollision = true;
            }

            xInc++;
        }
    }

    return possibleMoves;

}

const getBishopPossibleMoves = (xAxisIndex, yAxisIndex) => {
    let possibleMoves = []

    let topLeftCollision = false;
    let topRightCollision = false;
    let bottomLeftCollision = false;
    let bottomRightCollision = false;

    let yInc = 1;
    let xInc = 1;

    while(!topLeftCollision || !topRightCollision || !bottomLeftCollision || !bottomRightCollision){
        if(!topLeftCollision || !topRightCollision){
            if(yAxisIndex + yInc < yAxis.length && xAxisIndex - xInc > -1){
                if(!topLeftCollision){
                    let topLeftBlock = document.getElementById(`${xAxis[xAxisIndex - xInc]}-${yAxis[yAxisIndex + yInc]}`);

                    if(topLeftBlock.childElementCount > 0){
                        if(topLeftBlock.children[0].classList.contains(enemy)){
                            possibleMoves.push(topLeftBlock);
                        }

                        topLeftCollision = true;
                    }else{
                        possibleMoves.push(topLeftBlock);
                    }
                }
            }else{
                topLeftCollision = true;
            }
            
            if(yAxisIndex + yInc < yAxis.length && xAxisIndex + xInc < xAxis.length){
                if(!topRightCollision){
                    let topRightBlock = document.getElementById(`${xAxis[xAxisIndex + xInc]}-${yAxis[yAxisIndex + yInc]}`);

                    if(topRightBlock.childElementCount > 0){
                        if(topRightBlock.children[0].classList.contains(enemy)){
                            possibleMoves.push(topRightBlock);
                        }

                        topRightCollision = true;
                    }else{
                        possibleMoves.push(topRightBlock);
                    }
                }
            }else{
                topRightCollision = true;
            }
        }

        if(!bottomLeftCollision || !bottomRightCollision){
            if(yAxisIndex - yInc > -1 && xAxisIndex - xInc > -1){
                if(!bottomLeftCollision){
                    let bottomLeftBlock = document.getElementById(`${xAxis[xAxisIndex - xInc]}-${yAxis[yAxisIndex - yInc]}`);

                    if(bottomLeftBlock.childElementCount > 0){
                        if(bottomLeftBlock.children[0].classList.contains(enemy)){
                            possibleMoves.push(bottomLeftBlock);
                        }

                        bottomLeftCollision = true;
                    }else{
                        possibleMoves.push(bottomLeftBlock);
                    }
                }
            }else{
                bottomLeftCollision = true;
            }
            
            if(yAxisIndex - yInc > -1 && xAxisIndex + xInc < xAxis.length){
                if(!bottomRightCollision){
                    let bottomRightBlock = document.getElementById(`${xAxis[xAxisIndex + xInc]}-${yAxis[yAxisIndex - yInc]}`);

                    if(bottomRightBlock.childElementCount > 0){
                        if(bottomRightBlock.children[0].classList.contains(enemy)){
                            possibleMoves.push(bottomRightBlock);
                        }

                        bottomRightCollision = true;
                    }else{
                        possibleMoves.push(bottomRightBlock);
                    }
                }
            }else{
                bottomRightCollision = true;
            }
        }

        xInc++;
        yInc++;
    }

    return possibleMoves;
}

const getKnightPossibleMoves = (xAxisIndex, yAxisIndex) => {
    let possibleMoves = [];

    // LEFT-UP
    if(xAxisIndex - 2 > -1 && yAxisIndex + 1 < yAxis.length){
        let block = document.getElementById(`${xAxis[xAxisIndex - 2]}-${yAxis[yAxisIndex + 1]}`);

        if(block.childElementCount > 0){
            if(block.children[0].classList.contains(enemy)){
                possibleMoves.push(block);
            }
        }else{
            possibleMoves.push(block);
        }
    }

    // LEFT-DOWN
    if(xAxisIndex - 2 > -1 && yAxisIndex - 1 > -1){
        let block = document.getElementById(`${xAxis[xAxisIndex - 2]}-${yAxis[yAxisIndex - 1]}`);

        if(block.childElementCount > 0){
            if(block.children[0].classList.contains(enemy)){
                possibleMoves.push(block);
            }
        }else{
            possibleMoves.push(block);
        }
    }
    
    // RIGHT-UP
    if(xAxisIndex + 2 < xAxis.length && yAxisIndex + 1 < yAxis.length){
        let block = document.getElementById(`${xAxis[xAxisIndex + 2]}-${yAxis[yAxisIndex + 1]}`);

        if(block.childElementCount > 0){
            if(block.children[0].classList.contains(enemy)){
                possibleMoves.push(block);
            }
        }else{
            possibleMoves.push(block);
        }
    }

    // RIGHT-DOWN
    if(xAxisIndex + 2 < xAxis.length && yAxisIndex - 1 > -1){
        let block = document.getElementById(`${xAxis[xAxisIndex + 2]}-${yAxis[yAxisIndex - 1]}`);

        if(block.childElementCount > 0){
            if(block.children[0].classList.contains(enemy)){
                possibleMoves.push(block);
            }
        }else{
            possibleMoves.push(block);
        }
    }

    // UP-LEFT
    if(xAxisIndex - 1 > -1 && yAxisIndex + 2 < yAxis.length){
        let block = document.getElementById(`${xAxis[xAxisIndex - 1]}-${yAxis[yAxisIndex + 2]}`);

        if(block.childElementCount > 0){
            if(block.children[0].classList.contains(enemy)){
                possibleMoves.push(block);
            }
        }else{
            possibleMoves.push(block);
        }
    }

    // UP-RIGHT
    if(xAxisIndex + 1 < xAxis.length && yAxisIndex + 2 < yAxis.length){
        let block = document.getElementById(`${xAxis[xAxisIndex + 1]}-${yAxis[yAxisIndex + 2]}`);

        if(block.childElementCount > 0){
            if(block.children[0].classList.contains(enemy)){
                possibleMoves.push(block);
            }
        }else{
            possibleMoves.push(block);
        }
    }

    // DOWN-LEFT
    if(xAxisIndex - 1 > -1 && yAxisIndex - 2 > -1){
        let block = document.getElementById(`${xAxis[xAxisIndex - 1]}-${yAxis[yAxisIndex - 2]}`);

        if(block.childElementCount > 0){
            if(block.children[0].classList.contains(enemy)){
                possibleMoves.push(block);
            }
        }else{
            possibleMoves.push(block);
        }
    }

    // DOWN-RIGHT
    if(xAxisIndex + 1 < xAxis.length && yAxisIndex - 2 > -1){
        let block = document.getElementById(`${xAxis[xAxisIndex + 1]}-${yAxis[yAxisIndex - 2]}`);

        if(block.childElementCount > 0){
            if(block.children[0].classList.contains(enemy)){
                possibleMoves.push(block);
            }
        }else{
            possibleMoves.push(block);
        }
    }

    return possibleMoves;
}

const getKingPossibleMoves = (xAxisPos, yAxisPos, xAxisIndex, yAxisIndex) => {
    let possibleMoves = [];

    // TOP
    if(yAxisIndex + 1 < yAxis.length){
        let block = document.getElementById(`${xAxisPos}-${yAxis[yAxisIndex + 1]}`)

        if(block.childElementCount > 0){
            if(block.children[0].classList.contains(enemy)){
                possibleMoves.push(block);
            }
        }else{
            possibleMoves.push(block);
        }
    }

    // BOTTOM
    if(yAxisIndex - 1 > -1){
        let block = document.getElementById(`${xAxisPos}-${yAxis[yAxisIndex - 1]}`)

        if(block.childElementCount > 0){
            if(block.children[0].classList.contains(enemy)){
                possibleMoves.push(block);
            }
        }else{
            possibleMoves.push(block);
        }
    }

    // LEFT
    if(xAxisIndex - 1 > -1){
        let block = document.getElementById(`${xAxis[xAxisIndex - 1]}-${yAxisPos}`)

        if(block.childElementCount > 0){
            if(block.children[0].classList.contains(enemy)){
                possibleMoves.push(block);
            }
        }else{
            possibleMoves.push(block);
        }
    }

    // RIGHT
    if(xAxisIndex + 1 < xAxis.length){
        let block = document.getElementById(`${xAxis[xAxisIndex + 1]}-${yAxisPos}`)

        if(block.childElementCount > 0){
            if(block.children[0].classList.contains(enemy)){
                possibleMoves.push(block);
            }
        }else{
            possibleMoves.push(block);
        }
    }

    // TOP-LEFT
    if(xAxisIndex - 1 > -1 && yAxisIndex + 1 < yAxis.length){
        let block = document.getElementById(`${xAxis[xAxisIndex - 1]}-${yAxis[yAxisIndex + 1]}`)

        if(block.childElementCount > 0){
            if(block.children[0].classList.contains(enemy)){
                possibleMoves.push(block);
            }
        }else{
            possibleMoves.push(block);
        }
    }

    // TOP-RIGHT
    if(xAxisIndex + 1 < xAxis.length && yAxisIndex + 1 < yAxis.length){
        let block = document.getElementById(`${xAxis[xAxisIndex + 1]}-${yAxis[yAxisIndex + 1]}`)

        if(block.childElementCount > 0){
            if(block.children[0].classList.contains(enemy)){
                possibleMoves.push(block);
            }
        }else{
            possibleMoves.push(block);
        }
    }

    // BOTTOM-LEFT
    if(xAxisIndex - 1 > -1 && yAxisIndex - 1 > -1){
        let block = document.getElementById(`${xAxis[xAxisIndex - 1]}-${yAxis[yAxisIndex - 1]}`)

        if(block.childElementCount > 0){
            if(block.children[0].classList.contains(enemy)){
                possibleMoves.push(block);
            }
        }else{
            possibleMoves.push(block);
        }
    }

    // BOTTOM-RIGHT
    if(xAxisIndex + 1 < xAxis.length && yAxisIndex - 1 > -1){
        let block = document.getElementById(`${xAxis[xAxisIndex + 1]}-${yAxis[yAxisIndex - 1]}`)

        if(block.childElementCount > 0){
            if(block.children[0].classList.contains(enemy)){
                possibleMoves.push(block);
            }
        }else{
            possibleMoves.push(block);
        }
    }
    
    if (!isKingMoved(player) && !isCheck(`${xAxisPos}-${yAxisPos}`)) {
        if (!isRightCastlingPerformed && canPerformCastling(player, "right")) {
            let castlingPosition = `G-${yAxisPos}`;
            possibleMoves.push(document.getElementById(castlingPosition));
        }

        if (!isLeftCastlingPerformed && canPerformCastling(player, "left")) {
            let castlingPosition = `C-${yAxisPos}`;
            possibleMoves.push(document.getElementById(castlingPosition));
        }
    }

    possibleMoves = possibleMoves.filter(possibleMove => {
        let kingPosition = possibleMove.id;

        if(!isCheck(kingPosition)){
            return possibleMove;
        }
    })

    return possibleMoves;
}

const canPerformCastling = (player, direction) => {
    const yAxisPos = player === "white" ? 8 : 1;
    const kingStartPos = `E-${yAxisPos}`;

    const castlingPath = direction === "right"
        ? [`F-${yAxisPos}`, `G-${yAxisPos}`]
        : [`D-${yAxisPos}`, `C-${yAxisPos}`, `B-${yAxisPos}`];

    const rookStartPos = direction === "right"
        ? `H-${yAxisPos}`
        : `A-${yAxisPos}`;

    if (isRookMoved(player, direction)) return false;

    for (const position of castlingPath) {
        let block = document.getElementById(position);
        if (block.childElementCount > 0 || isCheck(position)) {
            return false;
        }
    }

    return true;
};

const switchPlayerAndEnemy = () => {
    if(player === 'white'){
        player = 'black';
        enemy = 'white';
    }else{
        player = 'white';
        enemy = 'black';
    }
}

const isCheck = (kingPosition, myKing = true) => {
    let splittedPos = kingPosition.split("-")

    let xAxisPos = splittedPos[0];
    let yAxisPos = +splittedPos[1];

    let xAxisIndex = xAxis.findIndex(x => x === xAxisPos);
    let yAxisIndex = yAxis.findIndex(y => y === yAxisPos);

    if(!myKing){
        switchPlayerAndEnemy();
    }

    let possibleMoves = Array.prototype.concat(
        getRookPossibleMoves(xAxisPos, yAxisPos, xAxisIndex, yAxisIndex),
        getBishopPossibleMoves(xAxisIndex, yAxisIndex),
        getKnightPossibleMoves(xAxisIndex, yAxisIndex)
    )

    for(let i = 0; i < possibleMoves.length; i++){
        let box = possibleMoves[i];

        if(box.children.length > 0){
            let piece = box.children[0];

            let pieceXPos = box.id.split("-")[0];
            let pieceYPos = +box.id.split('-')[1];

            let pieceXAxisIndex = xAxis.findIndex(x => x === pieceXPos);
            let pieceYAxisIndex = yAxis.findIndex(y => y === pieceYPos);

            let xyBlockDiffIsTheSame;

            switch(piece.dataset.piece){
                case 'pawn':
                    if(enemy === 'white'){
                        if(
                            (pieceXAxisIndex === xAxisIndex - 1 && pieceYAxisIndex === yAxisIndex + 1) ||
                            (pieceXAxisIndex === xAxisIndex + 1 && pieceYAxisIndex === yAxisIndex + 1)
                        ){
                            if(!myKing){
                                switchPlayerAndEnemy();
                            }

                            return true;
                        }
                    }else{
                        if(
                            (pieceXAxisIndex === xAxisIndex - 1 && pieceYAxisIndex === yAxisIndex - 1) ||
                            (pieceXAxisIndex === xAxisIndex + 1 && pieceYAxisIndex === yAxisIndex - 1)
                        ){
                            if(!myKing){
                                switchPlayerAndEnemy();
                            }

                            return true;
                        }
                    }
                    break;
                case 'knight':
                    if(
                        (pieceXAxisIndex === xAxisIndex - 1 && pieceYAxisIndex === yAxisIndex + 2) ||
                        (pieceXAxisIndex === xAxisIndex - 1 && pieceYAxisIndex === yAxisIndex - 2) ||
                        (pieceXAxisIndex === xAxisIndex + 1 && pieceYAxisIndex === yAxisIndex + 2) ||
                        (pieceXAxisIndex === xAxisIndex + 1 && pieceYAxisIndex === yAxisIndex - 2) ||
                        (pieceXAxisIndex === xAxisIndex - 2 && pieceYAxisIndex === yAxisIndex + 1) ||
                        (pieceXAxisIndex === xAxisIndex - 2 && pieceYAxisIndex === yAxisIndex - 1) ||
                        (pieceXAxisIndex === xAxisIndex + 2 && pieceYAxisIndex === yAxisIndex + 1) ||
                        (pieceXAxisIndex === xAxisIndex + 2 && pieceYAxisIndex === yAxisIndex - 1)
                    ){
                        if(!myKing){
                            switchPlayerAndEnemy();
                        }

                        return true;
                    }
                    break
                case 'rook':
                    if(pieceXPos === xAxisPos || pieceYPos === yAxisPos){
                        if(!myKing){
                            switchPlayerAndEnemy();
                        }

                        return true; 
                    }
                    break;
                case 'bishop':
                    xyBlockDiffIsTheSame = Math.abs(xAxisIndex - pieceXAxisIndex) === Math.abs(yAxisIndex - pieceYAxisIndex)
                    if(
                        (pieceXAxisIndex < xAxisIndex && pieceYAxisIndex > yAxisIndex && xyBlockDiffIsTheSame) ||
                        (pieceXAxisIndex < xAxisIndex && pieceYAxisIndex < yAxisIndex && xyBlockDiffIsTheSame) ||
                        (pieceXAxisIndex > xAxisIndex && pieceYAxisIndex > yAxisIndex && xyBlockDiffIsTheSame) ||
                        (pieceXAxisIndex > xAxisIndex && pieceYAxisIndex < yAxisIndex && xyBlockDiffIsTheSame)
                    ){
                        if(!myKing){
                            switchPlayerAndEnemy();
                        }

                        return true; 
                    }
                    break;
                case 'queen':
                    xyBlockDiffIsTheSame = Math.abs(xAxisIndex - pieceXAxisIndex) === Math.abs(yAxisIndex - pieceYAxisIndex)
                    if(
                        (pieceXPos === xAxisPos || pieceYPos === yAxisPos) ||
                        (pieceXAxisIndex < xAxisIndex && pieceYAxisIndex > yAxisIndex && xyBlockDiffIsTheSame) ||
                        (pieceXAxisIndex < xAxisIndex && pieceYAxisIndex < yAxisIndex && xyBlockDiffIsTheSame) ||
                        (pieceXAxisIndex > xAxisIndex && pieceYAxisIndex > yAxisIndex && xyBlockDiffIsTheSame) ||
                        (pieceXAxisIndex > xAxisIndex && pieceYAxisIndex < yAxisIndex && xyBlockDiffIsTheSame)
                    ){
                        if(!myKing){
                            switchPlayerAndEnemy();
                        }

                        return true;  
                    }
                    break
                default:
                    break;
            }
        }
    }

    if(!myKing){
        switchPlayerAndEnemy();
    }

    return false;
}

const isCheckmate = (enemyKingPosition) => {
    switchPlayerAndEnemy();

    let splittedPos = enemyKingPosition.split("-");

    let xAxisPos = splittedPos[0];
    let yAxisPos = +splittedPos[1];

    let xAxisIndex = xAxis.findIndex(x => x === xAxisPos);
    let yAxisIndex = yAxis.findIndex(y => y === yAxisPos);

    let kingPossibleMoves = getKingPossibleMoves(xAxisPos, yAxisPos, xAxisIndex, yAxisIndex);

    let myPieces = document.querySelectorAll(`.piece.${player}`);

    for(let i = 0; i < myPieces.length; i++){
        let myPiece = myPieces[i];

        if(myPiece.dataset.piece === 'king') continue;

        let myPieceXPos = myPiece.parentNode.id.split("-")[0];
        let myPieceYPos = +myPiece.parentNode.id.split('-')[1];

        let myPieceXAxisIndex = xAxis.findIndex(x => x === myPieceXPos);
        let myPieceYAxisIndex = yAxis.findIndex(y => y === myPieceYPos);

        let piecePossibleMoves;

        switch(myPiece.dataset.piece){
            case "pawn":
                piecePossibleMoves = getPawnPossibleMoves(myPieceXPos, myPieceYPos, myPieceXAxisIndex, myPieceYAxisIndex);
                break;
            case 'rook':
                piecePossibleMoves = getRookPossibleMoves(myPieceXPos, myPieceYPos, myPieceXAxisIndex, myPieceYAxisIndex);
                break;
            case 'bishop':
                piecePossibleMoves = getBishopPossibleMoves(myPieceXAxisIndex, myPieceYAxisIndex);
                break;
            case 'knight':
                piecePossibleMoves = getKnightPossibleMoves(myPieceXAxisIndex, myPieceYAxisIndex);
                break;
            case 'queen':
                piecePossibleMoves = Array.prototype.concat(
                    getRookPossibleMoves(myPieceXPos, myPieceYPos, myPieceXAxisIndex, myPieceYAxisIndex),
                    getBishopPossibleMoves(myPieceXAxisIndex, myPieceYAxisIndex)
                )
                break;
            default:
                break;
        }

        let currentBox = myPiece.parentNode;
        currentBox.innerHTML = "";

        for(let j = 0; j < piecePossibleMoves.length; j++){
            let possibleMove = piecePossibleMoves[j];

            let boxToMove = document.getElementById(possibleMove.id);

            let removedPiece = null;

            if(boxToMove.children.length > 0){
                removedPiece = boxToMove.children[0]
            }

            boxToMove.innerHTML = "";

            boxToMove.appendChild(myPiece);

            let check = isCheck(enemyKingPosition);

            boxToMove.innerHTML = "";

            if(removedPiece){
                boxToMove.appendChild(removedPiece);
            }

            if(!check){
                currentBox.appendChild(myPiece);
                switchPlayerAndEnemy();
                return false;
            }
        }

        currentBox.appendChild(myPiece);
    }

    switchPlayerAndEnemy();

    if(kingPossibleMoves.length === 0){
        return true;
    }

    return false;
}

const getKingPosition = (pieceColor) => {
    let pieces = document.querySelectorAll(`.piece.${pieceColor}`);

    for(let i = 0; i < pieces.length; i++){
        if(pieces[i].dataset.piece === 'king'){
            return pieces[i].parentNode.id;
        }
    }
}

const isPawnAtTheEndOfTheBoard = (currentPlayer, pawnPosition) => {
    let isAtTheEndOfBoard = false;

    if(currentPlayer === 'white'){
        let positionIndex = whitePiecesEndingPosition.findIndex(pos => pos === pawnPosition);

        if(positionIndex !== -1){
            isAtTheEndOfBoard = true;
        }
    }else{
        let positionIndex = blackPiecesEndingPosition.findIndex(pos => pos === pawnPosition);

        if(positionIndex !== -1){
            isAtTheEndOfBoard = true;
        }
    }

    return isAtTheEndOfBoard;
}
