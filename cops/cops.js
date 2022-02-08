// needed game objects
var mouseController

// assets
var GAMEIMAGES = ['grass1', 'grass2', 'grass3', 'obs1', 'obs2', 'obs3', 'obs4', 'cop', 'robber'];
var images;

// visual dimensions
// dimensions
var gridW = 10
var gridH = 10

// game variables
var numCops = 2;
var numRobs = 2;
var cops = new Array();
var robbers = new Array();
var players = 1;
var gameover = false;
// Arbitrary maximum amount of turns
var maxTurns = 50;
var curTurn = 0;
var turnRenderer
var playerChar;
var curPlayer;
var curCop = 0;
var curRob = 0;
var targetRob = 0
var playerCount = 0;

var gameObjects;
var gridObject;
var ui;

var curObj;
var curRend;

function initializeGame() {
    createMenu()
}

function createMenu () {
    // Destoy the current objects
    for (var i = worldObject.children.length; i > 0; i--) {
        removeGameObject(null, worldObject.children[0])
    }
    // Create the menu
    var menuObj0 = new GameObject(canvas.width / 2 - 180, canvas.height / 2)
    var menuObj1 = new GameObject(canvas.width / 2 - 180, canvas.height * 0.7)
    menuObj0.xSize = 1; menuObj0.ySize = 1; menuObj0.visible = true
    menuObj1.xSize = 1; menuObj1.ySize = 1; menuObj1.visible = true
    menuObj0.addScript({update: loadGameOnKeypress})
    var rend0 = new TextRenderer(menuObj0, 'To play as a Cop, press C', 'Arial', 12, undefined, undefined, -200)
    var rend1 = new TextRenderer(menuObj1, 'To player as a Robber, press R', 'Arial', 13, undefined, undefined, -200)
    worldObject.addChild(menuObj0)
    worldObject.addChild(menuObj1)
}

function loadGameOnKeypress () {
    // If 'C' is pressed, start game as cop
    if (input.inputArray['Key67'].down) {
      playerChar = 'cop'
      console.log('Player character set to ' + playerChar)
      //load images
      preloadArtAssets('cops/images/', GAMEIMAGES, startGame)
    }

    // If 'R' is pressed, start game as robber
    if (input.inputArray['Key82'].down) {
      playerChar = 'robber'
      console.log('Player character set to ' + playerChar)
      //load images
      preloadArtAssets('cops/images/', GAMEIMAGES, startGame)
    }
}

function startGame(initialImages) {
    // Destoy the current objects
    for (var i = worldObject.children.length; i > 0; i--) {
      removeGameObject(null, worldObject.children[0])
    }
    // Save the references to the images for later
    images = initialImages;
    // create gameObjects
    gameObjects = new GameObject(0,0);
    gameObjects.tag = "OBJECTS";
    var ui = new GameObject(0,0);
    ui.tag = "UI";
    worldObject.addChild(gameObjects);
    worldObject.addChild(ui);

    // set up grid object and initialize
    var cellSize = canvas.width / gridW
    curObj = new GameObject(0, 0);
    curObj.xSize = canvas.width;
    curObj.ySize = canvas.height;
    curObj.tag.push('board');
    gridObject = new Grid(gridH, gridW, cellSize)
    gridObject.tag.push('grid')
    worldObject.addChild(curObj);

    initializeGrid(curObj, gridObject, cellSize)
    initializeUI(ui)

    curObj.addScript({update: checkInput});
}

