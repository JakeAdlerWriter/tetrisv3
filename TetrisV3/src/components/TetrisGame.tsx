import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, VolumeX, Play, Pause, RotateCcw, Music } from 'lucide-react';
import { SimpleButton } from './SimpleButton';

// Tetromino shapes
const TETROMINOES = {
  I: {
    shape: [[1, 1, 1, 1]],
    color: '#03E1FF',
    glow: '#03E1FF'
  },
  O: {
    shape: [
      [1, 1],
      [1, 1]
    ],
    color: '#00FFA3',
    glow: '#00FFA3'
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1]
    ],
    color: '#DC1FFF',
    glow: '#DC1FFF'
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0]
    ],
    color: '#00FFA3',
    glow: '#00FFA3'
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1]
    ],
    color: '#DC1FFF',
    glow: '#DC1FFF'
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1]
    ],
    color: '#03E1FF',
    glow: '#03E1FF'
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1]
    ],
    color: '#00FFA3',
    glow: '#00FFA3'
  }
};

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const BLOCK_SIZE = 30;

type TetrominoType = keyof typeof TETROMINOES;

interface Position {
  x: number;
  y: number;
}

interface Piece {
  shape: number[][];
  color: string;
  glow: string;
  position: Position;
  type: TetrominoType;
}

const createEmptyBoard = (): (string | null)[][] => {
  return Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(null));
};

const getRandomTetromino = (): { type: TetrominoType; data: typeof TETROMINOES[TetrominoType] } => {
  const types = Object.keys(TETROMINOES) as TetrominoType[];
  const type = types[Math.floor(Math.random() * types.length)];
  return { type, data: TETROMINOES[type] };
};

