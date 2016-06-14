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

		ColorType = {
			'Black': 1,
			'None': 0,
			'White': -1
		},

		// 'Place' means the stone is a setup.
		NodeType = {
			'Root': 0,
			'Move': 1,
			'Place': 2,
			'Other': 3
		};

	/**
	 * Nodes of the game.
	 *
	 * @size: board size, default 19
	 * 
	 */
	function GameTree(size) {

		var // board of root node
			emptyBoard = [],

			size = size || 19,

			// root node, which is the same for any game.
			root,

			// current node of the game
			current;

		// initialize board for root node.
		for (var i = 0; i < size; ++i) {
			emptyBoard[i] = [];
			for (var j = 0; j < size; ++j) {
				emptyBoard[i][j] = ColorType.None;
			}
		}

		// create root node.
		root = new Node(NodeType.Root, null, emptyBoard);

		// 1 means black to play, -1 means white to play.
		root.turn = 1;

		root.number = 0;

		current = root;

		this.size = size;
		this.mode = GameMode.PLAY_MODE;
		this.info = {};

		this.setMode = function(newMode) {
			this.mode = newMode;
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

		// these change current node
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

		// these don't change current node
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
			return nextMove && nextMove[0];
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
			root.next = null;
			current = root;
		}

		this.makeMove = function(x, y, color) {
			var // for ko situation.
				lastBoard = current.prev ? current.prev.board : null,

				curBoard = current.board,
				newBoard = copyBoardArr(curBoard);

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
			if (x > 0 && !hasLiberty(newBoard, x - 1, y) && newBoard[y][x] !== newBoard[y][x - 1]) {
				dead += removeString(newBoard, x - 1, y);
			}
			if (x < size - 1 && !hasLiberty(newBoard, x + 1, y) && newBoard[y][x] !== newBoard[y][x + 1]) {
				dead += removeString(newBoard, x + 1, y);
			}
			if (y > 0 && !hasLiberty(newBoard, x, y - 1) && newBoard[y][x] !== newBoard[y - 1][x]) {
				dead += removeString(newBoard, x, y - 1);
			}
			if (y < size - 1 && !hasLiberty(newBoard, x, y + 1) && newBoard[y][x] !== newBoard[y + 1][x]) {
				dead += removeString(newBoard, x, y + 1);
			}

			// Handle self capture and ko
			if ((dead === 0 && !hasLiberty(newBoard, x, y)) || (lastBoard && newBoard.toString() === lastBoard.toString())) {
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
			var curBoard = current.board,
				newBoard = copyBoardArr(curBoard);

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
			if (x > 0 && hasLiberty(newBoard, x - 1, y) == false && newBoard[y][x] != newBoard[y][x - 1]) {
				dead += removeString(newBoard, x - 1, y);
			}
			if (x < size - 1 && hasLiberty(newBoard, x + 1, y) == false && newBoard[y][x] != newBoard[y][x + 1]) {
				dead += removeString(newBoard, x + 1, y);
			}
			if (y > 0 && hasLiberty(newBoard, x, y - 1) == false && newBoard[y][x] != newBoard[y - 1][x]) {
				dead += removeString(newBoard, x, y - 1);
			}
			if (y < size - 1 && hasLiberty(newBoard, x, y + 1) == false && newBoard[y][x] != newBoard[y + 1][x]) {
				dead += removeString(newBoard, x, y + 1);
			}

			// Handle: self capture
			if ((dead == 0 && hasLiberty(newBoard, x, y) == false)) {
				return false;
			}

			// add the edited stone to game tree.
			var node = new Node(NodeType.Place, {
				x: x,
				y: y,
				color: color
			}, newBoard);

			// doesn't change whom to play or move number
			node.turn = current.turn;
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

		function copyBoardArr(boardArr) {
			var i, ret = [];
			for (i = 0; i < boardArr.length; i++) {
				ret.push(boardArr[i].slice());
			}
			return ret;
		}

		// constructor of node
		function Node(tpye, stone, board, opt) {

			// sepecify node type.
			this.type = tpye;

			// board status of this node
			this.board = board;

			this.stone = stone;

			// in case this node has marks to display on the board
			if (opt && opt['marks']) {
				this.marks = opt['marks'];
			}

			this.deadBlack = (opt && opt['deadBlack']) || 0;
			this.deadWhite = (opt && opt['deadWhite']) || 0;
		}

		// Whether point[y,x] has liberty.
		function hasLiberty(board, x, y, access) {
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
			if ((x > 0 && access[y][x - 1] == false && board[y][x - 1] == color && hasLiberty(board, x - 1, y, access)) || (y > 0 && access[y - 1][x] == false && board[y - 1][x] == color && hasLiberty(board, x, y - 1, access)) || (x < size - 1 && access[y][x + 1] == false && board[y][x + 1] == color && hasLiberty(board, x + 1, y, access)) || (y < size - 1 && access[y + 1][x] == false && board[y + 1][x] == color && hasLiberty(board, x, y + 1, access))) {
				return true;
			}
			return false;
		}

		// Remove dead stones.
		function removeString(board, x, y) {
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

	}

	/**
	 * sgf Support.
	 * 
	 */
	function SGFUtil(game) {
		this.loadSgf = function(sgf) {
			var sgfStr = sgf,
				level = -1,
				isValue = false,
				propName = "",
				propValue = "",
				curChar,
				x,
				y,
				color;

			if (!sgf) {
				return;
			}

			for (var i = 0; i < sgfStr.length; i++) {
				curChar = sgfStr.charAt(i);

				// Handle: current char is a property's value
				if (isValue) {

					// end of property value
					if (curChar === "]") {
						switch (propName) {

							// black's move or white's move
							case "B":
							case "W":
								{
									x = propValue.charCodeAt(0) - 97;
									y = propValue.charCodeAt(1) - 97;
									color = (propName === "B" ? 1 : -1);
									game.makeMove(x, y, color);
									break;
								}

								// game info properties
							case "DT":
								{
									game.info.date = propValue;
								}
							case "EV":
								{
									game.info.event = propValue;
								}
							case "RE":
								{
									game.info.result = propValue;
								}
							case "RU":
								{
									game.info.rules = propValue;
								}
							case "PB":
								{
									game.info.playerb = propValue;
								}
							case "BR":
								{
									game.info.brank = propValue;
								}
							case "PW":
								{
									game.info.playerw = propValue;
								}
							case "WR":
								{
									game.info.wrank = propValue;
								}
						}

						isValue = false;
						propName = propValue = "";
					} else {
						propValue += curChar;
					}

				} else {
					switch (curChar) {

						// end of node
						case ";":
							{
								propName = "";
								propValue = "";
								break;
							}

							// start of branch
						case "(":
							{
								propName = "";
								propValue = "";
								level++;
								break;
							}

							// end of branch
						case ")":
							{
								propName = "";
								propValue = "";
								level--;
								break;
							}

							// start of property value
						case "[":
							{
								isValue = true;
								propValue = "";
								break;
							}

						default:
							{
								propName += curChar;
							}

					}
				}

			}

		}

	}

	/**
	 * Render zGo to html.
	 * 
	 */
	function Renderer(container, game, boardWidth) {
		var size = game.size,

			// width(height) of the canvas
			canvasWidth = boardWidth,

			// width(height) of the board's grid
			gridWidth = canvasWidth / (size + 1),

			// width between the board's edge and the 1st line
			edgeWidth = gridWidth;

		// This div contains zGo.
		var mainDiv = document.createElement("div");
		mainDiv.className = "zgo-main";
		mainDiv.style.width = boardWidth + "px";

		var canvasHolder = document.createElement("div");
		canvasHolder.className = "zgo-canvasholder";
		canvasHolder.style.width = boardWidth + "px";
		canvasHolder.style.height = boardWidth + "px";

		//// draw board start
		var board = document.createElement("canvas");
		board.className = "zgo-board";
		board.width = canvasWidth;
		board.height = canvasWidth;

		var ctx = board.getContext('2d');
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
		//// draw board end

		// canvas for stones
		var topLayer = document.createElement("canvas");
		topLayer.className = "zgo-toplayer";
		topLayer.width = canvasWidth;
		topLayer.height = canvasWidth;

		var ctx1 = topLayer.getContext('2d');

		topLayer.onclick = function(e) {
			var e = e || window.event,
				color = game.getTurn(),
				mode = game.mode,
				curNode = game.getCurrentNode(),
				lastMove = (curNode.type === NodeType.Move ? curNode.stone : null),

				// Calculate which point is clicked.
				rect = board.getBoundingClientRect(),
				x = (e.clientX - rect.left) * (board.width / rect.width),
				y = (e.clientY - rect.top) * (board.height / rect.height),
				coordX = Math.round((x - edgeWidth) / gridWidth),
				coordY = Math.round((y - edgeWidth) / gridWidth),

				dead,
				oldBoard;

			x = coordX * gridWidth + edgeWidth;
			y = coordY * gridWidth + edgeWidth;

			// make a move or place a stone
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
		mainDiv.appendChild(canvasHolder);

		// game controller
		var toolbar = document.createElement("div");
		toolbar.className = "zgo-toolbar";
		toolbar.style.width = boardWidth + "px";

		toolbar.innerHTML = '<span id="zgo-firstbtn" class="zgo-btn zgo-firstbtn"></span><span id="zgo-backbtn" class="zgo-btn zgo-backbtn"></span><span id="zgo-moveNo" class="zgo-moveNo">0</span><span id="zgo-nextbtn" class="zgo-btn zgo-nextbtn"></span><span id="zgo-endbtn" class="zgo-btn zgo-endbtn"></span>';

		toolbar.onclick = function(e) {
			var targetId = e.target.id,
				curNode = game.getCurrentNode(),
				oldBoard = game.getCurrentBoard(),
				lastMove;

			switch (targetId) {
				case "zgo-infobtn":
					{
						infoDialog.style.display = "block";
						return;
					}

				case "zgo-firstbtn":
					{
						game.first();
						break;
					}

				case "zgo-backbtn":
					{
						if (curNode.type === NodeType.Move) {
							lastMove = curNode.stone;
							game.prev();
						} else {
							game.prevMove();
						}
						break;
					}

				case "zgo-nextbtn":
					{
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
						break;
					}

				case "zgo-endbtn":
					{
						// Handle: we are at the end node.
						if (!curNode.next) {
							return;
						}

						if (curNode.type === NodeType.Move) {
							lastMove = curNode.stone;
						}

						game.end();
						break;
					}
				default:
			}

			render(oldBoard, lastMove);
		}

		mainDiv.appendChild(toolbar);
		container.appendChild(mainDiv);

		// Compare new board with old board, and repaint different points.
		// The 'old' board may not be actually old, coz the game can go backward.
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

			document.getElementById("zgo-moveNo").innerHTML = game.getCurrentNo();
		}

		this.render = render;
	}


	// constructor of zGo
	var zGo = function(options) {

		// if container is not a dom element, return null.
		if (!options.container.nodeType || options.container.nodeType !== 1) {
			return null;
		}

		this.version = version;

		var width = parseInt(options.width);
		width = (!isNaN(width) && width > 0 ? width : 520);

		var game = new GameTree(19),
			sgfUtil = new SGFUtil(game),
			renderer = new Renderer(options.container, game, width);

		if (typeof options.sgf === "string") {
			sgfUtil.loadSgf(sgf);
			renderer.render();
		}
	}

	if (typeof module === "object" && module && typeof module.exports === "object") {
		// CMD Support
		module.exports = zGo;
	} else {
		// AMD Support
		if (typeof define === 'function' && define.amd) {
			define('zGo', [], function() {
				return zGo;
			});
		}
	}

	window.zGo = zGo;

})(window);