function initializeGrid (curObj, gridObj, cellSize) {

    //initialize entire board to empty
    for (var i = 0; i < gridH; i++) {
        for (var j = 0; j < gridW; j++) {
            var rand = getRandomIntInclusive(1, 3);
            gridObj.grid[i][j] = new GameObject(curObj.x + cellSize * j + cellSize / 2, curObj.y + cellSize * i + cellSize / 2)
            gridObj.grid[i][j].xSize = cellSize; gridObj.grid[i][j].ySize = cellSize; gridObj.grid[i][j].visible = true
            gridObj.grid[i][j].tag.push('EMPTY')
            curRend = new ImageRenderer(gridObj.grid[i][j], images['grass' + rand], 10)
            gridObj.grid[i][j].cost = 1;
            curObj.addChild(gridObj.grid[i][j])
        }
    }
    
    //assign board edges to walls
    for (var i = 0; i < gridH; i++) {
        for (var j = 0; j < gridW; j++) {
            if (i == 0 || j == 0 || i == gridH - 1 || j == gridW - 1) {
                gridObj.grid[i][j].tag[0] = 'WALL';
                gridObj.grid[i][j].render[0].imageSource = images['obs2'];
                gridObj.grid[i][j].cost = Math.MAX_SAFE_INTEGER;
            }
        }
    }

    initializeCopsRobbers(gridObj.grid);
    initializeObstacles(gridObj.grid);

    curObj.addChild(gridObj)
}

function initializeCopsRobbers(grid) {
    //cops randomized on left third of board
    var rightLimit = gridW - 2; var leftLimit = 1; var topLimit = 1; var bottomLimit = Math.floor(gridH * 0.3);
    for (var i = 0; i < numCops; i++) {
        spawned = false;
        while (!spawned) {
            obsW = getRandomIntInclusive(leftLimit, rightLimit);
            obsH = getRandomIntInclusive(topLimit, bottomLimit);
            var box = grid[obsW][obsH];
        
            if (validLocation(grid, obsW, obsH, 'COP')) {
                curObj = new GameObject(box.x, box.y);
                curObj.xSize = box.xSize;
                curObj.ySize = box.ySize;
                curObj.tag[0] = 'COP';
                curObj.collider = true;
                curObj.cost = Math.MAX_SAFE_INTEGER;
                curObj.visible = true;
                curObj.row = obsW;
                curObj.col = obsH;
                curObj.player = new Player(playerCount++);
                curRend = new ImageRenderer(curObj, images['cop'], 10);
                box.tag[0] = 'COP';
                box.addChild(curObj);
                spawned = true;
                cops.push(curObj);
            }
        }
    }
    //robbers randomized on right third of board
    rightLimit = gridW - 2; leftLimit = 1; topLimit = Math.floor(gridH - gridH * 0.3); bottomLimit = gridH - 2;
    for (var i = 0; i < numRobs; i++) {
        spawned = false;
        while (!spawned) {
            obsW = getRandomIntInclusive(leftLimit, rightLimit);
            obsH = getRandomIntInclusive(topLimit, bottomLimit);
            var box = grid[obsW][obsH];
        
            if (validLocation(grid, obsW, obsH, 'ROBBER')) {
                curObj = new GameObject(box.x, box.y);
                curObj.xSize = box.xSize;
                curObj.ySize = box.ySize;
                curObj.tag[0] = 'ROBBER';
                curObj.collider = true;
                curObj.cost = Math.MAX_SAFE_INTEGER;
                curObj.visible = true;
                curObj.row = obsW;
                curObj.col = obsH;
                curObj.player = new Player(playerCount++);
                curRend = new ImageRenderer(curObj, images['robber'], 10);
                box.tag[0] = 'ROBBER';
                box.addChild(curObj);
                spawned = true;
                robbers.push(curObj);
            }
        }
    }
    if (playerChar == 'cop') {
        curPlayer = cops[0];
        cops[0].tag[1] = 'PLAYERCHAR'
    } else {
        curPlayer = robbers[0];
        robbers[0].tag[1] = 'PLAYERCHAR'
    }
}

