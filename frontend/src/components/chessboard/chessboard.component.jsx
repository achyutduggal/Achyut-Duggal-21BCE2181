import React, { useState, useEffect } from 'react';
import './chessboard.styles.css';

const Chessboard = () => {
  const [board, setBoard] = useState([]);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [ws, setWs] = useState(null);

  useEffect(() => {
    const websocket = new WebSocket('ws://localhost:8080');

    websocket.onopen = () => {
      setWs(websocket);
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'init') {
        setBoard(data.state.board);
        setCurrentPlayer(data.state.currentPlayer);
        setPlayerId(data.playerId);
      } else if (data.type === 'update') {
        setBoard(data.state.board);
        setCurrentPlayer(data.state.currentPlayer);
      } else if (data.type === 'game-over') {
        alert(`Player ${data.winner} wins!`);
      }
    };

    return () => websocket.close();
  }, []);

  const handleCellClick = (rowIndex, colIndex) => {
    const piece = board[rowIndex][colIndex];
    if (piece && piece.startsWith(playerId)) {
      setSelectedPiece({ piece, rowIndex, colIndex });
    }
  };

  const handleMove = (direction) => {
    if (!selectedPiece) return;

    const move = {
      rowIndex: selectedPiece.rowIndex,
      colIndex: selectedPiece.colIndex,
      direction,
    };

    if (ws && playerId === currentPlayer) {
      ws.send(JSON.stringify({ type: 'move', move }));
    }
  };

  return (
    <div className="chessboard-container">
      <h2>Player: {playerId}</h2>
      <h3>Current Player: {currentPlayer}</h3>
      <div className="chessboard">
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className="row">
            {row.map((cell, colIndex) => (
              <div
                key={colIndex}
                className={`cell ${selectedPiece && selectedPiece.rowIndex === rowIndex && selectedPiece.colIndex === colIndex ? 'selected' : ''}`}
                onClick={() => handleCellClick(rowIndex, colIndex)}
                style={{ color: cell?.startsWith('A') ? 'blue' : 'red' }}  // Change text color based on player
              >
                {cell}
              </div>
            ))}
          </div>
        ))}
      </div>
      {selectedPiece && (
        <div className="controls">
          <p>Selected: {selectedPiece.piece}</p>
          <button onClick={() => handleMove('L')}>L</button>
          <button onClick={() => handleMove('R')}>R</button>
          <button onClick={() => handleMove('F')}>F</button>
          <button onClick={() => handleMove('B')}>B</button>
          {selectedPiece.piece.includes('H2') && (
            <>
              <button onClick={() => handleMove('FL')}>FL</button>
              <button onClick={() => handleMove('FR')}>FR</button>
              <button onClick={() => handleMove('BL')}>BL</button>
              <button onClick={() => handleMove('BR')}>BR</button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Chessboard;
