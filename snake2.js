/* global canvas, context, ImageRenderer, SolidRenderer,
GameObject, input, preloadArtAssets, addGameObject,
removeGameObject, addRenderer, removeRenderer, worldObject,
getObjectUnderMouse, getCollision, Grid, findObjectByTag, findAllObjectsByTag,
TextRenderer, camera, screenSpaceToWorldSpace, getCookie, setCookie */

var host
class Host {
  constructor (hostName) {
    // Put this object into scope.
    var hostReference = this
    // A place to store the connection
    this.hostToClient = undefined
    // Use the given host name or generate a new one.
    this.hostName = (typeof hostName !== 'undefined') ? hostName : ('' + Math.floor(10000 * Math.random()))
    // Create the client and set it up
    this.host = new Peer(this.hostName, {key: '0of84d1q9f0cc8fr'})
    this.host.on('open', function (id) {
      console.log('' + hostName + ': Was created and connected to the server with id: ' + id)
    })
    // Set up action for recieving an connection
    // the returned value is a data connection object
    this.host.on('connection', function (connection) {
      // Save the connection for use elsewhere
      hostReference.hostToClient = connection
      // Print that something connected to the host
      console.log('' + hostName + ': Connection established.')
      // Set up what to do if data is recieved from this connection
      hostReference.hostToClient.on('data', function (data) {
        console.log('' + hostName + ': Got from client: ' + data)
        if (data.messageType !== undefined) {
          if (data.messageType === 'ChangeDirrection') {
            snakes[2].body[0].direction = data.direction
          }
        }
      })
      // Set up what to do if the connection returns an error
      hostReference.hostToClient.on('error', function (error) {
        console.log('' + hostName + ': ERROR! : ' + error)
      })
      // Wait for the connection to be set up before sending a responce
      hostReference.hostToClient.on('open', function (id) {
        hostReference.hostToClient.send('Connected to ' + hostName)
        console.log('A backwards connection was established with the client.')
      })
    })
    // Set up what to do if data is recieved from somewhere unknown
    this.host.on('data', function (data) {
      console.log('' + hostName + ': Got from somewhere: ' + data)
    })
    // Error catching
    this.host.on('error', function (error) {
      // Log the error and throw the peer away
      console.log('' + hostName + ': ERROR! : ' + error)
      if (this.host !== undefined) {
        this.host.destroy()
      }
      this.host = undefined
    })
  }
}

var client
class Client {
  constructor (clientName, hostName) {
    // Put this object into scope.
    var clientReference = this
    // A place to store the connection
    this.clientToHost = undefined
    // Use the given host name or generate a new one.
    this.clientName = (typeof clientName !== 'undefined') ? clientName : ('' + Math.floor(10000 * Math.random()))
    // ...
    this.hostName = (typeof hostName !== 'undefined') ? hostName : ('' + Math.floor(10000 * Math.random()))
    // Create the client and set it up
    this.client = new Peer(this.clientName, {key: '0of84d1q9f0cc8fr'})
    this.client.on('open', function (id) {
      console.log('' + clientName + ': Was created and connected to the server with id: ' + id)
      // attempt to connect to the other server
      // returns a data conncetion object.
      clientReference.clientToHost = client.client.connect(hostName)
      // Attempt to connect to the host
      clientReference.clientToHost.on('open', function (data) {
        // print that we are connected
        console.log('client: Connected to peer')
        // Set up what to do if the host sends data
        clientReference.clientToHost.on('data', function (data) {
          console.log('client speaking: Recieved data from other network: ' + data)
          if (data.messageType !== undefined) {
            if (data.messageType === 'MoveSnake') {
              var gridObj = findObjectByTag(worldObject, 'grid').grid
              // move the snake
              snakes[data.index].body[0].direction = data.direction
              moveSnake(gridObj, snakes[data.index], data.direction)
              // ensure the previous square is moving in the right direction
              for (var i in snakes[data.index].body) {
                if (snakes[data.index].body[i].tag === 'HEAD') {
                  gridObj[snakes[data.index].body[i].r][snakes[data.index].body[i].c].render[0].drawColor = 'blue'
                  gridObj[snakes[data.index].body[i].r][snakes[data.index].body[i].c].tag[0] = 'HEAD'
                  gridObj[snakes[data.index].body[i].r][snakes[data.index].body[i].c].collider = true
                } else {
                  gridObj[snakes[data.index].body[i].r][snakes[data.index].body[i].c].render[0].drawColor = 'gold'
                  gridObj[snakes[data.index].body[i].r][snakes[data.index].body[i].c].tag[0] = 'BODY'
                  gridObj[snakes[data.index].body[i].r][snakes[data.index].body[i].c].collider = true
                }
              }
            }
            if (data.messageType === 'PlaceFood') {
              placeFood(findObjectByTag(curObj, 'grid').grid, data.collumn, data.row)
            }
            if (data.messageType === 'PlaceRotten') {
              placeRotten(findObjectByTag(curObj, 'grid').grid, data.collumn, data.row)
            }
          }
        })
        // set up error output on the connection
        clientReference.clientToHost.on('error', function (error) {
          console.log('client: other: ERROR! : ' + error)
        })
        // Send a message saying we connected
        clientReference.clientToHost.send(this.clientName + ' connected.')
      })
    })
    this.client.on('error', function (error) {
      console.log('client: ERROR! : ' + error)
      // Something went wrong like being unable to find the host.
      // For now just throw the peer away.
      // This is where reconnecting and other error handling would go
      // if it was used
      if (client.client !== undefined) {
        client.client.destroy()
      }
      client = undefined
    })
    // I am not sure how this would get called?
    // It is here for debug reasons
    this.client.on('data', function (data) {
      console.log('host: Recieved data from something: ' + data)
    })
  }
}

