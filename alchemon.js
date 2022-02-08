/* global canvas, context, ImageRenderer, SolidRenderer,
GameObject, input, preloadArtAssets, addGameObject,
removeGameObject, addRenderer, removeRenderer,
getObjectUnderMouse, getCollision */

// Object for handling moving other objects arround.
var mouseController

// image storage
// This should probamle be moved over to the engine and stored as a object/array
var arcImage; var articImage; var blastImage
var bulbaImage; var charImage; var chariImage
var charmImage; var dragairImage; var dragiteImage
var dratImage; var eeveeImage; var flareImage
var gengImage; var ghastImage; var growlImage
var gyraImage; var hauntImage; var ivyImage
var joltImage; var magiImage; var mewImage
var moltImage; var mtwoImage; var pikaImage
var pokeballImage; var raiImage; var scythImage
var snoreImage; var squirtImage; var trainImage
var vapImage; var venusImage; var walkImage
var wartImage; var zapImage; var alchemonImage
var eggImage

// Source file names to be appended with .png
var GAMEIMAGES = ['arc', 'artic', 'blast', 'bulba', 'char', 'chari', 'charm', 'dragair', 'dragite', 'drat', 'eevee',
  'flare', 'geng', 'ghast', 'growl', 'gyra', 'haunt', 'ivy', 'jolt', 'magi', 'mew', 'molt', 'mtwo', 'pika',
  'rai', 'scyth', 'snore', 'squirt', 'vap', 'venus', 'wart', 'zap', 'egg', 'pokeball', 'train', 'walk', 'alchemon']

var pokemonList

// evolution table
var evolution_table = [
  {base: 'magi', evolution: 'gyra'},
  {base: 'bulba', evolution: 'ivy'},
  {base: 'ivy', evolution: 'venus'},
  {base: 'pika', evolution: 'rai'},
  {base: 'char', evolution: 'charm'},
  {base: 'charm', evolution: 'chari'},
  {base: 'squirt', evolution: 'wart'},
  {base: 'wart', evolution: 'blast'},
  {base: 'eevee', evolution: ['jolt', 'vap', 'flare']},
  {base: 'ghast', evolution: 'haunt'},
  {base: 'haunt', evolution: 'geng'},
  {base: 'drat', evolution: 'dragair'},
  {base: 'dragair', evolution: 'dragite'},
  {base: 'growl', evolution: 'arc'}
]

// visual dimensions
var spriteH = 27
var spriteW = 27
var boardW = 0.75
var boardH = 0.10
var divSize = 2
// Initialized at game start
var spriteRowStart = 0
var spriteCol1 = 0
var spriteCol2 = 0

// game variables
var num_species = 32
var num_items = 5
var eevolutions = 3

function initializeGame () {
  // preload art
  spriteRowStart = canvas.height * 0.11 + spriteH / 2
  spriteCol1 = canvas.width * 0.80 + spriteW / 2
  spriteCol2 = spriteCol1 + spriteW + 5
  preloadArtAssets('images/', GAMEIMAGES, startGame)
}


