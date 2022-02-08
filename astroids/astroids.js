/* global canvas, context, ImageRenderer, SolidRenderer,
GameObject, input, preloadArtAssets, addGameObject,
removeGameObject, addRenderer, removeRenderer, worldObject,
getObjectUnderMouse, getCollision, Grid, findObjectByTag, findAllObjectsByTag,
TextRenderer, camera, screenSpaceToWorldSpace, getCookie, setCookie, Physics */

/*
pesudocode:

going to use a level bluebrint for the levels.

Object structure:
    Game (So timescale can be used)
        Player
        Enemies
        projectiles (maybe even sub divided into player and enemy)
        Level (a system for managing the game.)
    UI
        Upgrade menu
        UI
    
    Also Main Menu

Runtime example:
Game start
    Run main menu creation code
Load Game:
    Create a level: (might be based on rng)
    Create Player
On Win:
    Load new level
On Lose:
    Destroy Game
    Load main menu.

Player:
    Move
    Fire
*/

// Visual dimensions
var divSize = 2
var boardH = 0.10
var titleW = 100
var titleH = 50

// Game Variables
var gameObjects
var enemies
var player

// duration of fired bullets
var bulletDuration = 40
// How difficult to make new levels
var difficulty = 5
// current score
var score = 0
// top score
var topScore = 0
// Currency for upgrades
var cash = 0
// Amount of cash player receives when killing an enemy
var cashOnKillAmount = 100
// Amount of cash each upgrade costs; initialized to 500
var upgradeCost = 500
// Current shot upgrade level, start at 0
var upgradeLevel = 0
var maxUpgrade = false

var GAMEIMAGES = ['BG_Test', 'AstroidLarge', 'Bullet', 'ship', 'thrusters', 'heart']
var images

function initializeGame () {
  // preload art
  preloadArtAssets('astroids/images/', GAMEIMAGES, startGame)
}

function startGame (initialImages) {
  // Save the references to the images for later
  images = initialImages
  // create containers
  gameObjects = new GameObject(0, 0)
  gameObjects.tag.push('OBJECTS')
  enemies = new GameObject(0, 0)
  enemies.tag.push('ENEMY')
  var ui = new GameObject(0, 0)
  ui.tag.push('UI')
  worldObject.addChild(gameObjects)
  worldObject.addChild(ui)
  initializeBackgroundGrid(gameObjects, initialImages)
  initializeUI(ui)

  // Make a level manager
  var levelManagerObject = new GameObject(0, 0)
  levelManagerObject.addScript(makeLevelManager())
  gameObjects.addChild(levelManagerObject)

  // Initiallize the player
  player = new GameObject(canvas.width / 2, canvas.height / 2)
  player.xSize = 32; player.ySize = 32
  player.visible = true
  player.collider = 'square'
  var physics = new Physics(player, 0, 0, enemies)
  physics.onCollision = playerCollide
  player.addScript(makePlayerMoveScript())
  player.addScript(makePlayerFireScript())
  player.addScript(makeTurnScript())
  newRend = new ImageRenderer(player, images['ship'], 10)
  thrustRend = new SpriteSheetRenderer(player, images['thrusters'], 10, -0.75, 0, 4,
    player.xSize - 5, player.ySize - 5, 44.5, 200, 'vertical', 5)
  gameObjects.addChild(player)
  camera = player

  //testing attach feature
  //go1 is attached to player, go2 is attached to go1, should all stay together
  //attached at their respective anchorX and anchorY
  /*
  var go1 = new GameObject(0, 0, 0, 0.5, 0, 1, 1, 0, -1, true)
  go1.visible = true
  var sq1 = new SolidRenderer(go1, "blue", "square")
  sq1.visible = true
  player.addChild(go1)

  var go2 = new GameObject(0, 0, 0, 0.5, 0, 1, 1, 0, -1, true)
  go2.visible = true
  var sq2 = new SolidRenderer(go2, "red", "square")
  sq2.visible = true
  go1.addChild(go2)
  console.log(go1)
  console.log(go2)
  */

  // Add the enemies after the player to stop flicker.
  gameObjects.addChild(enemies)
}