// needed game objects
var mouseController

// visual dimensions
// dimensions
var gridW = 25
var gridH = 25
var divSize = 2
var boardH = 0.10
var titleW = 100
var titleH = 50

// game variables
var snakes = new Array()
var scores = [0, 0, 0]
var counter = 0
var framerate = 40
var topScores = [0, 0, 0]
var rotTime = 0
var rotCount = 0
var maxTime = 300
var minTime = 100
var rotLife = 200
var rotExist = false
var players = 2

var gametype

var GAMEIMAGES = []

// Used for object creation
var curObj
var curRend

function startGame (initialImages) {
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
  var rend0 = new TextRenderer(menuObj0, 'For Online Multiplayer, Player 1 Press O and Player 2 Press P', 'Arial', 12, undefined, undefined, -200)
  var rend1 = new TextRenderer(menuObj1, 'Press Space to Start', 'Arial', 13, undefined, undefined, -200)
  worldObject.addChild(menuObj0)
  worldObject.addChild(menuObj1)
  // reset game type
  gametype = 'menu'
}

function loadGameOnKeypress () {
  // Hacky networking code

  // Create a client
  // Attempts to connect to the server
  // Sends information about score
  if (input.inputArray['Key79'].down && client === undefined) {
    console.log('Create Client')
    client = new Client('client124', 'host124')
    gametype = 'client'
  }

  // Create the host
  // The one who waits for a connection
  // Recieve information about score
  if (input.inputArray['Key80'].down && host === undefined) {
    console.log('Creating a host')
    host = new Host('host124')
    gametype = 'host'
  }

  if (input.inputArray['Key32'].down) {
    // If gametype is host or client, but is not yet connected
    if ((gametype === 'host' && host.hostToClient === undefined) || (gametype === 'client' && client.clientToHost === undefined)) {
      // Then do nothing
    } else {
      // else start the game
      if (gametype === 'menu') {
        gametype = 'single'
        players = 1
      } else {
        players = 2
      }
      createGame()
    }
  }
}

function createGame () {
  // Destoy the current objects
  for (var i = worldObject.children.length; i > 0; i--) {
    removeGameObject(null, worldObject.children[0])
  }
  // Create the Game
  // create containers
  var gameObjects = new GameObject(0, 0)
  gameObjects.tag.push('OBJECTS')
  var ui = new GameObject(0, 0)
  ui.tag.push('UI')
  worldObject.addChild(gameObjects)
  worldObject.addChild(ui)

  // call UI initialization
  initializeUI(ui)

  // set up grid object and initialize
  var cellSize = canvas.width / gridW
  curObj = new GameObject(0, canvas.height * boardH)
  curObj.xSize = canvas.width; curObj.ySize = canvas.height - canvas.height * boardH; curObj.tag.push('board')
  var gridObj = new Grid(gridH, gridW, cellSize)
  gridObj.tag.push('grid')
  initializeGrid(curObj, gridObj, cellSize)

  // initialize the snake
  initializeSnake(gridObj.grid)

  // create the player controller
  // For now I am just putting it in some far off corner and forgetting about it.
  mouseController = new GameObject(-10000, -10000)
  worldObject.addChild(mouseController)
  gameObjects.addChild(curObj)
  if (gametype !== 'client') {
    foodGen(findObjectByTag(curObj, 'grid').grid)
  }
  // Make the game take a few seconds to start
  counter = -90
}