function initializeObstacles(grid) {
    var numObstacles = Math.floor(gridW * gridH / 10);
    // any place 1 space away from walls
    var rightLimit = gridW - 3; leftLimit = 2; topLimit = 2; bottomLimit = gridH - 3;

    for (var i = 0; i < numObstacles; i++) {
        spawned = false;
        while (!spawned) {
            obsW = getRandomIntInclusive(leftLimit, rightLimit);
            obsH = getRandomIntInclusive(topLimit, bottomLimit);
    
            if (validLocation(grid, obsW, obsH, 'OBSTACLE')) {
                var rand = getRandomIntInclusive(1, 4);
                grid[obsW][obsH].tag[0] = 'OBSTACLE';
                grid[obsW][obsH].collider = true;
                grid[obsW][obsH].render[0].imageSource = images['obs' + rand];
                grid[obsW][obsH].cost = Math.MAX_SAFE_INTEGER;
                spawned = true;
            }
        }
    }
}

function initializeUI (ui) {
    curObj = new GameObject(canvas.width * 0.01, canvas.height * 1.65)
    curObj.xSize = canvas.width * 0.05; curObj.ySize = 25; curObj.tag.push('curTurn'); curObj.visible = true
    turnRenderer = new TextRenderer(curObj, 'Current Turn: ' + curTurn, 'Arial', 15)
    ui.addChild(curObj)

    curObj = new GameObject(canvas.width * 0.01, canvas.height * 1.75)
    curObj.xSize = canvas.width * 0.05; curObj.ySize = 25; curObj.tag.push('maxTurns'); curObj.visible = true
    maxTurnRend = new TextRenderer(curObj, 'Turns to Robber Win: ' + (maxTurns - curTurn), 'Arial', 15)
    ui.addChild(curObj)
}

function validLocation(grid, obsW, obsH, tag) {
    var count = 0;
    var limit;
    var type;
    if (tag == 'OBSTACLE') {
        limit = 1;
    } else {
        limit = 0;
    }
    // check if current tile is empty and count neighbors to avoid trapping players
    for (var w = obsW - 1; w <= obsW + 1; w++) {
        for (var h = obsH - 1; h <= obsH + 1; h++) {
            if (obsW == w && obsH == h && grid[w][h].tag != 'EMPTY') {
                return false;
            } else {
                if (grid[w][h].tag[0] === tag) {
                    count++;
                }
            }
        }
    }
    if (count > limit) {
        return false;
    } else {
        return true;
    }  
}

// Get a random int
function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function flee( testY, testX ) {
    var upScore = 0
    var leftScore = 0
    var rightScore = 0
    var downScore = 0
    for (var c in cops) {
        var copX = cops[c].col;
        var copY = cops[c].row;
        // Don't pick walls
        if(gridObject.grid[testY - 1][testX].tag[0] !== 'EMPTY' ) {
            upScore += 1
        }
        if(gridObject.grid[testY][testX - 1].tag[0] !== 'EMPTY' ) {
            leftScore += 1
        }
        if(gridObject.grid[testY][testX + 1].tag[0] !== 'EMPTY' ) {
            rightScore += 1
        }
        if(gridObject.grid[testY + 1][testX].tag[0] !== 'EMPTY' ) {
            downScore += 1
        }
        // Using a larger dist to try to get better results
        var distX = Math.abs(copX - testX)
        var distY = Math.abs(copY - testY + 1)
        upScore += 1 / (distX * distX + distY * distY)
        distX = Math.abs(copX - testX + 1)
        distY = Math.abs(copY - testY)
        leftScore += 1 / (distX * distX + distY * distY)
        distX = Math.abs(copX - testX - 1)
        distY = Math.abs(copY - testY)
        rightScore += 1 / (distX * distX + distY * distY)
        distX = Math.abs(copX - testX)
        distY = Math.abs(copY - testY - 1)
        downScore += 1 / (distX * distX + distY * distY)
    }
    // Also flee other robbers to prevent combos
    for (var r in robbers) {
        var copX = robbers[r].col;
        var copY = robbers[r].row;
        // Don't pick walls
        if(gridObject.grid[testY - 1][testX].tag[0] !== 'EMPTY' ) {
            upScore += 1
        }
        if(gridObject.grid[testY][testX - 1].tag[0] !== 'EMPTY' ) {
            leftScore += 1
        }
        if(gridObject.grid[testY][testX + 1].tag[0] !== 'EMPTY' ) {
            rightScore += 1
        }
        if(gridObject.grid[testY + 1][testX].tag[0] !== 'EMPTY' ) {
            downScore += 1
        }
        // Take the inverse distance to encourage running away
        var distX = Math.abs(copX - testX)
        var distY = Math.abs(copY - testY + 1)
        upScore += 1 / (distX * distX + distY * distY)
        distX = Math.abs(copX - testX + 1)
        distY = Math.abs(copY - testY)
        leftScore += 1 / (distX * distX + distY * distY)
        distX = Math.abs(copX - testX - 1)
        distY = Math.abs(copY - testY)
        rightScore += 1 / (distX * distX + distY * distY)
        distX = Math.abs(copX - testX)
        distY = Math.abs(copY - testY - 1)
        downScore += 1 / (distX * distX + distY * distY)
    }
    //console.log(leftScore)
    //console.log(rightScore)
    //console.log(upScore)
    //console.log(downScore)
    // Return the square with the lowest cost
    if(leftScore <= upScore && leftScore <= rightScore && leftScore <= downScore) {
        //console.log('left')
        return 'left'
    }
    if(rightScore <= upScore && rightScore <= leftScore && rightScore <= downScore) {
        //console.log('right')
        return 'right'
    }
    if(upScore <= leftScore && upScore <= rightScore && upScore <= downScore) {
        //console.log('up')
        return 'up'
    }
    if(downScore <= leftScore && downScore <= rightScore && downScore <= upScore) {
        //console.log('down')
        return 'down'
    }
    return 'dne'
}