function makeLevel () {
  // Reset the player position at the start of a new round
  player.x = canvas.width / 2
  player.y = canvas.height / 2
  // Give some mercy invunerablity at the start of a round.
  player.getScript('playerMove').invulnerablity = 150
  // And some extra health
  player.getScript('playerMove').health += 1
  // update UI with new health value
  var healthIndicator = findObjectByTag(worldObject, 'healthTxt')
  if (healthIndicator !== null) {
    healthIndicator.render[0].text = player.getScript('playerMove').health
  }

  var levelID = Math.floor(Math.random() * 2)
  if (levelID === 0) {
    makeTestBossLevel(difficulty)
  } else {
    makeTestLevel(difficulty)
  }
  // Increase the difficulty fo rin the future.
  difficulty += 5
}

// Make a test level
function makeTestLevel (difficulty) {
  // Make some new asteroids
  var max = Math.sqrt(5 * difficulty)
  // Spawn initial asteroid objects
  for (var i = 0; i < max; i++) {
    // for (var i = 0; i < 1; i++) {
    var x = Math.random() * canvas.width
    var y = Math.random() * canvas.height
    var v = new Vector2(x - canvas.width / 2, y - canvas.height / 2)
    // Fix the rare case that v is exactly zero
    if (v.magnitude === 0) {
      v.x = 1
    }
    var magnitude = v.magnitude()
    // Move asteroids away from the center
    if (magnitude < 200) {
      v.x = 200 * v.x / magnitude
      v.y = 200 * v.y / magnitude
      x += v.x
      y += v.y
    }

    var velX = Math.random() * 6 - 3
    var velY = Math.random() * 6 - 3
    makeAstroidObject(x, y, velX, velY, 4)
    // makeAstroidObject(0, 0, 0, 0, 4)
  }
}

// Make a test level
function makeTestBossLevel (difficulty) {
  var max = Math.floor(Math.sqrt(5 * difficulty))
  // Spawn initial asteroid objects
  for (var i = 0; i < 1; i++) {
    // for (var i = 0; i < 1; i++) {
    var x = Math.random() * canvas.width
    var y = Math.random() * canvas.height
    var v = new Vector2(x - canvas.width / 2, y - canvas.height / 2)
    // Fix the rare case that v is exactly zero
    if (v.magnitude === 0) {
      v.x = 1
    }
    var magnitude = v.magnitude()
    // Move asteroids away from the center
    if (magnitude < 200) {
      v.x = 200 * v.x / magnitude
      v.y = 200 * v.y / magnitude
      x += v.x
      y += v.y
    }

    var velX = Math.random() * 6 - 3
    var velY = Math.random() * 6 - 3
    makeAstroidObject(x, y, velX, velY, max)
    // makeAstroidObject(0, 0, 0, 0, 4)
  }
}

// Initialize background and grid
function initializeBackgroundGrid (gameObjects, initialImages) {
  // Add the background
  var newObj = new GameObject(canvas.width, canvas.height)
  newObj.xSize = canvas.width + 2; newObj.ySize = canvas.height + 2
  newObj.visible = true
  var newRend = new ImageRenderer(newObj, initialImages['BG_Test'], 200)
  gameObjects.addChild(newObj)

  newObj = new GameObject(canvas.width, 0)
  newObj.xSize = canvas.width + 2; newObj.ySize = canvas.height + 2
  newObj.visible = true
  newRend = new ImageRenderer(newObj, initialImages['BG_Test'], 200)
  gameObjects.addChild(newObj)

  newObj = new GameObject(0, canvas.height)
  newObj.xSize = canvas.width + 2; newObj.ySize = canvas.height + 2
  newObj.visible = true
  newRend = new ImageRenderer(newObj, initialImages['BG_Test'], 200)
  gameObjects.addChild(newObj)

  newObj = new GameObject(0, 0)
  newObj.xSize = canvas.width + 2; newObj.ySize = canvas.height + 2
  newObj.visible = true
  newRend = new ImageRenderer(newObj, initialImages['BG_Test'], 200)
  gameObjects.addChild(newObj)
}