export const TetrisGame = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [board, setBoard] = useState<(string | null)[][]>(createEmptyBoard());
  const [currentPiece, setCurrentPiece] = useState<Piece | null>(null);
  const [nextPiece, setNextPiece] = useState<TetrominoType | null>(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(false);
  const gameLoopRef = useRef<number>();
  const audioContextRef = useRef<AudioContext | null>(null);
  const musicRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio context and music
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Initialize background music from GitHub
    musicRef.current = new Audio('https://raw.githubusercontent.com/JakeAdlerWriter/RAW/main/tetris-music.mp3');
    musicRef.current.loop = true;
    musicRef.current.volume = 0.3;
    
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (musicRef.current) {
        musicRef.current.pause();
        musicRef.current = null;
      }
    };
  }, []);

  // Handle music toggle
  useEffect(() => {
    if (musicRef.current) {
      if (musicEnabled && isPlaying && !isPaused && !gameOver) {
        musicRef.current.play().catch(err => console.log('Music play error:', err));
      } else {
        musicRef.current.pause();
      }
    }
  }, [musicEnabled, isPlaying, isPaused, gameOver]);

  // Sound effects
  const playSound = useCallback((type: 'move' | 'rotate' | 'drop' | 'clear' | 'gameOver') => {
    if (!soundEnabled || !audioContextRef.current) return;

    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    switch (type) {
      case 'move':
        oscillator.frequency.setValueAtTime(200, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.05);
        break;
      case 'rotate':
        oscillator.frequency.setValueAtTime(300, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.08);
        break;
      case 'drop':
        oscillator.frequency.setValueAtTime(100, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.1);
        break;
      case 'clear':
        oscillator.frequency.setValueAtTime(400, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.2);
        break;
      case 'gameOver':
        oscillator.frequency.setValueAtTime(300, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.5);
        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.5);
        break;
    }
  }, [soundEnabled]);

  const spawnPiece = useCallback((): Piece => {
    const { type, data } = nextPiece 
      ? { type: nextPiece, data: TETROMINOES[nextPiece] }
      : getRandomTetromino();
    
    const newNext = getRandomTetromino();
    setNextPiece(newNext.type);

    return {
      shape: data.shape,
      color: data.color,
      glow: data.glow,
      position: { x: Math.floor(BOARD_WIDTH / 2) - Math.floor(data.shape[0].length / 2), y: 0 },
      type
    };
  }, [nextPiece]);

  const checkCollision = useCallback((piece: Piece, board: (string | null)[][], newPos?: Position): boolean => {
    const pos = newPos || piece.position;
    
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = pos.x + x;
          const newY = pos.y + y;

          if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
            return true;
          }

          if (newY >= 0 && board[newY][newX]) {
            return true;
          }
        }
      }
    }
    return false;
  }, []);

  const rotatePiece = useCallback((piece: Piece): number[][] => {
    const rotated: number[][] = [];
    for (let i = 0; i < piece.shape[0].length; i++) {
      rotated[i] = [];
      for (let j = piece.shape.length - 1; j >= 0; j--) {
        rotated[i][piece.shape.length - 1 - j] = piece.shape[j][i];
      }
    }
    return rotated;
  }, []);

  const mergePieceToBoard = useCallback((piece: Piece, board: (string | null)[][]): (string | null)[][] => {
    const newBoard = board.map(row => [...row]);
    
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const boardY = piece.position.y + y;
          const boardX = piece.position.x + x;
          if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
            newBoard[boardY][boardX] = piece.color;
          }
        }
      }
    }
    
    return newBoard;
  }, []);

  const clearLines = useCallback((board: (string | null)[][]): { newBoard: (string | null)[][]; linesCleared: number } => {
    let linesCleared = 0;
    const newBoard = board.filter(row => {
      if (row.every(cell => cell !== null)) {
        linesCleared++;
        return false;
      }
      return true;
    });

    while (newBoard.length < BOARD_HEIGHT) {
      newBoard.unshift(Array(BOARD_WIDTH).fill(null));
    }

    return { newBoard, linesCleared };
  }, []);

  const movePiece = useCallback((direction: 'left' | 'right' | 'down') => {
    if (!currentPiece || gameOver || isPaused) return;

    const delta = direction === 'left' ? { x: -1, y: 0 } : direction === 'right' ? { x: 1, y: 0 } : { x: 0, y: 1 };
    const newPosition = { x: currentPiece.position.x + delta.x, y: currentPiece.position.y + delta.y };

    if (!checkCollision(currentPiece, board, newPosition)) {
      setCurrentPiece({ ...currentPiece, position: newPosition });
      if (direction !== 'down') {
        playSound('move');
      }
    } else if (direction === 'down') {
      playSound('drop');
      const mergedBoard = mergePieceToBoard(currentPiece, board);
      const { newBoard, linesCleared } = clearLines(mergedBoard);
      
      if (linesCleared > 0) {
        playSound('clear');
        setLines(prev => prev + linesCleared);
        setScore(prev => prev + linesCleared * 100 * level);
        setLevel(Math.floor((lines + linesCleared) / 10) + 1);
      }

      setBoard(newBoard);
      const newPiece = spawnPiece();
      
      if (checkCollision(newPiece, newBoard)) {
        setGameOver(true);
        setIsPlaying(false);
        playSound('gameOver');
      } else {
        setCurrentPiece(newPiece);
      }
    }
  }, [currentPiece, board, gameOver, isPaused, checkCollision, mergePieceToBoard, clearLines, spawnPiece, level, lines, playSound]);

  const rotate = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;

    const rotated = rotatePiece(currentPiece);
    const rotatedPiece = { ...currentPiece, shape: rotated };

    if (!checkCollision(rotatedPiece, board)) {
      setCurrentPiece(rotatedPiece);
      playSound('rotate');
    }
  }, [currentPiece, board, gameOver, isPaused, rotatePiece, checkCollision, playSound]);

  const hardDrop = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;

    let newPiece = { ...currentPiece };
    while (!checkCollision(newPiece, board, { x: newPiece.position.x, y: newPiece.position.y + 1 })) {
      newPiece.position.y += 1;
    }

    setCurrentPiece(newPiece);
    setTimeout(() => movePiece('down'), 50);
  }, [currentPiece, board, gameOver, isPaused, checkCollision, movePiece]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isPlaying || gameOver) return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          movePiece('left');
          break;
        case 'ArrowRight':
          e.preventDefault();
          movePiece('right');
          break;
        case 'ArrowDown':
          e.preventDefault();
          movePiece('down');
          break;
        case 'ArrowUp':
        case ' ':
          e.preventDefault();
          rotate();
          break;
        case 'Enter':
          e.preventDefault();
          hardDrop();
          break;
        case 'p':
        case 'P':
          e.preventDefault();
          setIsPaused(prev => !prev);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, gameOver, movePiece, rotate, hardDrop]);

  // Game loop
  useEffect(() => {
    if (!isPlaying || gameOver || isPaused) return;

    const speed = Math.max(100, 1000 - (level - 1) * 100);
    
    gameLoopRef.current = window.setInterval(() => {
      movePiece('down');
    }, speed);

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [isPlaying, gameOver, isPaused, level, movePiece]);

  // Draw game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let y = 0; y <= BOARD_HEIGHT; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * BLOCK_SIZE);
      ctx.lineTo(BOARD_WIDTH * BLOCK_SIZE, y * BLOCK_SIZE);
      ctx.stroke();
    }
    for (let x = 0; x <= BOARD_WIDTH; x++) {
      ctx.beginPath();
      ctx.moveTo(x * BLOCK_SIZE, 0);
      ctx.lineTo(x * BLOCK_SIZE, BOARD_HEIGHT * BLOCK_SIZE);
      ctx.stroke();
    }

    // Draw locked blocks
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        if (board[y][x]) {
          const color = board[y][x]!;
          
          // Glow effect
          ctx.shadowBlur = 15;
          ctx.shadowColor = color;
          
          ctx.fillStyle = color;
          ctx.fillRect(x * BLOCK_SIZE + 2, y * BLOCK_SIZE + 2, BLOCK_SIZE - 4, BLOCK_SIZE - 4);
          
          // Inner highlight
          const gradient = ctx.createLinearGradient(
            x * BLOCK_SIZE,
            y * BLOCK_SIZE,
            (x + 1) * BLOCK_SIZE,
            (y + 1) * BLOCK_SIZE
          );
          gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
          gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = gradient;
          ctx.fillRect(x * BLOCK_SIZE + 2, y * BLOCK_SIZE + 2, BLOCK_SIZE - 4, BLOCK_SIZE - 4);
          
          ctx.shadowBlur = 0;
        }
      }
    }

    // Draw current piece
    if (currentPiece) {
      ctx.shadowBlur = 20;
      ctx.shadowColor = currentPiece.glow;
      
      for (let y = 0; y < currentPiece.shape.length; y++) {
        for (let x = 0; x < currentPiece.shape[y].length; x++) {
          if (currentPiece.shape[y][x]) {
            const boardX = currentPiece.position.x + x;
            const boardY = currentPiece.position.y + y;
            
            if (boardY >= 0) {
              ctx.fillStyle = currentPiece.color;
              ctx.fillRect(
                boardX * BLOCK_SIZE + 2,
                boardY * BLOCK_SIZE + 2,
                BLOCK_SIZE - 4,
                BLOCK_SIZE - 4
              );
              
              const gradient = ctx.createLinearGradient(
                boardX * BLOCK_SIZE,
                boardY * BLOCK_SIZE,
                (boardX + 1) * BLOCK_SIZE,
                (boardY + 1) * BLOCK_SIZE
              );
              gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
              gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
              ctx.fillStyle = gradient;
              ctx.fillRect(
                boardX * BLOCK_SIZE + 2,
                boardY * BLOCK_SIZE + 2,
                BLOCK_SIZE - 4,
                BLOCK_SIZE - 4
              );
            }
          }
        }
      }
      
      ctx.shadowBlur = 0;
    }
  }, [board, currentPiece]);

  const startGame = () => {
    setBoard(createEmptyBoard());
    setScore(0);
    setLevel(1);
    setLines(0);
    setGameOver(false);
    setIsPaused(false);
    setIsPlaying(true);
    
    const { type } = getRandomTetromino();
    setNextPiece(type);
    setCurrentPiece(spawnPiece());
  };

  const togglePause = () => {
    if (isPlaying && !gameOver) {
      setIsPaused(prev => !prev);
    }
  };

  return (
    <div style={{ width: '100%', padding: '0 1rem 2rem' }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        {/* Main Game Container - Everything Inside */}
        <div style={{
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(8px)',
          border: '2px solid #03E1FF',
          borderRadius: '0.75rem',
          padding: '1.5rem',
          boxShadow: '0 0 40px rgba(3,225,255,0.3)',
          width: '100%',
          maxWidth: 'fit-content',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          alignItems: 'center'
        }}>
        {/* Game Board and Side Panel */}
        <div style={{ 
          display: 'flex', 
          flexDirection: window.innerWidth >= 1024 ? 'row' : 'column',
          gap: '1.5rem',
          alignItems: 'flex-start',
          justifyContent: 'center'
        }}>
          {/* Game Board */}
          <div style={{ position: 'relative' }}>
            <canvas
              ref={canvasRef}
              width={BOARD_WIDTH * BLOCK_SIZE}
              height={BOARD_HEIGHT * BLOCK_SIZE}
              style={{ 
                background: '#000000',
                border: '2px solid #03E1FF',
                borderRadius: '0.5rem',
                boxShadow: '0 0 30px rgba(3,225,255,0.5)'
              }}
            />
          
            <AnimatePresence>
              {(gameOver || !isPlaying || isPaused) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    position: 'absolute',
                    inset: '0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    backdropFilter: 'blur(8px)',
                    borderRadius: '0.5rem'
                  }}
                >
                  <div style={{ textAlign: 'center' }}>
                    {gameOver && (
                      <>
                        <h2 style={{ 
                          fontSize: '2.25rem',
                          fontFamily: 'monospace',
                          color: '#03E1FF', 
                          textShadow: '0 0 20px rgba(3,225,255,0.8)',
                          marginBottom: '1rem'
                        }}>
                          GAME OVER
                        </h2>
                        <p style={{ fontSize: '1.5rem', color: '#DC1FFF' }}>Score: {score}</p>
                      </>
                    )}
                    {!isPlaying && !gameOver && (
                      <h2 className="cyberpunk-title" style={{ fontSize: '3rem' }}>
                        ATOMIC TETRIS
                      </h2>
                    )}
                    {isPaused && isPlaying && (
                      <h2 style={{ 
                        fontSize: '2.25rem',
                        fontFamily: 'monospace',
                        color: '#00FFA3', 
                        textShadow: '0 0 20px rgba(0,255,163,0.8)' 
                      }}>
                        PAUSED
                      </h2>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Side Panel */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '1rem',
            width: '100%',
            maxWidth: '16rem'
          }}>
            {/* Stats */}
            <div style={{ 
              backgroundColor: '#000000', 
              border: '2px solid #DC1FFF',
              borderRadius: '0.5rem',
              padding: '1rem',
              boxShadow: '0 0 20px rgba(220,31,255,0.3)'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <p style={{ fontSize: '0.875rem', fontFamily: 'monospace', color: '#DC1FFF' }}>SCORE</p>
                  <p style={{ fontSize: '1.875rem', fontFamily: 'monospace', color: '#03E1FF' }}>{score}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', fontFamily: 'monospace', color: '#DC1FFF' }}>LEVEL</p>
                  <p style={{ fontSize: '1.5rem', fontFamily: 'monospace', color: '#00FFA3' }}>{level}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.875rem', fontFamily: 'monospace', color: '#DC1FFF' }}>LINES</p>
                  <p style={{ fontSize: '1.5rem', fontFamily: 'monospace', color: '#00FFA3' }}>{lines}</p>
                </div>
              </div>
            </div>

            {/* Next Piece */}
            {nextPiece && (
              <div style={{
                backgroundColor: '#000000',
                border: '2px solid #03E1FF',
                borderRadius: '0.5rem',
                padding: '1rem',
                boxShadow: '0 0 20px rgba(3,225,255,0.3)'
              }}>
                <p style={{ fontSize: '0.875rem', fontFamily: 'monospace', marginBottom: '0.5rem', color: '#03E1FF' }}>NEXT</p>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '5rem' }}>
                  <div style={{ 
                    display: 'grid',
                    gap: '0.25rem',
                    gridTemplateColumns: `repeat(${TETROMINOES[nextPiece].shape[0].length}, 20px)`,
                    gridTemplateRows: `repeat(${TETROMINOES[nextPiece].shape.length}, 20px)`
                  }}>
                    {TETROMINOES[nextPiece].shape.map((row, y) =>
                      row.map((cell, x) => (
                        <div
                          key={`${y}-${x}`}
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '0.125rem',
                            opacity: cell ? '1' : '0',
                            ...(cell ? {
                              backgroundColor: TETROMINOES[nextPiece].color,
                              boxShadow: `0 0 10px ${TETROMINOES[nextPiece].glow}`
                            } : {})
                          }}
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Controls */}
            <div style={{
              border: '2px solid #00FFA3',
              borderRadius: '0.5rem',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              backgroundColor: '#000000',
              boxShadow: '0 0 20px rgba(0,255,163,0.3)'
            }}>
              <SimpleButton
                onClick={startGame}
                style={{ 
                  width: '100%',
                  color: '#ffffff',
                  backgroundColor: '#03E1FF',
                  border: '1px solid #03E1FF',
                  boxShadow: '0 0 15px rgba(3,225,255,0.5)'
                }}
              >
                <Play style={{ marginRight: '0.5rem', height: '1rem', width: '1rem' }} />
                {gameOver ? 'NEW GAME' : 'START'}
              </SimpleButton>
              
              <SimpleButton
                onClick={togglePause}
                disabled={!isPlaying || gameOver}
                style={{ 
                  width: '100%',
                  color: '#ffffff',
                  backgroundColor: '#00FFA3',
                  border: '1px solid #00FFA3',
                  boxShadow: '0 0 15px rgba(0,255,163,0.5)'
                }}
              >
                {isPaused ? <Play style={{ marginRight: '0.5rem', height: '1rem', width: '1rem' }} /> : <Pause style={{ marginRight: '0.5rem', height: '1rem', width: '1rem' }} />}
                {isPaused ? 'RESUME' : 'PAUSE'}
              </SimpleButton>

              <SimpleButton
                onClick={() => setMusicEnabled(!musicEnabled)}
                variant="outline"
                style={{
                  width: '100%',
                  borderColor: '#DC1FFF',
                  color: '#DC1FFF',
                  backgroundColor: 'transparent'
                }}
              >
                <Music style={{ marginRight: '0.5rem', height: '1rem', width: '1rem' }} />
                MUSIC {musicEnabled ? 'ON' : 'OFF'}
              </SimpleButton>

              <SimpleButton
                onClick={() => setSoundEnabled(!soundEnabled)}
                variant="outline"
                style={{
                  width: '100%',
                  borderColor: '#DC1FFF',
                  color: '#DC1FFF',
                  backgroundColor: 'transparent'
                }}
              >
                {soundEnabled ? <Volume2 style={{ marginRight: '0.5rem', height: '1rem', width: '1rem' }} /> : <VolumeX style={{ marginRight: '0.5rem', height: '1rem', width: '1rem' }} />}
                SOUND {soundEnabled ? 'ON' : 'OFF'}
              </SimpleButton>
            </div>

          </div>
        </div>

        {/* Desktop Controls Info */}
        <div style={{
          border: '2px solid #DC1FFF',
          borderRadius: '0.5rem',
          padding: '1rem',
          backgroundColor: '#000000',
          boxShadow: '0 0 20px rgba(220,31,255,0.3)',
          display: window.innerWidth >= 1024 ? 'block' : 'none',
          width: '100%',
          maxWidth: '400px'
        }}>
          <p style={{ fontSize: '0.875rem', fontFamily: 'monospace', marginBottom: '0.5rem', color: '#DC1FFF', textAlign: 'center' }}>CONTROLS</p>
          <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#03E1FF' }}>
            <p>← → : Move</p>
            <p>↓ : Soft Drop</p>
            <p>↑ / SPACE : Rotate</p>
            <p>ENTER : Hard Drop</p>
            <p>P : Pause</p>
          </div>
        </div>

        {/* Mobile Controls */}
        <div style={{
          display: window.innerWidth >= 1024 ? 'none' : 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '0.5rem',
          width: '100%',
          maxWidth: '400px'
        }}>
          <SimpleButton
            onClick={() => movePiece('left')}
            disabled={!isPlaying || gameOver || isPaused}
            style={{ 
              height: '4rem',
              backgroundColor: '#03E1FF',
              color: '#ffffff'
            }}
          >
            ←
          </SimpleButton>
          <SimpleButton
            onClick={rotate}
            disabled={!isPlaying || gameOver || isPaused}
            style={{ 
              height: '4rem',
              backgroundColor: '#DC1FFF',
              color: '#ffffff'
            }}
          >
            <RotateCcw />
          </SimpleButton>
          <SimpleButton
            onClick={() => movePiece('right')}
            disabled={!isPlaying || gameOver || isPaused}
            style={{ 
              height: '4rem',
              backgroundColor: '#03E1FF',
              color: '#ffffff'
            }}
          >
            →
          </SimpleButton>
          <SimpleButton
            onClick={() => movePiece('down')}
            disabled={!isPlaying || gameOver || isPaused}
            style={{ 
              height: '4rem',
              backgroundColor: '#00FFA3',
              color: '#ffffff'
            }}
          >
            ↓
          </SimpleButton>
          <SimpleButton
            onClick={hardDrop}
            disabled={!isPlaying || gameOver || isPaused}
            style={{ 
              height: '4rem',
              gridColumn: 'span 2',
              backgroundColor: '#00FFA3',
              color: '#ffffff'
            }}
          >
            HARD DROP
          </SimpleButton>
        </div>
        </div>
      </div>
    </div>
  );
};