// Get the next dirrection by using A* pathfinding.
function getDirrection( startX, startY, endX, endY ) {
    // // console.log('{'+startX+','+startY+'}')
    // // console.log('{'+endX+','+endY+'}')
    // // Data Structures
    var costs = new Grid(gridH, gridW, 0)
    for(var i = 0; i < gridW; i++) {
        for(var j = 0; j < gridH; j++) {
            if(gridObject.grid[i][j].tag[0] === 'EMPTY' || gridObject.grid[i][j].tag[0] === 'ROBBER') {
                var minimumSquares = Math.abs(i - endX) + Math.abs(j - endY)
                costs.grid[i][j] = {visitted: false, move: 0, estimate: minimumSquares, total: minimumSquares, direction: 'stay'}
            }
        }
    }
    // printPath(costs)
    var squareList = []
    var movementCost = 0
    var minimumSquares = Math.abs(startX - endX) + Math.abs(startY - endY)
    costs.grid[startX][startY] = {visitted: true, move: 0, estimate: minimumSquares, total: minimumSquares, direction: 'stay'}
    squareList.push({x: startX, y: startY})
    // printPath(costs)
    // console.log(squareList[0])
    // console.log(squareList.length)
    // Keep checking squares untill the cheapest path to the end is found.
    while(squareList.length > 0 && (squareList[0].x !== endX || squareList[0].y !== endY)) {
        //printPath(costs)
        //console.log(squareList.length)
        //console.log(squareList[0].x+', '+squareList[0].y)
        // Remove this square from the list.
        var next = squareList[0]
        squareList.splice(0, 1)
        // Check neiboring squares
        checkSquare(next, {x:next.x, y:next.y + 1}, {x:endX, y:endY}, 'right', costs, squareList)
        checkSquare(next, {x:next.x + 1, y:next.y}, {x:endX, y:endY}, 'down', costs, squareList)
        checkSquare(next, {x:next.x, y:next.y - 1}, {x:endX, y:endY}, 'left', costs, squareList)
        checkSquare(next, {x:next.x - 1, y:next.y}, {x:endX, y:endY}, 'up', costs, squareList)
        // Error checking if we run out of squares to check without reaching the end.
        if(squareList.length === 0 && costs.grid[endX][endY] === 0) {
            // Path does not exist
            return 'dne'
        }
    }

    // Setup
    var nextX = endX
    var nextY = endY
    // console.log('{'+nextX+','+nextY+'}')
    // console.log('{'+startX+','+startY+'}')
    // the dirrection of the previous square
    var direction
    // Work backwards to get the next path to try.
    while( nextX !== startX || nextY !== startY ) {
        // Save the dirrection of the current square
        direction = costs.grid[nextX][nextY].direction
        // Move to the square.
        if(direction == 'down') {
            nextX--
        }
        else if(direction == 'up') {
            nextX++
        }
        else if(direction == 'right') {
            nextY--
        }
        else if(direction == 'left') {
            nextY++
        }
        else {
            return 'dne'
        }
    }
    // printPath(costs)
    return direction;
}