// Called after the initial assest have been loaded.
// Could be the entire game or just enough for a loading bar.
function startGame (initialImages) {
  // store the images.
  arcImage = initialImages['arc']; articImage = initialImages['artic']; blastImage = initialImages['blast']
  bulbaImage = initialImages['bulba']; charImage = initialImages['char']; chariImage = initialImages['chari']
  charmImage = initialImages['charm']; dragairImage = initialImages['dragair']; dragiteImage = initialImages['dragite']
  dratImage = initialImages['drat']; eeveeImage = initialImages['eevee']; flareImage = initialImages['flare']
  gengImage = initialImages['geng']; ghastImage = initialImages['ghast']; growlImage = initialImages['growl']
  gyraImage = initialImages['gyra']; hauntImage = initialImages['haunt']; ivyImage = initialImages['ivy']
  joltImage = initialImages['jolt']; magiImage = initialImages['magi']; mewImage = initialImages['mew']
  moltImage = initialImages['molt']; mtwoImage = initialImages['mtwo']; pikaImage = initialImages['pika']
  pokeballImage = initialImages['pokeball']; raiImage = initialImages['rai']; scythImage = initialImages['scyth']
  snoreImage = initialImages['snore']; squirtImage = initialImages['squirt']; trainImage = initialImages['train']
  vapImage = initialImages['vap']; venusImage = initialImages['venus']; walkImage = initialImages['walk']
  wartImage = initialImages['wart']; zapImage = initialImages['zap']; alchemonImage = initialImages['alchemon']
  eggImage = initialImages['egg']

  // Set up the pokemon list for hatching an egg
  pokemonList = [{tag: 'bulba', img: bulbaImage},
    {tag: 'ivy', img: ivyImage},
    {tag: 'venus', img: venusImage},
    {tag: 'squirt', img: squirtImage},
    {tag: 'wart', img: wartImage},
    {tag: 'blast', img: blastImage},
    {tag: 'char', img: charImage},
    {tag: 'charm', img: charmImage},
    {tag: 'chari', img: chariImage},
    {tag: 'pika', img: pikaImage},
    {tag: 'rai', img: raiImage},
    {tag: 'eevee', img: eeveeImage},
    {tag: 'flare', img: flareImage},
    {tag: 'vap', img: vapImage},
    {tag: 'jolt', img: joltImage},
    {tag: 'ghast', img: ghastImage},
    {tag: 'haunt', img: hauntImage},
    {tag: 'geng', img: gengImage},
    {tag: 'snore', img: snoreImage},
    {tag: 'scyth', img: scythImage},
    {tag: 'magi', img: magiImage},
    {tag: 'gyra', img: gyraImage},
    {tag: 'growl', img: growlImage},
    {tag: 'arc', img: arcImage},
    {tag: 'drat', img: dratImage},
    {tag: 'dragair', img: dragairImage},
    {tag: 'dragite', img: dragiteImage},
    {tag: 'artic', img: articImage},
    {tag: 'molt', img: moltImage},
    {tag: 'zap', img: zapImage},
    {tag: 'mew', img: mewImage},
    {tag: 'mtwo', img: mtwoImage}]

  // Create the list used to make the side bar
  var sidebarCreationOrder = [{tag: 'bulba', img: bulbaImage},
    {tag: 'ivy', img: ivyImage},
    {tag: 'venus', img: venusImage},
    {tag: 'squirt', img: squirtImage},
    {tag: 'wart', img: wartImage},
    {tag: 'blast', img: blastImage},
    {tag: 'char', img: charImage},
    {tag: 'charm', img: charmImage},
    {tag: 'chari', img: chariImage},
    {tag: 'pika', img: pikaImage},
    {tag: 'rai', img: raiImage},
    {tag: 'eevee', img: eeveeImage},
    {tag: 'flare', img: flareImage},
    {tag: 'vap', img: vapImage},
    {tag: 'jolt', img: joltImage},
    {tag: 'ghast', img: ghastImage},
    {tag: 'haunt', img: hauntImage},
    {tag: 'geng', img: gengImage},
    {tag: 'snore', img: snoreImage},
    {tag: 'scyth', img: scythImage},
    {tag: 'magi', img: magiImage},
    {tag: 'gyra', img: gyraImage},
    {tag: 'growl', img: growlImage},
    {tag: 'arc', img: arcImage},
    {tag: 'drat', img: dratImage},
    {tag: 'dragair', img: dragairImage},
    {tag: 'dragite', img: dragiteImage},
    {tag: 'artic', img: articImage},
    {tag: 'molt', img: moltImage},
    {tag: 'zap', img: zapImage},
    {tag: 'mew', img: mewImage},
    {tag: 'mtwo', img: mtwoImage},
    {tag: 'egg', img: eggImage},
    {tag: 'pokeball', img: pokeballImage},
    {tag: 'walk', img: walkImage},
    {tag: 'train', img: trainImage},
    {tag: 'alchemon', img: alchemonImage}]

  // variable to hold object while they are eing constructed
  var curObj
  var curRend
  var gameObjects = new GameObject(0, 0)
  gameObjects.tag.push('OBJECTS')
  var ui = new GameObject(0, 0)
  ui.tag.push('UI')
  worldObject.addChild(gameObjects)
  worldObject.addChild(ui)
  initializeUI(ui)
  // Make and place the sidebar objects
  var row = 0
  for (var i = 0; i < sidebarCreationOrder.length - 1; i++) {
    curObj = new GameObject(0, 0)
    curObj.xSize = spriteW
    curObj.ySize = spriteH
    curRend = new ImageRenderer(curObj, sidebarCreationOrder[i].img)
    curObj.tag.push(sidebarCreationOrder[i].tag)
    // Will have to think if this needs modifying.
    curObj.perm = true
    curObj.visible = false
    if (curObj.tag[0] === 'egg' || curObj.tag[0] === 'walk' || curObj.tag[0] === 'train' || curObj.tag[0] === 'pokeball') {
      curObj.visible = true
    }
    var col = i % 2 + 1
    curObj.y = spriteRowStart + (spriteH + divSize) * row
    if (col === 1) {
      curObj.x = spriteCol1
    } else {
      curObj.x = spriteCol2
      row++
    }
	gameObjects.addChild(curObj)
  }

  // create the player controller
  // For now I am just putting it in some far off corner and forgetting about it.
  mouseController = new GameObject(-10000, -10000)
  // creates a child with the update script being drag
  mouseController.addScript({target: null, update: dragObject})
  worldObject.addChild(mouseController)
}

