const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
context.scale(20, 20);

let board = createMatrix(10, 20);  // 10 blocks wide, 20 blocks high
let block = {
  pos: {x: 0, y: 0},
  matrix: null,
  score: 0,
};
let players = {
  1: { score: 0 },
  2: { score: 0 },
  3: { score: 0 },
  4: { score: 0 },
  5: { score: 0 },
  6: { score: 0 },
  7: { score: 0 },
  8: { score: 0 }
};
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;
let gamePaused = true;
let currentPlayer = null;
let nextPiece = null;

const colors = ['#000', '#808000', '#000080', '#800080', '#C0C0C0', '#800000', '##008000', '#008080'];

function createMatrix(w, h) {
  const matrix = [];
  while (h--) {
	matrix.push(new Array(w).fill(0));
  }
  return matrix;
}

function resetButtonsStyle(parentClass) {
    document.querySelectorAll(`.${parentClass} button`).forEach(button => {
        button.removeAttribute("style"); // Verwijdert alle inline stijlen
    });
}

function createPiece(type) {
  switch (type) {
	case 'T':
	  return [
		[0, 1, 0],
		[1, 1, 1],
	  ];
	case 'O':
	  return [
		[2, 2],
		[2, 2],
	  ];
	case 'L':
	  return [
		[0, 3, 0],
		[0, 3, 0],
		[0, 3, 3],
	  ];
	case 'J':
	  return [
		[0, 4, 0],
		[0, 4, 0],
		[4, 4, 0],
	  ];
	case 'I':
	  return [
		[0, 5, 0, 0],
		[0, 5, 0, 0],
		[0, 5, 0, 0],
		[0, 5, 0, 0],
	  ];
	case 'S':
	  return [
		[0, 6, 6],
		[6, 6, 0],
	  ];
	case 'Z':
	  return [
		[7, 7, 0],
		[0, 7, 7],
	  ];
  }
}

function selectPlayer(playerNumber) {
  currentPlayer = playerNumber;
  //reset the color of all buttons
  resetButtonsStyle("player-selection");
  //color the button of the active player
  document.getElementById(`player${playerNumber}-button`).style.backgroundColor = '#32CD32';
}

function selectPiece(pieceType) {
  if (currentPlayer === null) {
	  alert("Please select a player before selecting a block");
	  return;
  }
  nextPiece = pieceType;
  block.matrix = createPiece(nextPiece);
  playerReset();
  gamePaused = false;
  //reset the color of all buttons
  resetButtonsStyle("block-selection");
  //color the button of the active player
  console.log(`${pieceType}-block`);
  document.getElementById(`${pieceType}-block`).style.backgroundColor = '#32CD32';
  update();
}

function playerReset() {
  block.pos.y = 0;
  block.pos.x = (board[0].length / 2 | 0) - (block.matrix[0].length / 2 | 0);

  if (collide(board, block)) {
	board.forEach(row => row.fill(0));
	alert(`Player ${currentPlayer} has lost!`);
  }
}

function collide(board, block) {
  const [m, p] = [block.matrix, block.pos];
  for (let y = 0; y < m.length; ++y) {
	for (let x = 0; x < m[y].length; ++x) {
	  if (m[y][x] !== 0 &&
		 (board[y + p.y] &&
		  board[y + p.y][x + p.x]) !== 0) {
		return true;
	  }
	}
  }
  return false;
}

function drawMatrix(matrix, offset) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        // Hier kan je de schaduwen voor diepte instellen
        context.fillStyle = colors[value];
        
        // Zachte schaduw voor de onderkant en rechterkant van het blok (voor diepte)
        context.shadowColor = "#000"; // Donkere schaduw voor diepte
        context.shadowBlur = 5;      // Maak de schaduw zachter
        
        // Teken het blok zelf
        context.fillRect(x + offset.x, y + offset.y, 1, 1);
        
        // Reset schaduw voor volgende tekeningen
        context.shadowBlur = 0;  
        
        // Teken opnieuw de blokken voor highlight
        context.fillRect(x + offset.x, y + offset.y, 1, 1);
        
        // Reset schaduw weer
        context.shadowBlur = 0;
      }
    });
  });
}