// Debug for printing the path
function printPath (costs) {
    var out
    out = '\n'
    for(var i = 0; i < gridW; i++) {
        for(var j = 0; j < gridH; j++) {
            if(costs.grid[i][j] === 0) {
                out += ',' + costs.grid[i][j]
            }
            else {
                if( costs.grid[i][j].visitted ) {
                    out += ',' + costs.grid[i][j].total + costs.grid[i][j].direction[0]
                }
                else {
                    out += ',__'
                }
            }
        }
        out += '\n'
    }
    console.log(out)
}

// Hellper function for pathfinding
function checkSquare (curent, end, goal, string, costs, squareList) {
    // Add the surrounding squares to the list if they are valid and not in it yet.
    if(costs.grid[end.x][end.y] !== 0) {
        // Check if it is already in the list
        if(costs.grid[end.x][end.y].visitted) {
            // If they are their check to see if a lower cost was found
            if(costs.grid[end.x][end.y].move > costs.grid[curent.x][curent.y] + 1) {
                // If so, update the cost and remove it from the list.
                costs.grid[end.x][end.y].move = costs.grid[curent.x][curent.y].move + 1
                costs.grid[end.x][end.y].total = costs.grid[curent.x][curent.y].move + 1 + costs.grid[end.x][end.y].estimate
                costs.grid[end.x][end.y].direction = string

                // Find and remove the old one
                for(var i = 0; i < squareList.length; i++) {
                    if(squareList[idx].x === end.x && squareList[idx].y === end.y) {
                        squareList.splice(i, 1)
                    }
                }

                // Add the new cost to the list
                while( idx < squareList.length && totalCost > costs.grid[squareList[idx].x][squareList[idx].y].total ) {
                    idx++
                }
                // insert at idx removing 0 items
                squareList.splice(idx, 0, {x: end.x, y: end.y})
            }
        }
        // If not add it
        else {
            movementCost = costs.grid[curent.x][curent.y].move + 1
            costs.grid[end.x][end.y].visitted = true
            costs.grid[end.x][end.y].move = movementCost
            costs.grid[end.x][end.y].total = movementCost + costs.grid[end.x][end.y].estimate
            costs.grid[end.x][end.y].direction = string
            // Add the square to the list.
            var idx = 0
            var totalCost = costs.grid[end.x][end.y].total
            while( idx < squareList.length && totalCost > costs.grid[squareList[idx].x][squareList[idx].y].total ) {
                idx++
            }
            // insert at idx removing 0 items
            squareList.splice(idx, 0, {x: end.x, y: end.y})
        }
    }
}

// Updates current turn and UI. Call at end of each turn
function updateTurns() {
    curTurn++;
    turnRenderer.text = 'Current Turn: ' + curTurn
    maxTurnRend.text = 'Turns to Robber Win: ' + (maxTurns - curTurn) 
}