function initializeUI(ui) {
  // Create the borders
  // vertical
  curObj = new GameObject(boardW * canvas.width, canvas.height / 2 + canvas.height * boardH)
  curObj.xSize = divSize
  curObj.ySize = canvas.height
  curObj.tag[0] = 'ui'
  curObj.visible = true
  curRend = new SolidRenderer(curObj, 'black')
  curRend.shape = 'square'
  ui.addChild(curObj)

  // horizontal
  curObj = new GameObject(canvas.width / 2, canvas.height * boardH)
  curObj.xSize = canvas.width
  curObj.ySize = divSize
  curObj.tag[0] = 'ui'
  curObj.visible = true
  curRend = new SolidRenderer(curObj, 'black')
  ui.addChild(curObj)

  // Create the logo
  curObj = new GameObject(canvas.width / 2, canvas.height * boardH / 2)
  curObj.xSize = canvas.width * 0.8
  curObj.ySize = canvas.height * boardH * 0.8
  curObj.tag[0] = 'ui'
  curObj.visible = true
  curRend = new ImageRenderer(curObj, alchemonImage)
  ui.addChild(curObj)
}

// draw a rectangular border
function draw_rect_border (xStart, yStart, w, h, lineWidth, col) {
  context.beginPath()
  context.lineWidth = lineWidth
  context.strokeStyle = col
  context.rect(xStart, yStart, w, h)
  context.stroke()
}

// check if dropping out of bounds
function out_of_bounds () {
  var xMin = input.mouseX - spriteW / 2
  var xMax = input.mouseX + spriteW / 2
  var yMin = input.mouseY - spriteH / 2
  var yMax = input.mouseY + spriteH / 2

  var flag = false

  if (xMin <= 0) {
    mouseController.script[0].target.x = 5
    flag = true
  }
  if (xMax >= canvas.width * boardW) {
    mouseController.script[0].target.x = canvas.width * boardW - (spriteW + 5)
    flag = true
  }
  if (yMin <= canvas.height * boardH) {
    mouseController.script[0].target.y = canvas.height * boardH + 5
    flag = true
  }
  if (yMax >= canvas.height) {
    mouseController.script[0].target.y = canvas.height - (spriteH + 5)
    flag = true
  }

  return flag
}

function makePokemon (tag, image) {
  var gameObjects = findObjectByTag(worldObject, 'OBJECTS')
  var newObject
  newObject = new GameObject(input.mouseX, input.mouseY)
  newObject.xSize = spriteW
  newObject.ySize = spriteW
  newObject.tag[0] = tag
  var newRend = new ImageRenderer(newObject, image)
  if (tag !== 'pokeball' && tag !== 'train' && tag !== 'egg' && tag !== 'walk' && tag !== 'snore') {
    newObject.addScript({walkDirectionX: (2 * Math.random() - 1),
      walkDirectionY: (2 * Math.random() - 1),
      walkTimer: 120,
      update: walk})
  }
  newObject.visible = true
  newObject.collider = true
  gameObjects.addChild(newObject)
  return newObject
}

// child for dragging other objects.
function dragObject () {
  var curObj = findObjectByTag(worldObject, 'OBJECTS')	
  // Move dragged object arround
  if (this.target !== null) {
    this.target.x = input.mouseX
    this.target.y = input.mouseY
  }

  // Sellect or drop an object
  if (input.inputArray['MouseButton0'].down) {
    if (this.target === null) {
      var clickedObject = getObjectUnderMouse(curObj)
      if (clickedObject === null || !clickedObject.visible) {
        // do nothing
      } else {
        if (clickedObject.tag[0] === 'ui') {
          // Do nothing. Clicked a UI Element.
        } else if (clickedObject.perm) {
          this.target = makePokemon(clickedObject.tag[0], clickedObject.render[0].imageSource)
        } else {
          this.target = clickedObject
        }
      }
    } else {
      // Check the position and position in bound if out of bounds
      if (out_of_bounds()) {
        // do nothing
      } else {
        var collider = getCollision(input.mouseX, input.mouseY, mouseController.script[0].target, worldObject)
        if (collider === null) {
          // do nothing
        } else {
          // check for something to do
          check_recipes(mouseController.script[0].target, collider)
        }
      }
      mouseController.script[0].target = null
    }
  }
}

