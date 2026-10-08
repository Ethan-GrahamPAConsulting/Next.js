"use client";

import { useId, useState } from 'react';
import styles from './Game.module.css';

type SquareValue = 'X' | 'O' | null;

type GameState = {
  history: SquareValue[][];
  currentMove: number;
  startingPlayer: 'X' | 'O';
  roundFinished: boolean;
  scores: { X: number; O: number; draws: number };
};

function winningLine(squares: SquareValue[]): number[] | null {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  return lines.find(([first, second, third]) =>
    squares[first] && squares[first] === squares[second] && squares[first] === squares[third],
  ) ?? null;
}

export default function Game() {
  const titleId = useId();
  const [game, setGame] = useState<GameState>({
    history: [Array<SquareValue>(9).fill(null)],
    currentMove: 0,
    startingPlayer: 'X',
    roundFinished: false,
    scores: { X: 0, O: 0, draws: 0 },
  });
  const squares = game.history[game.currentMove];
  const nextPlayer = game.currentMove % 2 === 0
    ? game.startingPlayer
    : game.startingPlayer === 'X' ? 'O' : 'X';
  const line = winningLine(squares);
  const winner = line ? squares[line[0]] : null;
  const isDraw = !winner && squares.every(Boolean);
  const status = winner
    ? `${winner} wins this round!`
    : isDraw
      ? "It's a draw!"
      : game.roundFinished
        ? `Reviewing move ${game.currentMove}`
        : `${nextPlayer}'s turn`;
  const leader = game.scores.X === game.scores.O
    ? 'Scores are level'
    : `${game.scores.X > game.scores.O ? 'X' : 'O'} leads by ${Math.abs(game.scores.X - game.scores.O)}`;

  function handlePlay(squareIndex: number) {
    setGame((current) => {
      const currentSquares = current.history[current.currentMove];
      if (current.roundFinished || currentSquares[squareIndex]) return current;

      const nextSquares = currentSquares.slice();
      nextSquares[squareIndex] = current.currentMove % 2 === 0
        ? current.startingPlayer
        : current.startingPlayer === 'X' ? 'O' : 'X';
      const nextHistory = [...current.history.slice(0, current.currentMove + 1), nextSquares];
      const nextLine = winningLine(nextSquares);
      const roundWinner = nextLine ? nextSquares[nextLine[0]] : null;
      const roundDraw = !roundWinner && nextSquares.every(Boolean);

      return {
        history: nextHistory,
        currentMove: nextHistory.length - 1,
        startingPlayer: current.startingPlayer,
        roundFinished: Boolean(roundWinner) || roundDraw,
        scores: {
          X: current.scores.X + (roundWinner === 'X' ? 1 : 0),
          O: current.scores.O + (roundWinner === 'O' ? 1 : 0),
          draws: current.scores.draws + (roundDraw ? 1 : 0),
        },
      };
    });
  }

  function restartGame() {
    setGame((current) => ({
      ...current,
      history: [Array<SquareValue>(9).fill(null)],
      currentMove: 0,
      startingPlayer: current.startingPlayer === 'X' ? 'O' : 'X',
      roundFinished: false,
    }));
  }

  return (
    <section className={styles.game} aria-labelledby={titleId}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>BREAK ROOM</p>
          <h2 id={titleId}>Tic-tac-toe</h2>
        </div>
        <button className={styles.restart} type="button" onClick={restartGame}>
          {game.roundFinished ? 'Play again' : 'Restart game'}
        </button>
      </header>

      <div className={styles.layout}>
        <div className={styles.playArea}>
          <p className={styles.status} role="status">{status}</p>
          <div className={styles.board} role="group" aria-label="Tic-tac-toe board">
            {squares.map((value, squareIndex) => (
              <button
                key={squareIndex}
                className={`${styles.square} ${line?.includes(squareIndex) ? styles.winningSquare : ''}`}
                type="button"
                data-player={value ?? undefined}
                aria-label={`Row ${Math.floor(squareIndex / 3) + 1}, column ${squareIndex % 3 + 1}: ${value ?? 'empty'}`}
                disabled={game.roundFinished || Boolean(value)}
                onClick={() => handlePlay(squareIndex)}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.details}>
          <h3>Scoreboard</h3>
          <dl className={styles.scoreboard}>
            <div className={styles.playerX}>
              <dt>X wins</dt>
              <dd>{game.scores.X}</dd>
            </div>
            <div className={styles.playerO}>
              <dt>O wins</dt>
              <dd>{game.scores.O}</dd>
            </div>
            <div>
              <dt>Draws</dt>
              <dd>{game.scores.draws}</dd>
            </div>
          </dl>
          <p className={styles.leader} aria-live="polite">{leader}</p>

          <h3 className={styles.historyHeading}>This round</h3>
          <ol className={styles.history}>
            {game.history.map((_, move) => (
              <li key={move}>
                <button
                  type="button"
                  aria-current={game.currentMove === move ? 'step' : undefined}
                  onClick={() => setGame((current) => ({ ...current, currentMove: move }))}
                >
                  {move === 0 ? 'Game start' : `Move ${move}`}
                </button>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