// check if robber was caught by checking if 2 or more cops are in the up,down,left,right spaces
// Or if a robber is next to a Cop and has no free squares
// directly adjacent to the robber
function checkCaught(grid) {
    var obsW;
    var obsH;
    var count;
    var freeSquares;
    for (var r in robbers) {
        count = 0;
        freeSquares = 0;
        obsW = robbers[r].row;
        obsH = robbers[r].col;
        if (grid[obsW-1][obsH].tag[0] == 'COP')
            count++
        if (grid[obsW+1][obsH].tag[0] == 'COP')
            count++
        if (grid[obsW][obsH-1].tag[0] == 'COP')
            count++
        if (grid[obsW][obsH+1].tag[0] == 'COP')
            count++
        //Check free squares
        if (grid[obsW-1][obsH].tag[0] == 'EMPTY')
            freeSquares++
        if (grid[obsW+1][obsH].tag[0] == 'EMPTY')
            freeSquares++
        if (grid[obsW][obsH-1].tag[0] == 'EMPTY')
            freeSquares++
        if (grid[obsW][obsH+1].tag[0] == 'EMPTY')
            freeSquares++
        if (count >= 2 || (count >= 1 && freeSquares === 0)) {
            //robber caught, handle
            console.log("ROBBER CAUGHT")
            robbers[r].parent.tag[0] = 'EMPTY';
            removeGameObject(null, robbers[r])
            // Remove the robber from the list
            robbers.splice(r,1)
            if(robbers.length == 0) {
                console.log('Cops Win.')
                var menuObj0 = new GameObject(canvas.width / 2, canvas.height / 2)
                menuObj0.xSize = 1; menuObj0.ySize = 1; menuObj0.visible = true
                var rend0 = new TextRenderer(menuObj0, 'Cops Win', 'Arial', 40, undefined, undefined, -200)
                worldObject.addChild(menuObj0)
                gameover = true
            }
        }
    }
}

// Change who's turn it is.
function changeTurn() {
    // change turn
    if (curPlayer.tag[0] == 'COP') {
        curCop++;
        curPlayer = cops[curCop];
        if (curCop >= cops.length) {
            curCop = 0;
            curPlayer = robbers[curRob]
        }
    } else {
        curRob++;
        curPlayer = robbers[curRob];
        if (curRob >= robbers.length) {
            updateTurns();
            if(curTurn === maxTurns) {
                console.log('Robbers win.')
                var menuObj0 = new GameObject(canvas.width / 2, canvas.height / 2)
                menuObj0.xSize = 1; menuObj0.ySize = 1; menuObj0.visible = true
                var rend0 = new TextRenderer(menuObj0, 'Robbers Win', 'Arial', 40, undefined, undefined, -200)
                worldObject.addChild(menuObj0)
                gameover = true
            }
            curRob = 0;
            curPlayer = cops[curCop];
        }
    }
}

// Add the current player to the new grid cell and change turn
function moveToTile(grid) {
    grid[curPlayer.row][curPlayer.col].addChild(curPlayer);
    grid[curPlayer.row][curPlayer.col].tag[0] = curPlayer.tag[0];
    curPlayer.x = curPlayer.parent.x;
    curPlayer.y = curPlayer.parent.y;

    //check if a robber is caught
    checkCaught(grid);

    //handle turn change here
    changeTurn();
}

