const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 8080 });

let clients = {};
let gameState = {
  board: [
    ["A-P1", "A-P2", "A-H1", "A-H2", "A-P3"],
    [null, null, null, null, null],
    [null, null, null, null, null],
    [null, null, null, null, null],
    ["B-P1", "B-P2", "B-H1", "B-H2", "B-P3"],
  ],
  currentPlayer: "A",
};

let currentPlayerId = "A";

wss.on("connection", (ws) => {
  const playerId = currentPlayerId;
  clients[playerId] = ws;
  currentPlayerId = currentPlayerId === "A" ? "B" : "A";

  ws.send(
    JSON.stringify({
      type: "init",
      state: gameState,
      playerId: playerId,
    })
  );

  ws.on("message", (message) => {
    const data = JSON.parse(message);
    handleClientMessage(data, playerId);
  });

  ws.on("close", () => {
    delete clients[playerId];
  });
});

function handleClientMessage(data, playerId) {
  if (data.type === "move" && playerId === gameState.currentPlayer) {
    handleMove(data.move, playerId);
  }
}

function handleMove(move, playerId) {
  const { rowIndex, colIndex, direction } = move;
  const piece = gameState.board[rowIndex][colIndex];
  const characterType = piece.split("-")[1];

  let newRow = rowIndex;
  let newCol = colIndex;
  let pathCells = [];

  switch (direction) {
    case "L":
      newCol -= characterType === "H1" ? 2 : 1;
      if (characterType === "H1")
        pathCells.push({ row: rowIndex, col: colIndex - 1 });
      break;

    case "R":
      newCol += characterType === "H1" ? 2 : 1;
      if (characterType === "H1")
        pathCells.push({ row: rowIndex, col: colIndex + 1 });
      break;

    case "F":
      newRow =
        playerId === "A"
          ? rowIndex + (characterType === "H1" ? 2 : 1)
          : rowIndex - (characterType === "H1" ? 2 : 1);
      if (characterType === "H1")
        pathCells.push({
          row: playerId === "A" ? rowIndex + 1 : rowIndex - 1,
          col: colIndex,
        });
      break;

    case "B":
      newRow =
        playerId === "A"
          ? rowIndex - (characterType === "H1" ? 2 : 1)
          : rowIndex + (characterType === "H1" ? 2 : 1);
      if (characterType === "H1")
        pathCells.push({
          row: playerId === "A" ? rowIndex - 1 : rowIndex + 1,
          col: colIndex,
        });
      break;

    case "FL":
      newRow -= 2;
      newCol -= 2;
      if (characterType === "H2")
        pathCells.push({ row: rowIndex - 1, col: colIndex - 1 });
      break;

    case "FR":
      newRow -= 2;
      newCol += 2;
      if (characterType === "H2")
        pathCells.push({ row: rowIndex - 1, col: colIndex + 1 });
      break;

    case "BL":
      newRow += 2;
      newCol -= 2;
      if (characterType === "H2")
        pathCells.push({ row: rowIndex + 1, col: colIndex - 1 });
      break;

    case "BR":
      newRow += 2;
      newCol += 2;
      if (characterType === "H2")
        pathCells.push({ row: rowIndex + 1, col: colIndex + 1 });
      break;

    default:
      break;
  }

  if (
    newRow >= 0 &&
    newRow < 5 &&
    newCol >= 0 &&
    newCol < 5 &&
    (!gameState.board[newRow][newCol] ||
      gameState.board[newRow][newCol][0] !== playerId)
  ) {
    const newBoard = gameState.board.map((row) => [...row]); // Deep copy of the board

    if (characterType === "H1" || characterType === "H2") {
      pathCells.forEach((cell) => {
        if (
          newBoard[cell.row][cell.col] &&
          newBoard[cell.row][cell.col][0] !== playerId
        ) {
          newBoard[cell.row][cell.col] = null;
        }
      });
    }

    newBoard[newRow][newCol] = piece;
    newBoard[rowIndex][colIndex] = null;

    gameState.board = newBoard;
    gameState.currentPlayer = playerId === "A" ? "B" : "A";

    broadcastGameState();

    if (
      newBoard.flat().filter((cell) => cell && cell[0] !== playerId).length ===
      0
    ) {
      broadcastGameState({ type: "game-over", winner: playerId });
      resetGame();
    }
  }
}

function broadcastGameState(message = { type: "update", state: gameState }) {
  for (let clientId in clients) {
    clients[clientId].send(JSON.stringify(message));
  }
}

function resetGame() {
  gameState = {
    board: [
      ["A-P1", "A-P2", "A-H1", "A-H2", "A-P3"],
      [null, null, null, null, null],
      [null, null, null, null, null],
      [null, null, null, null, null],
      ["B-P1", "B-P2", "B-H1", "B-H2", "B-P3"],
    ],
    currentPlayer: "A",
  };
}

console.log("WebSocket server is running on ws://localhost:8080");