function initializeUI (ui) {
  // horizontal divide
  var curObj = new GameObject(canvas.width / 2, canvas.height * 0.05)
  curObj.xSize = canvas.width; curObj.ySize = canvas.height * 0.1; curObj.visible = true
  curObj.tag.push('div')
  var curRend = new SolidRenderer(curObj, 'white', 'square', 0, true)
  ui.addChild(curObj)

  // game title text
  curObj = new GameObject(canvas.width / 2 + titleW, canvas.height * 0.1)
  curObj.xSize = titleW; curObj.ySize = titleH; curObj.tag[0] = 'title'; curObj.visible = true
  curRend = new TextRenderer(curObj, 'Asteroids', 'Arial', 40, 'red', undefined, -200, true)
  ui.addChild(curObj)

  // top score text
  var storedScore = getCookie('asteroidtopscore')
  if (storedScore !== '') {
    console.log('loaded score' + storedScore)
    topScore = parseInt(storedScore)
  } else {
    console.log('No cookies found' + storedScore)
  }
  curObj = new GameObject(canvas.width * 0.0005, canvas.height * 0.01)
  curObj.xSize = canvas.width * 0.05; curObj.ySize = titleH / 2; curObj.tag.push('topScore'); curObj.visible = true
  curRend = new TextRenderer(curObj, 'Top Score: ' + topScore, 'Arial', 20, true)
  ui.addChild(curObj)

  // current score text
  curObj = new GameObject(canvas.width * 0.0005, canvas.height * 0.033)
  curObj.xSize = canvas.width * 0.05; curObj.ySize = titleH / 2; curObj.tag.push('score'); curObj.visible = true
  curRend = new TextRenderer(curObj, 'Score: ' + score, 'Arial', 20, true)
  ui.addChild(curObj)

  // current cash
  curObj = new GameObject(canvas.width * 0.35, canvas.height * 0.01)
  curObj.xSize = canvas.width * 0.05; curObj.ySize = titleH / 2; curObj.tag.push('cash'); curObj.visible = true
  curRend = new TextRenderer(curObj, 'Cash: $' + cash, 'Arial', 20, true)
  ui.addChild(curObj)

  // Upgrade button
  curObj = new GameObject(canvas.width * 0.85, canvas.height * 0.07)
  curObj.xSize = canvas.width * 0.25; curObj.ySize = canvas.height * 0.05; curObj.visible = true
  curRend = new SolidRenderer(curObj, 'green', 'square', 0, true)
  curObj.tag.push('upgradeButton')
  curObj.addScript(makeUpgradeShotScript())
  ui.addChild(curObj)
  // button text
  newObj = new GameObject(canvas.width * 0.35, canvas.height * 0.033)
  newObj.xSize = canvas.width * 0.05; newObj.ySize = titleH / 2; newObj.tag.push('upgradeText'); newObj.visible = true
  curRend = new TextRenderer(newObj, 'Upgrade Shot: $' + upgradeCost, 'Arial', 20, true)
  curObj.addChild(newObj)
  
  // health indicator img
  curObj = new GameObject(canvas.width * 0.05, canvas.height * .95)
  curObj.xSize = 60; curObj.ySize = 57; curObj.visible = true
  curRend = new ImageRenderer(curObj, images['heart'], 0, undefined, undefined, true)
  ui.addChild(curObj)
  // health indicator text
  curObj = new GameObject(canvas.width * 0.025, canvas.height * 1.87)
  curObj.xSize = 40; curObj.ySize = 40; curObj.tag.push('healthTxt'); curObj.visible = true
  curRend = new TextRenderer(curObj, '2', 'Arial', 35, 'red', undefined, undefined, true)
  ui.addChild(curObj)
  
}

function makePlayerFireScript () {
  return {timer: 0, update: playerFire}
}

function playerFire () {
  if (this.timer > 0) {
    this.timer -= 1 * this.parent.timeScale
  } else if (input.inputArray['MouseButton0'].pressed || input.inputArray['Key32'].pressed) {
    // Find the firing direction
    var worldTarget = screenSpaceToWorldSpace({x: input.mouseX, y: input.mouseY})
    var dirX = (worldTarget.x - this.parent.x)
    var dirY = (worldTarget.y - this.parent.y)
    // find magnitude
    var x2 = dirX * dirX
    var y2 = dirY * dirY
    var magnitude = Math.sqrt(x2 + y2)
    // normalize
    if (magnitude !== 0) {
      dirX = dirX / magnitude * 10
      dirY = dirY / magnitude * 10
      // console.log(input.inputArray['Key81'].pressed)
      // Standard shot
      makeBulletObject(this.parent.x, this.parent.y, dirX, dirY)

      // Extra shot is added with each upgradeLevel
      if (upgradeLevel > 0) {
        makeBulletObject(this.parent.x, this.parent.y, 0.9 * dirX - 0.1 * dirY, 0.9 * dirY + 0.1 * dirX)
      }
      if (upgradeLevel > 1) {
        makeBulletObject(this.parent.x, this.parent.y, 0.9 * dirX + 0.1 * dirY, 0.9 * dirY - 0.1 * dirX)
      }
      if (upgradeLevel > 2) {
        makeBulletObject(this.parent.x, this.parent.y, 0.95 * dirX - 0.05 * dirY, 0.95 * dirY + 0.05 * dirX)
      }
      if (upgradeLevel > 3) {
        makeBulletObject(this.parent.x, this.parent.y, 0.95 * dirX + 0.05 * dirY, 0.95 * dirY - 0.05 * dirX)
      }
      // Standard shot timer set to 45, rapid fire set to 7
      if (input.inputArray['Key81'].pressed) {
        this.timer = 7
      } else {
        this.timer = 45
      }
    }
  }
  // Putting it here for now
  // Script for adding bullet time that will only effect the game
  // Not UI or the menu
  // 16 is shift
  if (input.inputArray['Key16'].down) {
    gameObjects.timeScale = 0.25
  }
  if (input.inputArray['Key16'].up) {
    gameObjects.timeScale = 1
  }
}