// Loop
function walk () {
  this.walkTimer--
  if (this.walkTimer < 0) {
    this.walkDirectionX = 2 * Math.random() - 1
    this.walkDirectionY = 2 * Math.random() - 1
    this.walkTimer = 120
  }
  this.parent.x += this.walkDirectionX
  this.parent.y += this.walkDirectionY
  if ((this.parent.x < 32 && this.walkDirectionX < 0) ||
        (this.parent.x > canvas.width * boardW - 32 && this.walkDirectionX > 0)) {
    this.walkDirectionX *= -1
  }
  if ((this.parent.y < canvas.height * boardH + 32 && this.walkDirectionY) < 0 ||
        (this.parent.y > canvas.height - 32 && this.walkDirectionY > 0)) {
    this.walkDirectionY *= -1
  }
}

function check_recipes (currentObject, secondObject) {
  var gameObjects = findObjectByTag(worldObject, 'OBJECTS')
  var tagOne = currentObject.tag[0]
  var tagTwo = secondObject.tag[0]

  if (tagOne == 'egg' && tagTwo == 'walk' || tagTwo == 'egg' && tagOne == 'walk') {
    hatch(currentObject, secondObject)
  } else if (tagOne == 'pokeball' || tagTwo == 'pokeball') {
    catchPoke(currentObject, secondObject, tagOne, tagTwo)
  } else {
  	    if (tagOne == tagTwo && tagOne !== 'egg') {
      evolve(currentObject, secondObject, tagOne)
    }
  }
}

// Hatches a random species of pokemon from an egg
function hatch (currentObject, secondObject) {
  var gameObjects = findObjectByTag(worldObject, 'OBJECTS')
  var random = Math.floor(Math.random() * pokemonList.length)
  makePokemon(pokemonList[random].tag, pokemonList[random].img)
  // Pointer to change
  removeGameObject(gameObjects, currentObject)
  removeGameObject(gameObjects, secondObject)
}

// catches a pokemon and unlocks it on the sidebar if necessary
function catchPoke (currentObject, secondObject, tagOne, tagTwo) {
  var gameObjects = findObjectByTag(worldObject, 'OBJECTS')
  var poke
  if (tagOne === 'pokeball') {
    poke = tagTwo
  } else {
    poke = tagOne
  }
  // This needs reworking. But this fixxes it for now.
  // Trying to seperate out most of the inner workings of the engine including the list of objects.
  for (var o in gameObjects.children) {
    if (gameObjects.children[o].tag[0] === poke) {
      gameObjects.children[o].visible = true
      break
    }
  }
  removeGameObject(gameObjects, currentObject)
  removeGameObject(gameObjects, secondObject)
}

// evolves a pokemon, if possible, when two copies are collided
function evolve (currentObject, secondObject, tagOne) {
  var gameObjects = findObjectByTag(worldObject, 'OBJECTS')
  var evoTag = tagOne

  // special case, eevee has 3 possible evolutions
  if (tagOne === 'eevee') {
    var eevolution = Math.floor(Math.random() * eevolutions)
    var eevdex
    for (var i = 0; i < evolution_table.length; i++) {
      if (evoTag == evolution_table[i].base) {
        eevdex = i
        break
      }
    }
    evoTag = evolution_table[eevdex].evolution[eevolution]
  } else {
    for (var i = 0; i < evolution_table.length; i++) {
      if (tagOne == evolution_table[i].base) {
        evoTag = evolution_table[i].evolution
        break
      }
    }
  }

  var evo_species

  for (var i = 0; i < pokemonList.length; i++) {
    if (pokemonList[i].tag === evoTag) {
      console.log(pokemonList[i].tag)
      evo_species = pokemonList[i]
      break
    }
  }
  // Make a new pokemon
  makePokemon(evo_species.tag, evo_species.img)
  // delete the old ones
  removeGameObject(gameObjects, currentObject)
  removeGameObject(gameObjects, secondObject)
}