function initializeGrid (curObj, gridObj, cellSize) {
  for (var i = 1; i < gridH - 1; i++) {
    for (var j = 1; j < gridW - 1; j++) {
      gridObj.grid[i][j] = new GameObject(curObj.x + cellSize * j + cellSize / 2, curObj.y + cellSize * i + cellSize / 2)
      gridObj.grid[i][j].xSize = cellSize; gridObj.grid[i][j].ySize = cellSize; gridObj.grid[i][j].visible = true
      gridObj.grid[i][j].tag.push('EMPTY')
      curRend = new SolidRenderer(gridObj.grid[i][j], 'black')
      curObj.addChild(gridObj.grid[i][j])
      var wall
      if (i === 1) {
        // add top wall
        gridObj.grid[i - 1][j] = new GameObject(gridObj.grid[i][j].x, gridObj.grid[i][j].y - cellSize)
        wall = gridObj.grid[i - 1][j]
        wall.collider = true; wall.tag[0] = 'WALL'; wall.xSize = cellSize; wall.ySize = cellSize; wall.visible = true
        curRend = new SolidRenderer(wall, 'purple')
        curObj.addChild(wall)
      }
      if (i === gridW - 2) {
        // add bottom wall
        gridObj.grid[i + 1][j] = new GameObject(gridObj.grid[i][j].x, gridObj.grid[i][j].y + cellSize)
        wall = gridObj.grid[i + 1][j]
        wall.collider = true; wall.tag[0] = 'WALL'; wall.xSize = cellSize; wall.ySize = cellSize; wall.visible = true
        curRend = new SolidRenderer(wall, 'purple')
        curObj.addChild(wall)
      }
      if (j === 1) {
        // add left wall
        gridObj.grid[i][j - 1] = new GameObject(gridObj.grid[i][j].x - cellSize, gridObj.grid[i][j].y)
        wall = gridObj.grid[i][j - 1]
        wall.collider = true; wall.tag[0] = 'WALL'; wall.xSize = cellSize; wall.ySize = cellSize; wall.visible = true
        curRend = new SolidRenderer(wall, 'purple')
        curObj.addChild(wall)
      }
      if (j === gridH - 2) {
        // add right wall
        gridObj.grid[i][j + 1] = new GameObject(gridObj.grid[i][j].x + cellSize, gridObj.grid[i][j].y)
        wall = gridObj.grid[i][j + 1]
        wall.collider = true; wall.tag[0] = 'WALL'; wall.xSize = cellSize; wall.ySize = cellSize; wall.visible = true
        curRend = new SolidRenderer(wall, 'purple')
        curObj.addChild(wall)
      }
    }
  }
  curObj.addChild(gridObj)
  curObj.addScript({update: slither})
  curObj.addScript({update: checkInput})
  curObj.addScript({update: rotSpawn})
}

// sets wall fields
function setWall (wall, curObj, cellSize) {
  wall.collider = true; wall.tag[0] = 'WALL'; wall.xSize = cellSize; wall.ySize = cellSize; wall.visible = true
  curRend = new SolidRenderer(wall, 'purple')
  curObj.addChild(wall)
}

