(function() {
	var
		version = '1.0',

		DisplayMode = {
			NUMBERMODE_NO: 0,
			NUMBERMODE_ONE: 1,
			NUMBERMODE_ALL: 2
		},

		GameMode = {
			PLAY_MODE: 0,
			EDIT_MODE: 1
		},

		// 1 means black, -1 means white.
		ColorType = {
			'Black': 1,
			'None': 0,
			'White': -1
		},

		// 'Place' means the stone is manually edited.
		NodeType = {
			'Root': 0,
			'Move': 1,
			'Place': 2,
			'Other': 3
		};

	Array.prototype.clone = function() {
		var arr = [];
		for (var i = 0; i < this.length; ++i) {
			arr[i] = this[i].clone ? this[i].clone() : this[i];
		}
		return arr;
	}

	Array.prototype.isEqual = function(a) {
		if (this.length != a.length) {
			return false;
		}
		for (var i = 0; i < a.length; ++i) {
			if ((this[i].isEqual && this[i].isEqual(a[i]) == false) || (!(this[i].isEqual) && this[i] != a[i])) {
				return false;
			}
		}
		return true;
	}


	/**
	 * For external use.
	 *
	 * to initialize zGo
	 *
	 *
	 * 
	 */
	var zGo = function(container, boardWidth, opt) {
		var width = parseInt(boardWidth),
			size = parseInt(opt),

			// sgf that will be loaded
			sgf,

			game,
			renderer,
			sgfUtil;

		// if container is not a dom element, return null.
		if (!container.nodeType || container.nodeType !== 1) {
			return null;
		}

		this.version = version;

		width = (!isNaN(width) && width > 0 ? width : 520);
		size = (!isNaN(size) && size >= 5 ? size : 19);

		game = new GameTree(size);
		sgfUtil = new SGFutil(game);
		renderer = new Renderer(container, game, width);
		if (typeof opt === "string") {
			sgf = opt;
			sgfUtil.loadSgf(sgf);
			renderer.render();
		}
	}



	/**
	 * Nodes of the game is maitained in this tree.
	 *
	 * @size: specify board size, default is 19, optional
	 * 
	 * @opt: specify game information, optional
	 * 
	 * 
	 */
	function GameTree(size) {

		var // board of root node
			board = [],

			size = size || 19,

			mode = GameMode.PLAY_MODE,

			// root node, which is the same for any game.
			root,

			// current move of the game (could also be an edited stone)
			current;

		function Node(tpye, stone, board, opt) {

			// sepecify node type.
			this.type = tpye;

			// board status of this node
			this.board = board.clone();

			this.stone = stone;

			// in case this node has marks to display on the board
			if (opt && opt['marks']) {
				this.marks = opt['marks'];
			}

			this.deadBlack = (opt && opt['deadBlack']) || 0;
			this.deadWhite = (opt && opt['deadWhite']) || 0;
		}

		// initialize board for root node.
		for (var i = 0; i < size; ++i) {
			board[i] = [];
			for (var j = 0; j < size; ++j) {
				board[i][j] = ColorType.None;
			}
		}

		// create root node.
		root = new Node(NodeType.Root, null, board);

		// 1 means black to play, white means white to play.
		root.turn = 1;

		// move count
		root.number = 0;

		current = root;

		this.getGameMode = function() {
			return mode;
		}

		this.setGameMode = function(newMode) {
			mode = newMode;
		}

		this.getSize = function() {
			return size;
		}

		this.getCurrentNode = function() {
			return current;
		}

		this.getCurrentBoard = function() {
			return current.board;
		}

		this.getCurrentNo = function() {
			return current.number;
		}

		this.getTurn = function() {
			return current.turn;
		}

		this.setTurn = function(newTurn) {
			current.turn = newTurn;
		}

		this.shiftTurn = function() {
			current.turn = -turn;
		}


		// these change current pointer
		this.next = function() {
			if (current.next) {
				current = current.next[0];
			}
		}
		this.prev = function() {
			if (current.prev) {
				current = current.prev;
			}
		}
		this.nextMove = function() {
			var next = current.next && current.next[0];
			while (next && next[0].tpye !== NodeType.Move) {
				next = next.next;
			}
			current = next || next[0] || current;
		}
		this.prevMove = function() {
			var prev = current.prev;
			while (prev && prev.tpye !== NodeType.Move) {
				prev = prev.prev;
			}
			current = prev || current;
		}
		this.first = function() {
			current = root;
		}
		this.end = function() {
			var endNode = current;
			while (endNode.next) {
				endNode = endNode.next[0];
			}
			current = endNode;
		}


		// these don't change current pointer
		this.getNextNode = function() {
			if (current.next) {
				return current.next[0];
			}
			return null;
		}
		this.getPrevNode = function() {
			if (current.prev) {
				return current.prev;
			}
			return null;
		}
		this.getNextMove = function() {
			var nextMove = current.next && current.next[0];
			while (nextMove && nextMove[0].type !== NodeType.Move) {
				nextMove = nextMove.next;
			}
			return nextMove && nextMove[0] ;
		}
		this.getPrevMove = function() {
			var prev = current.prev;
			while (prev && prev.type !== NodeType.Move) {
				prev = prev.prev;
			}
			return prev;
		}
		this.getRoot = function() {
			return root;
		}
		this.getEndNode = function() {
			var end = current;
			while (end.next) {
				end = end.next;
			}
			return end;
		}

		// reset game tree
		this.reset = function() {
			root = new Node(NodeType.Root, null, root.board);
			root.turn = 1;
			current = root;
		}



		// remove the stone from point(x,y).
		/*this.removeStone = function(x, y) {
			var node = new Place(current, null, current.board);
			current.next = node;
			current = node;
			current.board[y][x] = ColorType.None;
			current.type = NodeType.Place;
		}*/

		// Whether point[y,x] has liberty.
		var hasQi = function(board, x, y, access) {
			var color = board[y][x];
			if (x < 0 || y < 0 || x >= size || y >= size) {
				return false;
			}
			if (color == ColorType.None) return true;
			if ((x > 0 && board[y][x - 1] == ColorType.None) || (y > 0 && board[y - 1][x] == ColorType.None) || (x < size - 1 && board[y][x + 1] == ColorType.None) || (y < size - 1 && board[y + 1][x] == ColorType.None)) {
				return true;
			}
			if (!access) {
				access = [];
				for (var i = 0; i < size; ++i) {
					access[i] = [];
					for (var j = 0; j < size; ++j) {
						access[i][j] = false;
					}
				}
			}
			access[y][x] = true;
			if ((x > 0 && access[y][x - 1] == false && board[y][x - 1] == color && hasQi(board, x - 1, y, access)) || (y > 0 && access[y - 1][x] == false && board[y - 1][x] == color && hasQi(board, x, y - 1, access)) || (x < size - 1 && access[y][x + 1] == false && board[y][x + 1] == color && hasQi(board, x + 1, y, access)) || (y < size - 1 && access[y + 1][x] == false && board[y + 1][x] == color && hasQi(board, x, y + 1, access))) {
				return true;
			}
			return false;
		}

		// Remove dead stones.
		var removeString = function(board, x, y) {
			var color = board[y][x],
				dead = 1;

			// Handle coordinate out of board or color is none.
			if (x < 0 || y < 0 || x > size - 1 || y > size - 1 || color === ColorType.None) {
				return 0;
			}

			// remove stone at (y, x)
			board[y][x] = ColorType.None;

			// remove stones beside (y, x) if color is the same.
			if (x > 0 && board[y][x - 1] === color) {
				dead += removeString(board, x - 1, y);
			}
			if (y > 0 && board[y - 1][x] === color) {
				dead += removeString(board, x, y - 1);
			}
			if (x < size - 1 && board[y][x + 1] === color) {
				dead += removeString(board, x + 1, y);
			}
			if (y < size - 1 && board[y + 1][x] === color) {
				dead += removeString(board, x, y + 1);
			}

			return dead;
		}

		this.makeMove = function(x, y, color) {
			var // for ko situation.
				lastBoard = current.prev ? current.prev.board : null,

				curBoard = current.board,
				newBoard = curBoard.clone();

			// can't play at point[y,x] having stone.
			if (newBoard[y][x] != ColorType.None) {
				return -1;
			}

			// color to play, shift color by default, black first.
			if (color) {
				newBoard[y][x] = color;
			} else {
				newBoard[y][x] = (current.color === ColorType.None ? ColorType.Black : -current.color);
			}

			// remove dead stones.
			var dead = 0;
			if (x > 0 && !hasQi(newBoard, x - 1, y) && newBoard[y][x] !== newBoard[y][x - 1]) {
				dead += removeString(newBoard, x - 1, y);
			}
			if (x < size - 1 && !hasQi(newBoard, x + 1, y) && newBoard[y][x] !== newBoard[y][x + 1]) {
				dead += removeString(newBoard, x + 1, y);
			}
			if (y > 0 && !hasQi(newBoard, x, y - 1) && newBoard[y][x] !== newBoard[y - 1][x]) {
				dead += removeString(newBoard, x, y - 1);
			}
			if (y < size - 1 && !hasQi(newBoard, x, y + 1) && newBoard[y][x] !== newBoard[y + 1][x]) {
				dead += removeString(newBoard, x, y + 1);
			}

			// Handle:
			// self capture
			// ko
			if ((dead === 0 && !hasQi(newBoard, x, y)) || (lastBoard && newBoard.isEqual(lastBoard))) {
				return -1;
			}

			var opt = {};
			if (newBoard[y][x] === ColorType.Black) {
				opt['deadWhite'] = dead;
			} else if (newBoard[y][x] == ColorType.White) {
				opt['deadBlack'] = dead;
			}

			// add new move to game tree.
			var move = new Node(NodeType.Move, {
				x: x,
				y: y,
				color: color
			}, newBoard, opt);

			// change whom to play
			move.turn = -color;

			// move count
			move.number = current.number + 1;

			// case1: add node to the end of the branch
			// case2: create new branch
			if (!current.next) {
				current.next = [];
			}
			current.next.push(move);
			move.prev = current;
			current = move;

			return dead;
		}

		this.placeStone = function(x, y, color) {
			var
				curBoard = current.board,
				newBoard = curBoard.clone();

			if (newBoard[y][x] !== ColorType.None) {
				return false;
			}

			if (color) {
				newBoard[y][x] = color;
			} else {
				newBoard[y][x] = (current.color === ColorType.None ? ColorType.Black : -current.color);
			}

			// remove dead stones.
			var dead = 0;
			if (x > 0 && hasQi(newBoard, x - 1, y) == false && newBoard[y][x] != newBoard[y][x - 1]) {
				dead += removeString(newBoard, x - 1, y);
			}
			if (x < size - 1 && hasQi(newBoard, x + 1, y) == false && newBoard[y][x] != newBoard[y][x + 1]) {
				dead += removeString(newBoard, x + 1, y);
			}
			if (y > 0 && hasQi(newBoard, x, y - 1) == false && newBoard[y][x] != newBoard[y - 1][x]) {
				dead += removeString(newBoard, x, y - 1);
			}
			if (y < size - 1 && hasQi(newBoard, x, y + 1) == false && newBoard[y][x] != newBoard[y + 1][x]) {
				dead += removeString(newBoard, x, y + 1);
			}

			// Handle: self capture
			if ((dead == 0 && hasQi(newBoard, x, y) == false)) {
				return false;
			}

			// add the edited stone to game tree.
			var node = new Node(NodeType.Place, {
				x: x,
				y: y,
				color: color
			}, newBoard);

			// doesn't change who to play
			node.turn = current.turn;

			// dosen't change number of moves
			node.number = current.number;

			// case1: add node to the end of the branch
			// case2: create new branch
			if (!current.next) {
				current.next = [];
			}
			current.next.push(node);
			node.prev = current;
			current = node;

			return true;
		}

		this.addMark = function(x, y, mark) {
			if (mark === undefined) {
				return;
			}
			current.marks[y][x] = mark;
		}

		this.removeMark = function(x, y) {
			current.marks[y][x] = MarkupType.None;
		}

	}

	// sgf utilities
	function SGFutil(gameTree) {
		var game = gameTree;

		this.loadSgf = function(sgf) {
			var sgfStr = sgf,
				level = -1,
				curNode = {},
				isValue = false,
				curChar,
				nextChar;

			if (!sgf) {
				return null;
			}

			for (var i = 0; i < sgfStr.length; i++) {
				curChar = sgfStr.charAt(i);
				nextChar = sgfStr.charAt(i + 1);

				// Handle: current char is a property's value
				if (isValue) {

					var name = curNode.name,
						prop = curNode.curProp,
						value = curNode.curValue,
						x,
						y,
						color;

					// end of property value
					if (curChar === "]") {
						isValue = false;
						continue;
					}

					// move
					if (name === "B" || name === "W") {

						// in move property
						if (prop === "B" || prop === "W") {

							// Get move's coordinates and add it to game tree.
							// a-s represent 0-18 on the board
							if (97 <= curChar <= 115) {
								if (!value || value === "") {
									x = curChar.charCodeAt(0) - 97;
									curNode.curValue = curChar;
								} else {
									x = value.charCodeAt(0) - 97;
									y = curChar.charCodeAt(0) - 97;
									color = (prop === "B" ? 1 : -1);
									game.makeMove(x, y, color);
								}
							}
						}
					}


				} else {
					switch (curChar) {

						// end of node
						case ";":
							{
								curNode = {};
								break;
							}

							// start of property value
						case "[":
							{
								isValue = true;
								break;
							}

						case "B":
							{
								// Handle "BL","BM","BR","BT"
								if ('A' <= nextChar <= 'Z') {
									curNode.curProp = curNode.name = curChar + nextChar;
								} else {
									curNode.curProp = curNode.name = curChar;
								}
								break;
							}
						case "W":
							{
								// Handle "WL","WR","WT"
								if ('A' <= nextChar <= 'Z') {
									curNode.curProp = curNode.name = curChar + nextChar;
								} else {
									curNode.curProp = curNode.name = curChar;
								}
								break;
							}

							// start of branch
						case "(":
							{
								curNode = {};
								level++;
								break;
							}

							// end of branch
						case ")":
							{
								curNode = {};
								level--;
								break;
							}

						case "S":
							{
								if (nextChar === "Z") {

								}
								break;
							}

						default:
							{

							}
					}
				}

			}

		}

	}



	/**
	 * Render zGo to html.
	 * 
	 * @container	the dom element which holds zGo
	 * 
	 * @width(integer)   specify pixels of board's width
	 * 
	 */
	function Renderer(container, gameTree, boardWidth) {
		var
			game = gameTree,
			size = game.getSize(),

			// width(height) of the canvas
			canvasWidth = boardWidth,

			// width(height) of board's grid in the canvas
			gridWidth = canvasWidth / (size + 1),

			// width of board's edge to the lines in the canvas
			edgeWidth = gridWidth,

			// This div contains everything.
			mainDiv = document.createElement("div"),

			canvasHolder = document.createElement("div"),

			// canvas for board
			board = document.createElement("canvas"),

			// canvas for stones
			topLayer = document.createElement("canvas"),

			// game controller
			toolbar = document.createElement("div"),

			ctx = board.getContext('2d'),
			ctx1 = topLayer.getContext('2d');

		mainDiv.className = "zGo-main";
		mainDiv.style.width = boardWidth + "px";

		canvasHolder.className = "zGo-canvasholder";
		canvasHolder.style.width = boardWidth + "px";
		canvasHolder.style.height = boardWidth + "px";

		board.className = "zGo-board";
		board.width = canvasWidth;
		board.height = canvasWidth;

		topLayer.className = "zGo-toplayer";
		topLayer.width = canvasWidth;
		topLayer.height = canvasWidth;

		ctx.save();
		ctx.translate(0.5, 0.5);
		ctx.lineWidth = 1;

		// draw lines
		for (var i = 0; i < size; i++) {
			ctx.moveTo(gridWidth * i + edgeWidth, edgeWidth);
			ctx.lineTo(gridWidth * i + edgeWidth, gridWidth * (size - 1) + edgeWidth);
			ctx.stroke();

			ctx.moveTo(edgeWidth, gridWidth * i + edgeWidth);
			ctx.lineTo(gridWidth * (size - 1) + edgeWidth, gridWidth * i + edgeWidth);
			ctx.stroke();
		}

		// draw corner stars
		if (size >= 13) {
			ctx.beginPath();
			ctx.arc(edgeWidth + gridWidth * 3, edgeWidth + gridWidth * 3, 2, 0, 2 * Math.PI);
			ctx.fill();
			ctx.closePath();

			ctx.beginPath();
			ctx.arc(edgeWidth + gridWidth * 3, canvasWidth - gridWidth * 3 - edgeWidth, 2, 0, 2 * Math.PI);
			ctx.fill();
			ctx.closePath();

			ctx.beginPath();
			ctx.arc(canvasWidth - gridWidth * 3 - edgeWidth, gridWidth * 3 + edgeWidth, 2, 0, 2 * Math.PI);
			ctx.fill();
			ctx.closePath();

			ctx.beginPath();
			ctx.arc(canvasWidth - gridWidth * 3 - edgeWidth, canvasWidth - gridWidth * 3 - edgeWidth, 2, 0, 2 * Math.PI);
			ctx.fill();
			ctx.closePath();
		}

		// draw center stars
		if (size >= 19) {
			ctx.beginPath();
			ctx.arc(canvasWidth / 2, gridWidth * 3 + edgeWidth, 2, 0, 2 * Math.PI);
			ctx.fill();
			ctx.closePath();

			ctx.beginPath();
			ctx.arc(canvasWidth / 2, canvasWidth - gridWidth * 3 - edgeWidth, 2, 0, 2 * Math.PI);
			ctx.fill();
			ctx.closePath();

			ctx.beginPath();
			ctx.arc(gridWidth * 3 + edgeWidth, canvasWidth / 2, 2, 0, 2 * Math.PI);
			ctx.fill();
			ctx.closePath();

			ctx.beginPath();
			ctx.arc(canvasWidth - gridWidth * 3 - edgeWidth, canvasWidth / 2, 2, 0, 2 * Math.PI);
			ctx.fill();
			ctx.closePath();

			// tianyuan
			ctx.beginPath();
			ctx.arc(canvasWidth / 2, canvasWidth / 2, 2, 0, 2 * Math.PI);
			ctx.fill();
			ctx.closePath();
		}

		ctx.restore();

		topLayer.onMouseOver = function(e) {

		}

		topLayer.onclick = function(e) {
			var
				e = e || window.event,

				color = game.getTurn(),
				mode = game.getGameMode(),
				curNode = game.getCurrentNode(),
				lastMove = (curNode.type === NodeType.Move ? curNode.stone : null),

				// Calculate mouse's position on the board,
				// to decide which point is clicked.
				rect = board.getBoundingClientRect(),
				x = (e.clientX - rect.left) * (board.width / rect.width),
				y = (e.clientY - rect.top) * (board.height / rect.height),
				coordX = Math.round((x - edgeWidth) / gridWidth),
				coordY = Math.round((y - edgeWidth) / gridWidth),

				dead,
				oldBoard;

			// point's [x,y]
			x = coordX * gridWidth + edgeWidth;
			y = coordY * gridWidth + edgeWidth;

			// make move or place a stone
			if (mode === GameMode.PLAY_MODE) {
				dead = game.makeMove(coordX, coordY, color);
			} else if (mode === GameMode.EDIT_MODE) {
				dead = game.placeStone(coordX, coordY, color);
			}

			// point is playable
			if (dead >= 0) {
				oldBoard = game.getPrevNode().board;
				render(oldBoard, lastMove);
			}

		}

		canvasHolder.appendChild(board);
		canvasHolder.appendChild(topLayer);

		// game controller
		toolbar.className = "zGo-toolbar";
		toolbar.style.width = boardWidth + "px";

		var back = document.createElement("span"),
			next = document.createElement("span"),
			first = document.createElement("span"),
			end = document.createElement("span"),
			moveNo = document.createElement("span");

		back.className = "zGo-btn zGo-backbtn";
		next.className = "zGo-btn zGo-nextbtn";
		first.className = "zGo-btn zGo-firstbtn";
		end.className = "zGo-btn zGo-endbtn";
		moveNo.className = "zGo-moveNo";
		moveNo.innerHTML = "0";

		back.onclick = function(e) {
			var 
				curNode = game.getCurrentNode(),
				oldBoard = game.getCurrentBoard(),
				lastMove;

			if (curNode.type === NodeType.Move) {
				lastMove = curNode.stone;
				game.prev();
			} else {
				game.prevMove();
			}

			render(oldBoard, lastMove);
		}

		next.onclick = function(e) {
			var curNode = game.getCurrentNode(),
				oldBoard = game.getCurrentBoard(),
				lastMove;

			// Handle: we are at the last node.
			if (!curNode.next) {
				return;
			}

			if (curNode.type === NodeType.Move) {
				lastMove = curNode.stone;
				while (game.getNextNode() && game.getNextNode().type === NodeType.Place) {
					game.next();
				}

				// meaning next node is a move
				if (game.getCurrentNode() === curNode) {
					game.next();
				}
				
			} else {
				game.next();
			}

			render(oldBoard, lastMove);			
		}

		first.onclick = function(e) {
			var oldBoard = game.getCurrentBoard();
			game.first();
			render(oldBoard);
		}

		end.onclick = function(e) {
			var curNode = game.getCurrentNode(),
				oldBoard = game.getCurrentBoard(),
				lastMove;

			// Handle: we are at the end node.
			if (!curNode.next) {
				return;
			}

			if (curNode.type === NodeType.Move) {
				lastMove = curNode.stone;
			}

			game.end();
			render(oldBoard, lastMove);
		}

		toolbar.appendChild(back);
		toolbar.appendChild(next);
		toolbar.appendChild(first);
		toolbar.appendChild(end);
		toolbar.appendChild(moveNo);

		mainDiv.appendChild(canvasHolder);
		mainDiv.appendChild(toolbar);
		container.appendChild(mainDiv);


		// Compare new board with old board, and repaint different points.
		// The 'old' board may not be actually old, coz game can go backward.
		function render(oldBoard, lastMove) {
			var newBoard = game.getCurrentBoard(),

				// Handle: oldBoard is not specified.
				// This should be used when rendering the game for the 1st time. 
				oldBoard = oldBoard || game.getRoot().board,

				curNode = game.getCurrentNode(),

				x,
				y,
				color;

			ctx1.save();
			ctx1.translate(0.5, 0.5);

			for (var i = 0; i < size; i++) {
				for (var j = 0; j < size; j++) {

					// skip points which didn't change
					if (newBoard[i][j] === oldBoard[i][j]) {
						continue;
					}

					x = edgeWidth + gridWidth * j;
					y = edgeWidth + gridWidth * i;

					// remove dead stone
					if (newBoard[i][j] === ColorType.None) {
						ctx1.clearRect(x - gridWidth / 2, y - gridWidth / 2, gridWidth, gridWidth);
					} else {

						// draw new stone
						color = (newBoard[i][j] === ColorType.Black ? "black" : "white");
						ctx1.fillStyle = color;
						ctx1.beginPath();
						ctx1.arc(x, y, gridWidth / 2 - 1, 0, 2 * Math.PI);
						ctx1.fill();
						ctx1.closePath();
					}

				}
			}

			// remove mark on old last move
			if (lastMove && newBoard[lastMove.y][lastMove.x] !== ColorType.None) {
				x = edgeWidth + gridWidth * lastMove.x;
				y = edgeWidth + gridWidth * lastMove.y;
				color = (lastMove.color === ColorType.Black ? "black" : "white");
				ctx1.fillStyle = color;
				ctx1.lineWidth = 2;
				ctx1.beginPath();
				ctx1.arc(x, y, gridWidth / 2 - 1, 0, 2 * Math.PI);
				ctx1.fill();
				ctx1.closePath();
			}

			// draw mark on current last move
			if (curNode.type === NodeType.Move) {
				x = edgeWidth + gridWidth * curNode.stone.x;
				y = edgeWidth + gridWidth * curNode.stone.y;
				color = (curNode.stone.color === ColorType.Black ? "white" : "black");
				ctx1.strokeStyle = color;
				ctx1.lineWidth = 2;
				ctx1.beginPath();
				ctx1.arc(x, y, gridWidth / 2 / 2, 0, 2 * Math.PI);
				ctx1.stroke();
				ctx1.closePath();
			}

			ctx1.restore();

			moveNo.innerHTML = game.getCurrentNo();
		}

		this.render = render;
	}

	window.zGo = zGo;
})();