function makeBulletObject (xpos, ypos, xspeed, yspeed) {
  var newObj = new GameObject(xpos, ypos)
  newObj.xSize = 12; newObj.ySize = 12
  newObj.visible = true
  var newRend = new ImageRenderer(newObj, images['Bullet'], 10)
  newObj.collider = 'circle'
  newObj.addScript(makeMoveScript(newObj))
  var physics = new Physics(newObj, xspeed, yspeed, enemies)
  physics.onCollision = killOnHit
  newObj.duration = bulletDuration
  gameObjects.addChild(newObj)
}

function makeAstroidObject (xpos, ypos, xspeed, yspeed, size) {
  var newObj = new GameObject(xpos, ypos)
  if (size >= 4) {
    newObj.xSize = 92 + 16 * (size - 4); newObj.ySize = 92 + 16 * (size - 4)
  } else if (size === 3) {
    newObj.xSize = 64; newObj.ySize = 64
  } else if (size === 2) {
    newObj.xSize = 48; newObj.ySize = 48
  } else if (size <= 1) {
    newObj.xSize = 32; newObj.ySize = 32
  }
  newObj.rot = Math.random() * 2 * Math.PI
  newObj.visible = true
  var newRend = new ImageRenderer(newObj, images['AstroidLarge'], 10)
  newObj.addScript(makeMoveScript(newObj))
  var physics = new Physics(newObj, xspeed, yspeed)
  if (size > 1) {
    newObj.addScript(makeSpawnAstroidsOnDeathScript(size - 1))
  }
  newObj.collider = 'circle'
  enemies.addChild(newObj)
}

function playerCollide (other, normal) {
  player = this.parent

  var movescript = other.getScript('physics')
  // Check if we hit a ghost object
  if (movescript == null) {
    movescript = other.parent.getScript('physics')
  }
  if (movescript !== null) {
    this.velocity.x = movescript.velocity.x - 3 * normal.x
    this.velocity.y = movescript.velocity.y - 3 * normal.y

    var playerHealth = player.getScript('playerMove')
    if (playerHealth.invulnerablity < 0) {
      playerHealth.health--
      // update UI with new health value
      var healthIndicator = findObjectByTag(worldObject, 'healthTxt')
      if (healthIndicator !== null) {
        healthIndicator.render[0].text = playerHealth.health
      }
      if (playerHealth.health <= 0) {
        var gameover = new GameObject(canvas.width / 2 + 100, canvas.height / 2 + 200)
        gameover.xSize = 100; gameover.ySize = 0; gameover.tag.push('gameover')
        var rend = new TextRenderer(gameover, 'GAME OVER', 'Arial', 30, 'red', 'bold ', -200, true)
        gameover.visible = true
        gameObjects.addChild(gameover)
        // remove the player
        removeGameObject(null, this.parent)
      }
      playerHealth.invulnerablity = 20
    }
  }
}

function makePlayerMoveScript () {
  return {name: 'playerMove', health: 1, invulnerablity: 15, update: playerMove}
}

function playerMove () {
  // Simple flicker to show invulnerablity
  if (this.invulnerablity >= 0) {
    this.invulnerablity -= this.parent.timeScale
    if (this.parent.visible === true) {
      this.parent.visible = false
    } else {
      this.parent.visible = true
    }
  } else {
    this.parent.visible = true
  }
  if (input.inputArray['MouseButton2'].pressed) {
    // get player's direction
    var dir = angleToVector(this.parent.rot)

    // Update velocity
    this.parent.getScript('physics').velocity.x += dir.x * this.parent.timeScale / 5
    this.parent.getScript('physics').velocity.y += dir.y * this.parent.timeScale / 5
    this.parent.render[1].visible = true
  }
  if (input.inputArray['MouseButton2'].up) {
    this.parent.render[1].visible = false
  }
  while (this.parent.x > canvas.width) {
    this.parent.x -= canvas.width
  }
  while (this.parent.x < 0) {
    this.parent.x += canvas.width
  }
  while (this.parent.y > canvas.height) {
    this.parent.y -= canvas.height
  }
  while (this.parent.y < 0) {
    this.parent.y += canvas.height
  }
}