function initializeUI (ui) {
  // horizontal divide
  curObj = new GameObject(canvas.width / 2, canvas.height * boardH)
  curObj.xSize = canvas.width; curObj.ySize = divSize; curObj.visible = true
  curObj.tag.push('div')
  curRend = new SolidRenderer(curObj, 'black')
  ui.addChild(curObj)

  // game title text
  curObj = new GameObject(canvas.width / 2, canvas.height * boardH * 0.7)
  curObj.xSize = titleW; curObj.ySize = titleH; curObj.tag[0] = 'title'; curObj.visible = true
  curRend = new TextRenderer(curObj, 'Snake', 'Arial', 30, undefined, undefined, -200)
  ui.addChild(curObj)

  // game over text
  curObj = new GameObject(canvas.width / 2, canvas.height / 2)
  curObj.xSize = titleW; curObj.ySize = titleH; curObj.tag.push('gameover')
  curRend = new TextRenderer(curObj, 'GAME OVER', 'Arial', 30, 'red', 'bold ', -200)
  ui.addChild(curObj)

  // player 1 score text
  curObj = new GameObject(canvas.width * 0.01, canvas.height * 0.1)
  curObj.xSize = canvas.width * 0.05; curObj.ySize = titleH / 2; curObj.tag.push('p1score'); curObj.visible = true
  curRend = new TextRenderer(curObj, 'P1 Score: ' + scores[1], 'Arial', 15)
  ui.addChild(curObj)

  // player 2 score text
  curObj = new GameObject(canvas.width * 1.35, canvas.height * 0.1)
  curObj.xSize = canvas.width * 0.05; curObj.ySize = titleH / 2; curObj.tag.push('p2score'); curObj.visible = true
  curRend = new TextRenderer(curObj, 'P2 Score: ' + scores[1], 'Arial', 15)
  ui.addChild(curObj)

  // player 1 top score text
  var storedScore = getCookie('snake_p1_topscore')
  if (storedScore !== '') {
    console.log('loaded score' + storedScore)
    topScores[1] = parseInt(storedScore)
  } else {
    console.log('No cookies found' + storedScore)
  }
  curObj = new GameObject(canvas.width * 0.01, canvas.height * 0.02)
  curObj.xSize = canvas.width * 0.05; curObj.ySize = titleH / 2; curObj.tag.push('p1TopScore'); curObj.visible = true
  curRend = new TextRenderer(curObj, 'P1 Top Score: ' + topScores[1], 'Arial', 15)
  ui.addChild(curObj)

  // player 2 top score text
  storedScore = getCookie('snake_p2_topscore')
  if (storedScore !== '') {
    console.log('loaded score' + storedScore)
    topScores[2] = parseInt(storedScore)
  } else {
    console.log('No cookies found' + storedScore)
  }
  curObj = new GameObject(canvas.width * 1.35, canvas.height * 0.02)
  curObj.xSize = canvas.width * 0.05; curObj.ySize = titleH / 2; curObj.tag.push('p2TopScore'); curObj.visible = true
  curRend = new TextRenderer(curObj, 'P2 Top Score: ' + topScores[2], 'Arial', 15)
  ui.addChild(curObj)
}

function initializeSnake (grid) {
  for (var p = 1; p <= players; p++) {
    // If snake already exists, basically delete it
    if (snakes[p] != null) {
      // recolor snake position black
      for (var i in snakes[p].body) {
        grid[snakes[p].body[i].r][snakes[p].body[i].c].render[0].drawColor = 'black'
        grid[snakes[p].body[i].r][snakes[p].body[i].c].tag[0] = 'EMPTY'
        grid[snakes[p].body[i].r][snakes[p].body[i].c].collider = false
      }
      counter = 0
    }
    // set up initial 3 segment snake

    var newSnake = new Snake()

    newSnake.head.r = Math.floor(3)
    if (p == 1) {
      newSnake.head.c = Math.floor(0 + p)
    } else {
      newSnake.head.c = Math.floor(gridW - 2)
    }
    newSnake.player = new Player(p)
    for (var s in newSnake.body) {
      if (newSnake.body[s].tag === 'HEAD') {
        grid[newSnake.body[s].r][newSnake.body[s].c].render[0].drawColor = 'blue'
        grid[newSnake.body[s].r][newSnake.body[s].c].tag[0] = 'HEAD'
        grid[newSnake.body[s].r][newSnake.body[s].c].collider = true
      } else {
        newSnake.body[s].r = newSnake.body[s - 1].r - 1
        newSnake.body[s].c = newSnake.body[s - 1].c
        grid[newSnake.body[s].r][newSnake.body[s].c].render[0].drawColor = 'gold'
        grid[newSnake.body[s].r][newSnake.body[s].c].tag[0] = 'BODY'
        grid[newSnake.body[s].r][newSnake.body[s].c].collider = true
      }
    }
    snakes[p] = newSnake
  }

  snakes[1].player.controller.left = 'Key65'
  snakes[1].player.controller.up = 'Key87'
  snakes[1].player.controller.right = 'Key68'
  snakes[1].player.controller.down = 'Key83'

  if (players >= 2) {
    snakes[2].player.controller.left = 'Key37'
    snakes[2].player.controller.up = 'Key38'
    snakes[2].player.controller.right = 'Key39'
    snakes[2].player.controller.down = 'Key40'
  } else {
    snakes[1].player.controller.left = 'Key37'
    snakes[1].player.controller.up = 'Key38'
    snakes[1].player.controller.right = 'Key39'
    snakes[1].player.controller.down = 'Key40'
  }
}