function drawGrid() {
  context.strokeStyle = "#32CD32"; // De kleur van de gridlijnen (groen)
  context.lineWidth = 0.03;
  context.beginPath();

  // Teken verticale lijnen
  for (let x = 0; x < 10; x++) {  // canvas.width is geschaald met 20, dus gebruik canvas.width / 20
    context.moveTo(x, 0);  // Beginpunt van de lijn (start van de y-as)
    context.lineTo(x, canvas.height);  // Eindpunt van de lijn (einde van de y-as)
  }

  // Teken horizontale lijnen
  for (let y = 0; y < 20; y++) {  // canvas.height is geschaald met 20, dus gebruik canvas.height / 20
    context.moveTo(0, y);  // Beginpunt van de lijn (start van de x-as)
    context.lineTo(canvas.width, y);  // Eindpunt van de lijn (einde van de x-as)
  }

  context.stroke();  // Trek de lijnen
}

function draw() {
  context.fillStyle = '#000';
  context.fillRect(0, 0, canvas.width, canvas.height);

  // Teken het grid
  drawGrid();

  // Teken de matrix (speelveld)
  drawMatrix(board, {x: 0, y: 0});
  // Teken de actieve blokken
  if (block.matrix !== null) {
    drawMatrix(block.matrix, block.pos);
  }
}

function drop() {
  block.pos.y++;
  if (collide(board, block)) {
	block.pos.y--;
	merge(board, block);
	playerReset();
	lineSweep();
	addScore(10);  // 10 points for each drop
	pauseGame();
  }
  dropCounter = 0;
}

function merge(board, block) {
  block.matrix.forEach((row, y) => {
	row.forEach((value, x) => {
	  if (value !== 0) {
		board[y + block.pos.y][x + block.pos.x] = value;
	  }
	});
  });
}

function lineSweep() {
	/*board.forEach(row => {
  console.log(row.join(' '));  // Dit print de elementen van de rij gescheiden door een spatie
});*/
  let rowCount = 1;
  outerLoop: for (let y = board.length-1; y > 0; --y) { 
	for (let x = 0; x < board[y].length; ++x) {
	  if (board[y][x] === 0) {
		//console.log("oeps");
		continue outerLoop;
	  }
	}
	console.log("hallo2");
	const row = board.splice(y, 1)[0].fill(0);
	board.unshift(row);
	addScore(30);  // Extra points for clearing a line
	++y;
  }
}

function addScore(points) {
  players[currentPlayer].score += points;
  document.getElementById(`player${currentPlayer}-score`).innerText = `${players[currentPlayer].score}`;
}

function pauseGame() {
  gamePaused = true;
  block.matrix = null;
  currentPlayer = null;
  //alert(`Player ${currentPlayer} finished their turn. Select the next player and block.`);
}

function moveLeft() {
  block.pos.x--;
  if (collide(board, block)) {
	block.pos.x++;
  }
}

function moveRight() {
  block.pos.x++;
  if (collide(board, block)) {
	block.pos.x--;
  }
}

function rotate() {
  const pos = block.pos.x;
  let offset = 1;
  block.matrix = rotateMatrix(block.matrix);
  while (collide(board, block)) {
	block.pos.x += offset;
	offset = -(offset + (offset > 0 ? 1 : -1));
  }
}

function rotateMatrix(matrix) {
	console.log("rotateMatrix");
  // Stap 1: Transponeer de matrix (verwissel rijen en kolommen)
    let transposed = matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));

    // Stap 2: Keer elke rij om
    return transposed.map(row => row.reverse());
}

function update(time = 0) {
  const deltaTime = time - lastTime;
  lastTime = time;

  dropCounter += deltaTime;
  if (dropCounter > dropInterval && !gamePaused) {
	drop();
  }

  draw();
  requestAnimationFrame(update);
}

update();