function makeMoveScript (parent) {
  var reflectionList = {}

  // Create vertically offset object
  var newObj = new GameObject(0, 0)
  newObj.xSize = 0; newObj.ySize = 0
  newObj.visible = true
  newObj.collider = 'circle'
  var newRend = new ImageRenderer(newObj, parent.render[0].imageSource, 10)
  newObj.addScript(makePropagateDeathScript())
  parent.addChild(newObj)
  newObj.duration = parent.duration
  reflectionList.v = newObj

  // Create horizontally offset object
  newObj = new GameObject(0, 0)
  newObj.xSize = 0; newObj.ySize = 0
  newObj.visible = true
  newObj.collider = 'circle'
  var newRend = new ImageRenderer(newObj, parent.render[0].imageSource, 10)
  newObj.addScript(makePropagateDeathScript())
  parent.addChild(newObj)
  newObj.duration = parent.duration
  reflectionList.h = newObj

  // Create vertically and horizontally offset object
  newObj = new GameObject(0, 0)
  newObj.xSize = 0; newObj.ySize = 0
  newObj.visible = true
  newObj.collider = 'circle'
  var newRend = new ImageRenderer(newObj, parent.render[0].imageSource, 10)
  newObj.addScript(makePropagateDeathScript())
  parent.addChild(newObj)
  newObj.duration = parent.duration
  reflectionList.vh = newObj

  return {name: 'move', reflection: reflectionList, update: move}
}

// Handles thing like manipulating ghost copies and keeping the object in bounds
function move () {
  // If the objects duration is 0, don't move

  // !!!BUG!!!
  // This only works because 
  // undefined !== 0
  // And as a side effect all bullets break if time scale make the number go below 0
  if (this.parent.duration !== 0) {
    while (this.parent.x > canvas.width) {
      this.parent.x -= canvas.width
    }
    while (this.parent.x < 0) {
      this.parent.x += canvas.width
    }
    while (this.parent.y > canvas.height) {
      this.parent.y -= canvas.height
    }
    while (this.parent.y < 0) {
      this.parent.y += canvas.height
    }
    // Update the reflected object
    // A work arround is used. Ghosts propogate their death
    if (this.reflection.v === null || this.reflection.h === null || this.reflection.vh === null) {
    // Our reflection got killed, die as well.
      this.parent.getScript('deathScript').ondeath()
    }
    this.reflection.v.x = this.parent.x
    if (this.parent.x < camera.x) {
      this.reflection.h.x = this.parent.x + canvas.width
      this.reflection.vh.x = this.parent.x + canvas.width
    } else {
      this.reflection.h.x = this.parent.x - canvas.width
      this.reflection.vh.x = this.parent.x - canvas.width
    }
    this.reflection.h.y = this.parent.y
    if (this.parent.y < camera.y) {
      this.reflection.v.y = this.parent.y + canvas.height
      this.reflection.vh.y = this.parent.y + canvas.height
    } else {
      this.reflection.v.y = this.parent.y - canvas.height
      this.reflection.vh.y = this.parent.y - canvas.height
    }
    this.reflection.v.xSize = this.parent.xSize
    this.reflection.v.ySize = this.parent.ySize
    this.reflection.v.rot = this.parent.rot
    this.reflection.h.xSize = this.parent.xSize
    this.reflection.h.ySize = this.parent.ySize
    this.reflection.h.rot = this.parent.rot
    this.reflection.vh.xSize = this.parent.xSize
    this.reflection.vh.ySize = this.parent.ySize
    this.reflection.vh.rot = this.parent.rot
    // Reduce duration after each movement
    if (this.parent.duration > 0) {
      // if regular reduction would cause duration to be negative, just set to 0
      if (this.parent.duration < this.parent.timeScale) {
        this.parent.duration = 0
      } else {
        this.parent.duration -= 1 * this.parent.timeScale
      }
    }
  // End of duration
  } else {
    removeGameObject(null, this.parent)
  }
}

function makeKillOnHitScript () {
  return {update: killOnHit}
}