function initializeGame () {
  // preload art
  preloadArtAssets('images/', GAMEIMAGES, startGame)
}

// segments to hold snake data
class Segment {
  constructor (c, r, tag, direction) {
    this.c = c
    this.r = r
    this.tag = tag
    this.direction = direction
  }
}

// Construct the Snake object
class Snake {
  constructor () {
    this.head = new Segment(0, 0, 'HEAD', 'DOWN')
    this.tail = new Segment(0, 0, 'BODY', 'DOWN')
    var bod = new Segment(0, 0, 'BODY', 'DOWN')
    this.body = new Array()
    this.body.push(this.head)
    this.body.push(bod)
    this.body.push(this.tail)
  }
}

// controls the movement of the snake
function slither () {
  if (gametype !== 'client') {
    if (counter++ === framerate && !this.parent.paused) {
      var gridObj = findObjectByTag(this.parent, 'grid').grid

      for (var s = 1; s <= players; s++) {
        moveSnake(gridObj, snakes[s], snakes[s].body[0].direction)
        if (gametype === 'host') {
          host.hostToClient.send({messageType: 'MoveSnake', index: s, direction: snakes[s].body[0].direction})
        }
        for (var i in snakes[s].body) {
          if (snakes[s].body[i].tag === 'HEAD') {
            gridObj[snakes[s].body[i].r][snakes[s].body[i].c].render[0].drawColor = 'blue'
            gridObj[snakes[s].body[i].r][snakes[s].body[i].c].tag[0] = 'HEAD'
            gridObj[snakes[s].body[i].r][snakes[s].body[i].c].collider = true
          } else {
            gridObj[snakes[s].body[i].r][snakes[s].body[i].c].render[0].drawColor = 'gold'
            gridObj[snakes[s].body[i].r][snakes[s].body[i].c].tag[0] = 'BODY'
            gridObj[snakes[s].body[i].r][snakes[s].body[i].c].collider = true
          }
        }
        counter = 0
      }
    }
  }
}

// moves the snake and checks for collision
function moveSnake (grid, snake, prevDir) {
  // checks for object in place snake is moving to
  var collider = checkAhead(grid, prevDir, snake)

  if (collider != null) {
    handleCollision(collider, grid, snake)
  } else {
    // recolor the tail's previous location black, remove collider, set empty
    eraseTail(grid, snake)

    // move each segment of the snake in the appropriate direction
    // change segment's direction to match previous segment's
    for (var s in snake.body) {
      switch (snake.body[s].direction) {
        case 'LEFT':
          snake.body[s].c -= 1
          snake.body[s].direction = prevDir
          prevDir = 'LEFT'
          break
        case 'UP':
          snake.body[s].r -= 1
          snake.body[s].direction = prevDir
          prevDir = 'UP'
          break
        case 'DOWN':
          snake.body[s].r += 1
          snake.body[s].direction = prevDir
          prevDir = 'DOWN'
          break
        case 'RIGHT':
          snake.body[s].c += 1
          snake.body[s].direction = prevDir
          prevDir = 'RIGHT'
          break
      }
    }
  }
}

// checks the space in front of the snake prior to movement
function checkAhead (grid, headDir, snake) {
  var check = grid[snake.body[0].r][snake.body[0].c]
  // checks next space depending on current direction
  var collider
  switch (headDir) {
    case 'LEFT':
      collider = getCollision(check.x - check.xSize, check.y, check, worldObject)
      break
    case 'UP':
      collider = getCollision(check.x, check.y - check.ySize, check, worldObject)
      break
    case 'DOWN':
      collider = getCollision(check.x, check.y + check.ySize, check, worldObject)
      break
    case 'RIGHT':
      collider = getCollision(check.x + check.xSize, check.y, check, worldObject)
      break
  }
  if (collider && collider.tag === 'EMPTY') {
    return null
  }
  return collider
}