// Get input and move characters
function checkInput() {
    if(!gameover) {
        if(curPlayer === undefined) {
            changeTurn()
        }
        if((playerChar === 'cop' && curPlayer.tag[0] === 'COP' && curPlayer.tag[1] === 'PLAYERCHAR') || (playerChar === 'robber' && curPlayer.tag[0] === 'ROBBER' && curPlayer.tag[1] === 'PLAYERCHAR')) {
            var curBox = curPlayer.parent;
            var grid = findObjectByTag(worldObject, 'grid');
            if (input.inputArray[curPlayer.player.controller.left].down) {
                if (grid.grid[curPlayer.row][curPlayer.col - 1].tag[0] == 'EMPTY') {
                    removeChild(curBox, curPlayer);
                    curBox.tag[0] = 'EMPTY';
                    curPlayer.col--;
                    moveToTile(grid.grid);
                }
                else {
                    removeChild(curBox, curPlayer);
                    moveToTile(grid.grid);
                }
            } else if (input.inputArray[curPlayer.player.controller.right].down) {
                if (grid.grid[curPlayer.row][curPlayer.col + 1].tag[0] == 'EMPTY') {
                    removeChild(curBox, curPlayer);
                    curBox.tag[0] = 'EMPTY';
                    curPlayer.col++;
                    moveToTile(grid.grid);
                }
                else {
                    removeChild(curBox, curPlayer);
                    moveToTile(grid.grid);
                }
            } else if (input.inputArray[curPlayer.player.controller.up].down) {
                if (grid.grid[curPlayer.row - 1][curPlayer.col].tag[0] == 'EMPTY') {
                    removeChild(curBox, curPlayer);
                    curBox.tag[0] = 'EMPTY';
                    curPlayer.row--;
                    moveToTile(grid.grid);
                }
                else {
                    removeChild(curBox, curPlayer);
                    moveToTile(grid.grid);
                }
            } else if (input.inputArray[curPlayer.player.controller.down].down) {
                if (grid.grid[curPlayer.row + 1][curPlayer.col].tag[0] == 'EMPTY') {
                    removeChild(curBox, curPlayer);
                    curBox.tag[0] = 'EMPTY';
                    curPlayer.row++;
                    moveToTile(grid.grid);
                }
                else {
                    removeChild(curBox, curPlayer);
                    moveToTile(grid.grid);
                }
            }
        }
        // Automaticly move the cop towards a robber.
        else {
            var movement
            // Cops chase using pathfinding.
            if (curPlayer.tag[0] === 'COP') {
                movement = getDirrection(curPlayer.row, curPlayer.col, robbers[0].row, robbers[0].col)
            }
            // Robbers runn arround randomly
            else {
                movement = flee(curPlayer.row, curPlayer.col)
                //console.log(movement)
            }
            // console.log(movement)
            var curBox = curPlayer.parent;
            var grid = findObjectByTag(worldObject, 'grid');
            if (movement === 'left') {
                if (grid.grid[curPlayer.row][curPlayer.col - 1].tag[0] == 'EMPTY') {
                    removeChild(curBox, curPlayer);
                    curBox.tag[0] = 'EMPTY';
                    curPlayer.col--;
                    moveToTile(grid.grid);
                }
                else {
                    removeChild(curBox, curPlayer);
                    moveToTile(grid.grid);
                }
            } else if (movement === 'right') {
                if (grid.grid[curPlayer.row][curPlayer.col + 1].tag[0] == 'EMPTY') {
                    removeChild(curBox, curPlayer);
                    curBox.tag[0] = 'EMPTY';
                    curPlayer.col++;
                    moveToTile(grid.grid);
                }
                else {
                    removeChild(curBox, curPlayer);
                    moveToTile(grid.grid);
                }
            } else if (movement === 'up') {
                if (grid.grid[curPlayer.row - 1][curPlayer.col].tag[0] == 'EMPTY') {
                    removeChild(curBox, curPlayer);
                    curBox.tag[0] = 'EMPTY';
                    curPlayer.row--;
                    moveToTile(grid.grid);
                }
                else {
                    removeChild(curBox, curPlayer);
                    moveToTile(grid.grid);
                }
            } else if (movement === 'down') {
                if (grid.grid[curPlayer.row + 1][curPlayer.col].tag[0] == 'EMPTY') {
                    removeChild(curBox, curPlayer);
                    curBox.tag[0] = 'EMPTY';
                    curPlayer.row++;
                    moveToTile(grid.grid);
                }
                else {
                    removeChild(curBox, curPlayer);
                    moveToTile(grid.grid);
                }
            }
            // no valid path, do not move
            else {
                removeChild(curBox, curPlayer);
                moveToTile(grid.grid);
            }
        }
    }
}