function makeTurnScript () {
  return {update: turn}
}

function killOnHit (hit, normal) {
  // Destroy this projectile
  removeGameObject(null, this.parent)
  // Attempt to get a death script on the hit object
  var deathscript = hit.getScript('deathScript')
  // If the object has a custom death
  // Such as an explosion, call it.
  if (deathscript !== null) {
    deathscript.ondeath()
  }
  // update current score
  updateScore(score += cashOnKillAmount)
  // Add to total cash after kill
  updateCash(cash += cashOnKillAmount)
  // remove the hit object
  removeGameObject(null, hit)
}

function makeSpawnAstroidsOnDeathScript (newSize) {
  return {name: 'deathScript', maxSpeed: 3, size: newSize, ondeath: spawnAstroidsOnDeath}
}

function spawnAstroidsOnDeath () {
  var velX = (Math.random() * this.maxSpeed * 4 - this.maxSpeed) / this.size
  var velY = (Math.random() * this.maxSpeed * 2 - this.maxSpeed) / this.size
  makeAstroidObject(this.parent.x, this.parent.y, velX, velY, this.size)
  makeAstroidObject(this.parent.x, this.parent.y, -velX, -velY, this.size)
  removeGameObject(null, this.parent)
}

// Make a death script that propagates the death to the parent
function makePropagateDeathScript () {
  return {name: 'deathScript', ondeath: propagateDeath}
}

function propagateDeath () {
  var deathscript = this.parent.parent.getScript('deathScript')
  // If the object has a custom death
  // Such as an explosion, call it.
  if (deathscript !== null) {
    deathscript.ondeath()
  }
  removeGameObject(null, this.parent)
}

// can probably be abstracted to the engine at some point as a general "rotate to mouse" function
function turn () {
  // 'this' is script, this.parent is gameObject
  turnToTarget(this.parent, input.mouseX, input.mouseY)
  /*
  var target = screenSpaceToWorldSpace({x: input.mouseX, y: input.mouseY})
  var dir = new Vector2(target.x - this.parent.x, target.y - this.parent.y)
  dir = dir.normalize()
  var playerPos = new Vector2(this.parent.x, this.parent.y)
  target = target.sub(playerPos)
  this.parent.rot = target.toRotation()
  // game specific for thruster rotation, should be refactored into engine so that a child
  // component will maintain the same orientation in regard to the parent
  var thrusters = this.parent.render[1]
  thrusters.anchorX = this.parent.xSize * -dir.x * 0.75
  thrusters.anchorY = this.parent.ySize * -dir.y * 0.75*/
}

// Adds cashOnKillAmount to current cash level
function updateCash (cash) {
  var cashObj = findObjectByTag(worldObject, 'cash')
  if (cashObj !== null) {
    cashObj.render[0].text = 'Cash: $' + cash
  }
}

// updates the score
function updateScore (score, current) {
  var topScoreObj = findObjectByTag(worldObject, 'topScore')
  var scoreObj = findObjectByTag(worldObject, 'score')
  if (scoreObj !== null) {
    scoreObj.render[0].text = 'Score: ' + score
  }
  if (score > topScore) {
    topScore = score
    setCookie('asteroidtopscore', '' + topScore, 365)
    topScoreObj.render[0].text = 'Top Score: ' + topScore
  }
}

function makeUpgradeShotScript () {
  return {update: upgradeShot}
}

// Upgrade current shot level by 1
function upgradeShot () {
  // KEY 'u'
  if (input.inputArray['Key85'].pressed) {
    if (cash >= upgradeCost && upgradeLevel < 4) {
      updateCash(cash -= upgradeCost)
      upgradeLevel++
      var upgradeButtonTxt = findObjectByTag(worldObject, 'upgradeText')
      if (upgradeLevel === 4) {
        maxUpgrade = true
      }
      document.getElementById('upgradeLevel').innerHTML = 'Upgrade Level: ' + (upgradeLevel + 1) + ' shot'
      if (maxUpgrade) {
        document.getElementById('upgradeLevel').innerHTML += ' (MAX)'
        upgradeButtonTxt.render[0].text = 'UPGRADE MAXED'
      } else {
        upgradeCost *= 2
        upgradeButtonTxt.render[0].text = 'Upgrade Shot: $' + upgradeCost
      }
    }
  }
}

function makeLevelManager () {
  return {update: levelManager}
}

function levelManager () {
  // console.log(enemies.children.length)
  if (enemies.children.length === 0) {
    makeLevel()
  }
}