// decides what to do based on what snake collided with
function handleCollision (collider, grid, snake) {
  if (collider.tag[0] === 'FOOD') {
    if (gametype !== 'client') {
      foodGen(grid)
    }
    consume('FOOD', snake)
  } else if (collider.tag[0] === 'BODY' || collider.tag[0] === 'HEAD' || collider.tag[0] === 'WALL') {
    gameOver()
  } else if (collider.tag[0] === 'ROT') {
    consume('ROT', snake)
    collider.render[0].color = 'black'
    collider.tag[0] = 'EMPTY'
    collider.collider = false
  }
}

// Generate a food pellet at the start of game and
// whenever a pellet is consumed by the snake
function foodGen (grid) {
  var generated = false
  while (!generated) {
    var r = Math.floor(Math.random() * gridW)
    var c = Math.floor(Math.random() * gridH)
    if (grid[c][r] !== null && grid[c][r].tag !== undefined && grid[c][r].tag[0] === 'EMPTY') {
      placeFood(grid, c, r)
      if (gametype === 'host') {
        host.hostToClient.send({messageType: 'PlaceFood', collumn: c, row: r})
      }
      generated = true
    }
  }
}

// Place the food onto a cell that is known to be free.
function placeFood (grid, c, r) {
  grid[c][r].render[0].drawColor = 'red'
  grid[c][r].tag[0] = 'FOOD'
  grid[c][r].collider = true
}

// generate hazard
function rotten (grid) {
  if (!rotExist) {
    var generated = false
    while (!generated) {
      var r = Math.floor(Math.random() * gridW)
      var c = Math.floor(Math.random() * gridH)
      if (grid[c][r] !== null && grid[c][r].tag !== undefined && grid[c][r].tag[0] === 'EMPTY') {
        placeRotten(grid, c, r)
        if (gametype === 'host') {
          host.hostToClient.send({messageType: 'PlaceRotten', collumn: c, row: r})
        }
        generated = true
      }
    }
  }
}

function placeRotten (grid, c, r) {
  grid[c][r].render[0].drawColor = 'olive'
  grid[c][r].tag[0] = 'ROT'
  grid[c][r].collider = true
  grid[c][r].addScript({update: rotDecay})
}

// function for spawning rot, random times
function rotSpawn () {
  if (!this.parent.paused && gametype !== 'client') {
    if (rotCount === 0) {
      rotTime = Math.floor(Math.random() * (maxTime - minTime + 1) + minTime)
      rotCount++
    } else {
      if (rotCount < rotTime) {
        rotCount++
      } else {
        rotten(findObjectByTag(worldObject, 'grid').grid)
        rotCount = 0
      }
    }
  }
}

// checks for input
function checkInput () {
  for (var s = 1; s <= players; s++) {
    if (gametype === 'single' || (s === 2 && gametype === 'client') || (s === 1 && gametype === 'host')) {
      var curDir = snakes[s].body[1].direction
      if (input.inputArray[snakes[s].player.controller.left].down || input.inputArray[snakes[s].player.controller.left].pressed) {
        if (curDir !== 'RIGHT') {
          if (gametype === 'client') {
            client.clientToHost.send({messageType: 'ChangeDirrection', direction: 'LEFT'})
          } else {
            snakes[s].body[0].direction = 'LEFT'
          }
        }
      }
      if (input.inputArray[snakes[s].player.controller.up].down || input.inputArray[snakes[s].player.controller.up].pressed) {
        if (curDir !== 'DOWN') {
          if (gametype === 'client') {
            client.clientToHost.send({messageType: 'ChangeDirrection', direction: 'UP'})
          } else {
            snakes[s].body[0].direction = 'UP'
          }
        }
      }
      if (input.inputArray[snakes[s].player.controller.right].down || input.inputArray[snakes[s].player.controller.right].pressed) {
        if (curDir !== 'LEFT') {
          if (gametype === 'client') {
            client.clientToHost.send({messageType: 'ChangeDirrection', direction: 'RIGHT'})
          } else {
            snakes[s].body[0].direction = 'RIGHT'
          }
        }
      }
      if (input.inputArray[snakes[s].player.controller.down].down || input.inputArray[snakes[s].player.controller.down].pressed) {
        if (curDir !== 'UP') {
          if (gametype === 'client') {
            client.clientToHost.send({messageType: 'ChangeDirrection', direction: 'DOWN'})
          } else {
            snakes[s].body[0].direction = 'DOWN'
          }
        }
      }
    }
  }
}

// consume food, get points, grow snake
function consume (type, snake) {
  var head = snake.body[0]
  var headDir = head.direction
  var headCol = head.c
  var headRow = head.r
  var seg
  switch (headDir) {
    case 'LEFT':
      head.c -= 1
      break
    case 'UP':
      head.r -= 1
      break
    case 'DOWN':
      head.r += 1
      break
    case 'RIGHT':
      head.c += 1
      break
  }

  if (type === 'ROT') {
    // delete rear segment of snake
    seg = new Segment(headCol, headRow, 'BODY', headDir)
    snake.body.splice(1, 0, seg)
    eraseTail(findObjectByTag(worldObject, 'grid').grid, snake)
    snake.body.pop()
    eraseTail(findObjectByTag(worldObject, 'grid').grid, snake)
    snake.body.pop()
    updateScore(scores[snake.player.id] -= 10, snake.player.id)
    if (snake.body.length === 1) {
      gameOver()
    }
  } else {
    seg = new Segment(headCol, headRow, 'BODY', headDir)
    snake.body.splice(1, 0, seg)
    updateScore(scores[snake.player.id] += 10, snake.player.id)
  }
}

// game over function
function gameOver (current) {
  // handle game over
  var board = findObjectByTag(worldObject, 'board')
  if (board !== null) {
    board.paused = true
  }
  findObjectByTag(worldObject, 'gameover').visible = true
}

// updates the current score
function updateScore (score, player, current) {
  var scoreObj = findObjectByTag(worldObject, 'p' + player + 'score')
  var topScoreObj = findObjectByTag(worldObject, 'p' + player + 'TopScore')
  if (scoreObj !== null) {
    scoreObj.render[0].text = 'P' + player + 'Score: ' + score
  }
  if (score > topScores[player]) {
    topScores[player] = score
    setCookie('snake_p' + player + '_topscore', '' + topScores[player], 365)
    topScoreObj.render[0].text = 'P' + player + ' Top Score: ' + topScores[player]
  }
}

// removes the tail from the snake (happens during movement)
function eraseTail (grid, snake) {
  var tailC = snake.body[snake.body.length - 1].c
  var tailR = snake.body[snake.body.length - 1].r
  grid[tailR][tailC].render[0].drawColor = 'black'
  grid[tailR][tailC].tag[0] = 'EMPTY'
  grid[tailR][tailC].collider = false
}

// Removes food from the board for restart purposes
function removeFood (grid) {
  var food = findAllObjectsByTag(worldObject, 'FOOD')
  var rot = findAllObjectsByTag(worldObject, 'ROT')

  for (var f in food) {
    food[f].render[0].drawColor = 'black'
    food[f].tag[0] = 'EMPTY'
    food[f].collider = false
  }
  for (var r in rot) {
    rot[r].render[0].drawColor = 'black'
    rot[r].tag[0] = 'EMPTY'
    rot[r].collider = false
  }
}

function restartGame (current) {
  // The laziest of restarts
  updateScore(scores[1] -= scores[1], 1)
  updateScore(scores[2] -= scores[2], 2)
  createMenu()
  // var board = findObjectByTag(worldObject, 'board')
  // findObjectByTag(worldObject, 'gameover').visible = false
  // var gridObj = findObjectByTag(worldObject, 'grid').grid
  // initializeSnake(gridObj)
  // removeFood(gridObj)
  // foodGen(gridObj)
  // board.paused = false
  // updateScore(scores[1] -= scores[1], 1)
  // updateScore(scores[2] -= scores[2], 2)
}

function rotDecay () {
  rotLife--
  if (rotLife <= 0) {
    this.parent.render[0].drawColor = 'black'
    this.parent.tag[0] = 'EMPTY'
    this.parent.collider = false
    rotExist = false
    rotLife = 200
    this.parent.script.pop()
  }
}
