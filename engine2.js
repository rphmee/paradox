// Variable that might be needed.
// Loaded as part of initializing the engine
var canvas
var context

// world object
// base of tree for orderedObjects
var worldObject
// Cameras are used to make moving arround the game world easier
// Leaving it as null draws directly to the canvas
var camera = null
// An array used to sort in what order objects are drawn.
// This could be changed to a r-b tree so adding and removing is quicker. ( O(log(n)) instead of O(n) )
var orderedRenders = []
// ~~~~~~~~~~~~~~~~~~~~~~~
// Class initialization
// ~~~~~~~~~~~~~~~~~~~~~~~

class SpriteSheetRenderer {
  constructor (gameObject, imageSource, depth, anchorX, anchorY, sprites, xSize, ySize, height, width, orientation, delay) {
    this.gameObject = gameObject
    this.imageSource = imageSource
    this.depth = (typeof depth !== 'undefined') ? depth : 0
    this.anchorX = (typeof anchorX !== 'undefined') ? anchorX : 0
    this.anchorY = (typeof anchorY !== 'undefined') ? anchorY : 0
    this.sprites = (typeof sprites !== 'undefined') ? sprites : 1
    this.xSize = (typeof xSize !== 'undefined') ? xSize : this.gameObject.xSize
    this.ySize = (typeof ySize !== 'undefined') ? ySize : this.gameObject.ySize
    this.height = (typeof height !== 'undefined') ? height : gameObject.ySize
    this.width = (typeof width !== 'undefined') ? width : gameObject.xSize
    this.orientation = (typeof orientation !== 'undefined') ? orientation : 'horizontal'
    this.delay = (typeof delay !== 'undefined') ? delay : 1
    this.currentFrame = 0
    this.timer = 0
    this.visible = false
    gameObject.addChild(this)
    gameObject.addRenderer(this)

    // Add the object to the sorted location in the list
    // From least depth to most.
    var inserted = false
    for (var i = 0; i < orderedRenders.length; i++) {
      if (this.depth > orderedRenders[i].depth) {
        orderedRenders.splice(i, 0, this)
        i = orderedRenders.length
        inserted = true
      }
    }
    if (!inserted) {
      orderedRenders.push(this)
    }
  }

  drawRenderer () {
    if (this.visible) {
      if (camera === null) {
        if (this.orientation == 'vertical') {
          context.save()
          context.translate(getWorldPosX(this.gameObject) + this.anchorX * this.gameObject.xSize,
            getWorldPosY(this.gameObject) + this.anchorY * this.gameObject.ySize)
          context.rotate(this.gameObject.rot)
          context.drawImage(this.imageSource, -this.gameObject.xSize / 2, -this.gameObject.ySize / 2, this.gameObject.xSize,
            this.gameObject.ySize)
          context.restore()
        } else {
          context.save()
          context.translate(getWorldPosX(this.gameObject) + this.anchorX * this.gameObject.xSize,
            getWorldPosY(this.gameObject) + this.anchorY * this.gameObject.ySize)
          context.rotate(this.gameObject.rot)
          context.drawImage(this.imageSource, -this.gameObject.xSize / 2, -this.gameObject.ySize / 2, this.gameObject.xSize,
            this.gameObject.ySize)
          context.restore()
          this.update()
        }
      } else {
        if (this.orientation == 'vertical') {
          context.save()
          context.translate(getWorldPosX(this.gameObject) + this.anchorX * this.gameObject.xSize - camera.x + canvas.width / 2,
            getWorldPosY(this.gameObject) + this.anchorY * this.gameObject.ySize - camera.y + canvas.height / 2)
          context.rotate(this.gameObject.rot)
          context.drawImage(this.imageSource, 0, this.height * this.currentFrame, this.width, this.height,
            -this.gameObject.xSize / 2, -this.gameObject.ySize / 2, this.xSize, this.ySize)
          context.restore()
          this.update()
        } else {
          context.save()
          context.translate(getWorldPosX(this.gameObject) + this.anchorX * this.gameObject.xSize - camera.x + canvas.width / 2,
            getWorldPosY(this.gameObject) + this.anchorY * this.gameObject.ySize - camera.y + canvas.height / 2)
          context.rotate(this.gameObject.rot)
          context.drawImage(this.imageSource, this.width * this.currentFrame, 0, this.width, this.height,
            -this.gameObject.xSize / 2, -this.gameObject.ySize / 2, this.xSize, this.ySize)
          context.restore()
        }
      }
    }
  }

  update () {
    this.timer++
    if (this.timer >= this.delay) {
      this.timer = 0
      this.currentFrame = (this.currentFrame + 1) % this.sprites
    }
  }
}

// class for the renderer. later can be used to include differnt types of renderes
class ImageRenderer {
  constructor (gameObject, imageSource, depth, anchorX, anchorY, drawAsUI) {
    this.gameObject = gameObject
    this.imageSource = imageSource
    this.depth = (typeof depth !== 'undefined') ? depth : 0
    this.anchorX = (typeof anchorX !== 'undefined') ? anchorX : 0
    this.anchorY = (typeof anchorY !== 'undefined') ? anchorY : 0
    this.drawAsUI = (typeof drawAsUI !== 'undefined') ? drawAsUI : false
    gameObject.addChild(this)
    gameObject.addRenderer(this)

    // Add the object to the sorted location in the list
    // From least depth to most.
    var inserted = false
    for (var i = 0; i < orderedRenders.length; i++) {
      if (this.depth > orderedRenders[i].depth) {
        orderedRenders.splice(i, 0, this)
        i = orderedRenders.length
        inserted = true
      }
    }
    if (!inserted) {
      orderedRenders.push(this)
    }
  }

  drawRenderer () {
    if (this.gameObject.visible) {
      if (camera === null || this.drawAsUI === true) {
        context.save()
        context.translate(getWorldPosX(this.gameObject) + this.anchorX * this.gameObject.xSize,
          getWorldPosY(this.gameObject) + this.anchorY * this.gameObject.ySize)
        context.rotate(this.gameObject.rot)
        context.drawImage(this.imageSource, -this.gameObject.xSize / 2, -this.gameObject.ySize / 2, this.gameObject.xSize,
          this.gameObject.ySize)
        context.restore()
      } else {
        context.save()
        context.translate(getWorldPosX(this.gameObject) + this.anchorX * this.gameObject.xSize - camera.x + canvas.width / 2,
          getWorldPosY(this.gameObject) + this.anchorY * this.gameObject.ySize - camera.y + canvas.height / 2)
        context.rotate(this.gameObject.rot)
        context.drawImage(this.imageSource, -this.gameObject.xSize / 2, -this.gameObject.ySize / 2, this.gameObject.xSize, this.gameObject.ySize)
        context.restore()
      }
    }
  }

  update () {

  }
}

// Draws a solid box over the game object
class SolidRenderer {
  constructor (gameObject, color, shape, depth, drawAsUI) {
    this.shape = (typeof shape !== 'undefined') ? shape : 'square'
    this.gameObject = gameObject
    this.drawColor = color
    this.depth = (typeof depth !== 'undefined') ? depth : 0
    this.drawAsUI = (typeof drawAsUI !== 'undefined') ? drawAsUI : false
    gameObject.addChild(this)
    gameObject.addRenderer(this)

    // Add the object to the sorted location in the list
    // From least depth to most.
    var inserted = false
    for (var i = 0; i < orderedRenders.length; i++) {
      if (this.depth > orderedRenders[i].depth) {
        orderedRenders.splice(i, 0, this)
        i = orderedRenders.length
        inserted = true
      }
    }
    if (!inserted) {
      orderedRenders.push(this)
    }
  }

  drawRenderer () {
    if (this.gameObject.visible) {
      if (camera === null || this.drawAsUI === true) {
        if (this.shape === 'square' || this.shape === null) {
          context.save()
          context.translate(getWorldPosX(this.gameObject) + this.gameObject.xSize / 2, getWorldPosY(this.gameObject) + this.gameObject.ySize / 2)
          context.rotate(this.gameObject.rot)
          context.fillStyle = this.drawColor
          context.fillRect(-this.gameObject.xSize, -this.gameObject.ySize, this.gameObject.xSize, this.gameObject.ySize)
          context.restore()
        } else if (this.shape === 'circle') {
          context.save()
          context.translate(getWorldPosX(this.gameObject) + this.gameObject.xSize / 2, getWorldPosY(this.gameObject) + this.gameObject.ySize / 2)
          context.rotate(this.gameObject.rot)
          context.fillStyle = this.drawColor
          context.beginPath()
          context.arc(0, 0, this.gameObject.xSize / 2, 0, 2 * Math.PI, false)
          context.fill()
          context.restore()
        }
      } else {
        if (this.shape === 'square') {
          context.save()
          context.translate(getWorldPosX(this.gameObject) - camera.x + canvas.width / 2,
            getWorldPosY(this.gameObject) - camera.y + canvas.height / 2, this.gameObject.xSize - 0.5)
          context.rotate(this.gameObject.rot)
          context.fillStyle = this.drawColor
          context.fillRect(-this.gameObject.xSize / 2, -this.gameObject.ySize / 2, this.gameObject.xSize, this.gameObject.ySize)
          context.restore()
        } else if (this.shape === 'circle') {
          context.save()
          context.translate(getWorldPosX(this.gameObject) - camera.x + canvas.width / 2,
            getWorldPosY(this.gameObject) - camera.y + canvas.height / 2)
          context.rotate(this.gameObject.rot)
          context.fillStyle = this.drawColor
          context.beginPath()
          context.arc(0, 0, this.gameObject.xSize / 2, 0, 2 * Math.PI, false)
          context.fill()
          context.restore()
        }
      }
    }
  }

  update () {

  }
}

// Draws a text element
class TextRenderer {
  constructor (gameObject, text, font, size, color, styles, depth, drawAsUI) {
    this.gameObject = gameObject
    this.text = (typeof text !== 'undefined') ? text : ''
    this.font = (typeof font !== 'undefined') ? font : 'Arial'
    this.size = (typeof size !== 'undefined') ? size : '12'
    this.color = (typeof color !== 'undefined') ? color : 'black'
    this.styles = (typeof styles !== 'undefined') ? styles : ' '
    this.depth = (typeof depth !== 'undefined') ? depth : 0
    this.drawAsUI = (typeof drawAsUI !== 'undefined') ? drawAsUI : false
    gameObject.addChild(this)
    gameObject.addRenderer(this)

    // Add the object to the sorted location in the list
    // From least depth to most.
    var inserted = false
    for (var i = 0; i < orderedRenders.length; i++) {
      if (this.depth > orderedRenders[i].depth) {
        orderedRenders.splice(i, 0, this)
        i = orderedRenders.length
        inserted = true
      }
    }
    if (!inserted) {
      orderedRenders.push(this)
    }
  }

  drawRenderer () {
    if (this.gameObject.visible) {
      if (camera === null || this.drawAsUI === true) {
        context.save()
        context.font = this.styles + this.size + 'px ' + this.font
        context.translate(getWorldPosX(this.gameObject) + this.gameObject.xSize / 2, getWorldPosY(this.gameObject) + this.gameObject.ySize / 2)
        context.rotate(this.gameObject.rot)
        context.fillStyle = this.color
        context.fillText(this.text, -this.gameObject.x / 2, -this.gameObject.y / 2)
        context.restore()
      } else {
        context.save()
        context.font = this.styles + this.size + 'px ' + this.font
        context.translate(getWorldPosX(this.gameObject) + this.gameObject.xSize / 2, getWorldPosY(this.gameObject) + this.gameObject.ySize / 2)
        context.rotate(this.gameObject.rot)
        context.fillStyle = this.color
        context.fillText(this.text, this.gameObject.x, this.gameObject.y)
        context.restore()
      }
    }
  }

  update () {

  }
}

// class for game object
class GameObject {
  constructor (xpos, ypos, rot, anchorX, anchorY, scaleX, scaleY, dirX, dirY, attached) {
    // declares the position of the object.
    this.x = (typeof xpos !== 'undefined') ? xpos : 0
    this.y = (typeof ypos !== 'undefined') ? ypos : 0
    // declairs a general size of the object.
    // children are free to ignore or use this.
    this.xSize = 32
    this.ySize = 32
    // declare the rotation of the object
    // value should be in radians
    this.rot = (typeof rot !== 'undefined') ? rot : 0
    // declare the anchor point of the object
    // used for rotations
    // default position set to center
    this.anchorX = (typeof anchorX !== 'undefined') ? anchorX : xpos + (this.xSize / 2)
    this.anchorY = (typeof anchorY !== 'undefined') ? anchorY : ypos + (this.ySize / 2)
    // declare the scale of the object
    // default scale to 1 in both directions
    this.scaleX = (typeof scaleX !== 'undefined') ? scaleX : 1
    this.ScaleY = (typeof scaleY !== 'undefined') ? scaleY : 1
    // declare the direction of the object
    // default to up (0, 1), values should be between -1 and 1
    this.dirX = (typeof dirX !== 'undefined') ? dirX : 0
    this.dirY = (typeof dirY !== 'undefined') ? dirY : -1
    // if an object is "attached" it will move with its parent object
    // default will be set to false
    // if attached, objects x and y positions will be a ratio value in relation to the parent object
    // and the anchorX and anchorY
    this.attached = (typeof attached !== 'undefined') ? attached : false
    // declare a list of renders
    // each of these will recieve a draw call as part of the game loop
    // A list is used in case a object has multible draw calls
    // such as a object with a sprite and outline
    // note that this list is not used to make the call. Just stored so the gameobject can access.
    this.render = []
    // list of children and refrence to parent
    // children are used to iterate over orderedObjects
    // a list is used so several children can be added
    this.children = []
    this.parent = null
    // A variable used to change how fast something move with limiting frame rate
    // Underscore denotes that it is a private value.
    this._timeScale = 1
    // list of scripts for performing functions
    this.script = []
    // list of tags
    // useful for organizing objects without having to add a children
    this.tag = []
	  // a way to give object limited duration; -1 for infinite
    this.duration = -1
    // a way to tell a object to skip all draw calls.
    this.visible = false
    this.collider = false
    this.paused = false
  }

  addChild (newChild) {
    newChild.parent = this
    this.children.push(newChild)
  }

  addScript (newScript) {
    newScript.parent = this
    this.script.push(newScript)
  }

  getScript (scriptname) {
    for (var i = 0; i < this.script.length; i++) {
      if (typeof (this.script[i].name) !== 'undefined' && this.script[i].name === scriptname) {
        return this.script[i]
      }
    }
    return null
  }

  addRenderer (newRender) {
    this.render.push(newRender)
  }

  // Gets the time scale as a total product of all parents
  get timeScale () {
    if (this.parent !== null) {
      return this._timeScale * this.parent.timeScale
    }
    return this._timeScale
  }

  // Sets the local time scale
  set timeScale (newTimeScale) {
    this._timeScale = newTimeScale
  }
}

class Player {
  constructor (id) {
    this.id = id
    this.controller = new Controller()
  }
}

class Controller {
  constructor () {
    //defaults? Maybe unnecessary
    this.left = 'Key37'
    this.up = 'Key38'
    this.right = 'Key39'
    this.down = 'Key40'
  }
}

class Input {
  constructor () {
    // mousePosition
    this.mouseX = 0
    this.mouseY = 0
    // Make an array for the inputs
    this.inputArray = []
    // states are down, up, pressed
    // types are keyboard, mouse
    // Store every possible keycode as a object (some unnneded ones are created)
    for (var i = 8; i <= 222; i++) {
      var name = 'Key' + i
      this.inputArray[name] = {down: false, up: false, pressed: false}
    }
    // left mouse button
    this.inputArray['MouseButton0'] = {down: false, up: false, pressed: false}
    // middle mouse button
    this.inputArray['MouseButton1'] = {down: false, up: false, pressed: false}
    // right mouse button
    this.inputArray['MouseButton2'] = {down: false, up: false, pressed: false}
    // There is a posibility of more mouse buttons (I think) but this should work for almost all cases
  }

  // resets the values at the end of the frame
  updateState () {
    for (var i = 8; i <= 222; i++) {
      var name = 'Key' + i
      this.inputArray[name].down = false
      this.inputArray[name].up = false
    }
    // left mouse button
    this.inputArray['MouseButton0'].down = false
    this.inputArray['MouseButton0'].up = false
    // middle mouse button
    this.inputArray['MouseButton1'].down = false
    this.inputArray['MouseButton1'].up = false
    // right mouse button
    this.inputArray['MouseButton2'].down = false
    this.inputArray['MouseButton2'].up = false
  }
}

class Vector2 {
  constructor (x, y) {
    this.x = x
    this.y = y
  }

  add (v2) {
    var v3 = new Vector2(this.x += v2.x, this.y += v2.y)
    return v3
  }

  sub (v2) {
    var v3 = new Vector2(this.x -= v2.x, this.y -= v2.y)
    return v3
  }

  dot (v2) {
    return this.x * v2.x + this.y * v2.y
  }

  cross (v2) {
    return this.x * v2.y - this.y * v2.x
  }

  scale (s) {
    var v3 = new Vector2(s * this.x, s * this.y)
    return v3
  }

  normalize () {
    var denom = 1 / Math.sqrt(this.dot(this))
    return (this.scale(denom))
  }

  angle (v2) {
    var cosTheta = this.dot(v2) / (this.magnitude() * v2.magnitude())
    if (cosTheta > 1) {
      return 0
    } else {
      var angleInRadians = Math.acos(cosTheta)
      return angleInRadians
    }
  }

  // Convert the vector into a rotation so that the rotation points allong the vector.
  toRotation () {
    return Math.atan2(this.y, this.x)
  }

  // Returns the magnitude of the vector
  magnitude () {
    return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2))
  }

  rotate (theta) {
    var oldX = this.x
    var oldy = this.y
    this.x = oldX * Math.cos(theta) - oldy * Math.sin(theta)
    this.y = oldX * Math.sin(theta) + oldy * Math.cos(theta)
  }
}

// class for adding basic physics behavior to a object
class Physics {
  // Keeping the slightly strange convention of having the constructor have the game object be a parameter
  constructor (gameObject, dx, dy, target) {
    // Prevent the object from adding 2 physics components.
    if (gameObject.getScript('physics')) {
      return
    }
    this.gameObject = gameObject
    // Add a name to this script so it can be searched for.
    this.name = 'physics'
    // The mass of this object
    this.mass = 1
    // how elastic 'realalistic' collisions should be
    this.elasticity = 1
    // Stores the velocity
    this.velocity = new Vector2(0, 0)
    this.velocity.x = (typeof dx !== 'undefined') ? dx : 0
    this.velocity.y = (typeof dx !== 'undefined') ? dy : 0
    // Create a list that the object will collide against.
    // For the games we are going to be making,
    // it makes more sence for objects to not collide
    // unless told to instead of collide unless told not to.
    this.testGroup = []
    if (target !== undefined) {
      this.testGroup.push(target)
    }
    // The function to call if there is a collision.
    this.onCollision = undefined
    gameObject.addScript(this)
  }

  update () {
    this.gameObject.x += this.velocity.x * this.parent.timeScale
    this.gameObject.y += this.velocity.y * this.parent.timeScale

    if (this.onCollision !== undefined) {
      for (var other in this.testGroup) {
        var hit = getCollision(this.gameObject.x, this.gameObject.y, this.gameObject, this.testGroup[other])
        if (hit !== null) {
          // the displacement is good enough as the normal for now.
          // I am including it as a parameter as it wont always be simple.
          var normal = new Vector2(hit.x - this.gameObject.x, hit.y - this.gameObject.y)
          normal = normal.normalize()
          this.onCollision(hit, normal)
        }
      }
    }
  }
}

// Input for player
var input = new Input()

// List of assest that need to be loaded before the engine can run
var IMAGES = []

var engineLoaded = false
var engineLoadedCallback = []
// Function that will call the given function once the engine has been loaded.
// If the engine is already loaded, the function is called back imediatly.
function callbackOnEngineLoad (callback) {
  if (engineLoaded) {
    callback()
  } else {
    engineLoadedCallback.push(callback)
  }
}

// function by:
// http://codeincomplete.com/posts/javascript-game-foundations-loading-assets/
// Loads a lot of images then returns the list to a given 
function preloadArtAssets (path, names, callback) {
  if (names.length > 0) {
  // temporary storage variables
    var n, name
    // the resulting array of images
    var result = {}
    var count = names.length
    // function to call once a file has been loaded
    var onload = function () { if (--count === 0) callback(result) }

    for (n = 0; n < names.length; n++) {
      name = names[n]
      result[name] = document.createElement('img')
      result[name].addEventListener('load', onload)
      // If files are stored in a sub dirrectory,
      // put the path before "name"
      result[name].src = path + name + '.png'
    }
  } else {
    // nothing to load
    callback(null)
  }
}

// Called after the initial assest have been loaded.
// Could be the entire game or just enough for a loading bar.
function initializeEngine (initialImages) {
  canvas = document.getElementById('canvas')
  context = canvas.getContext('2d')
  worldObject = new GameObject(0, 0)

  // set up inputs
  // this works by registering a custom function
  // with what the document does by default
  document.onmouseup = updateMouseUp
  document.onmousemove = updateMousePosition
  document.onmousedown = updateMouseDown
  document.onkeyup = updateKeyboardUp
  //  document.onkeypress = updateKeyboardPress
  document.onkeydown = updateKeyboardDown

  // Prevent right click from creating dialog
  document.addEventListener('contextmenu', function (e) { e.preventDefault() }, false)

  // store the images.
  // currently nothing worth saving

  setInterval(engineUpdate, 30)

  engineLoaded = true
  for (var i = 0; i < engineLoadedCallback.length; i++) {
    var callbackFunction = engineLoadedCallback[i]
    callbackFunction()
  }
}

// Calls update then draw
function engineUpdate () {
  updateObjects(worldObject)
  canvas.width = canvas.width
  drawGame()
  // reset the input. This resets things like was a button pressed down or up.
  input.updateState()
}

// Draw the game
function drawGame () {
  for (var i = 0; i < orderedRenders.length; i++) {
    orderedRenders[i].drawRenderer()
  }
}

// Currently uses a fixed update time
function updateObjects (current) {
  for (i in current.children) {
    updateObjects(current.children[i])
  }
  for (s in current.script) {
    if ('update' in current.script[s]) {
      current.script[s].update()
    }
  }
}

// remove a child component from a parent (but keep in game)
function removeChild(parent, child) {
  for (var c in parent.children) {
    if (parent.children[c] == child) {
      parent.children.splice(c, 1);
    }
  }
}

// removes a gameObject from the game
function removeGameObject (current, gameObject) {
  // DO NOT replace with default itterator code.
  // The array is being deleted from as we itterate through.
  // Default itterator ends up skipping every other element.

  // Delete the renderes
  for (var rendList = orderedRenders.length - 1; rendList >= 0; rendList--) {
    if (orderedRenders[rendList] === gameObject) {
      orderedRenders.splice(rendList, 1)
    }
  }
  // Remove the object from the parrent.
  for (var comps = gameObject.parent.children.length - 1; comps >= 0; comps--) {
    if (gameObject.parent.children[comps] === gameObject) {
      gameObject.parent.children.splice(comps, 1)
    }
  }
  // Propogate the destroy to all children
  if (gameObject.children !== undefined) {
    for (var obj = gameObject.children.length - 1; obj >= 0; obj--) {
      removeGameObject(null, gameObject.children[obj])
    }
  }
}

// finds the first gameObject with a given tag and returns it
function findObjectByTag (current, tag) {
  var tagged = null
  for (o in current.children) {
    if (tagged == null) {
      tagged = findObjectByTag(current.children[o], tag)
    }
  }
  if (tagged == null) {
    for (t in current.tag) {
      if (current.tag[t] == tag) {
        return current
      }
    }
  }
  return tagged
}

// finds all objects with a given tag and returns and array
function findAllObjectsByTag (current, tag) {
  var tagged = new Array()
  for (c in current.children) {
    var returned = findAllObjectsByTag(current.children[c], tag)
    for (t in returned) {
      tagged.push(returned[t])
    }
  }
  for (tags in current.tag) {
    if (current.tag[tags] == tag) {
      tagged.push(current)
    }
  }
  return tagged
}

// Changes what javascript does when the mouse is moved. In this case lets us grab position.
function updateMousePosition (event) {
  var eventDoc, doc, body

  event = event || window.event // IE-ism

  // If pageX/Y aren't available and clientX/Y are,
  // calculate pageX/Y - logic taken from jQuery.
  // (This is to support old IE)
  if (event.pageX == null && event.clientX != null) {
    eventDoc = (event.target && event.target.ownerDocument) || document
    doc = eventDoc.documentElement
    body = eventDoc.body

    event.pageX = event.clientX +
              ((doc && doc.scrollLeft) || (body && body.scrollLeft) || 0) -
              ((doc && doc.clientLeft) || (body && body.clientLeft) || 0)
    event.pageY = event.clientY +
              ((doc && doc.scrollTop) || (body && body.scrollTop) || 0) -
              ((doc && doc.clientTop) || (body && body.clientTop) || 0)
  }

  input.mouseX = event.pageX - canvas.getBoundingClientRect().left - window.scrollX
  input.mouseY = event.pageY - canvas.getBoundingClientRect().top - window.scrollY
}

// Updates when the mouse is released
function updateMouseUp (event) {
  event.preventDefault()
  var inputName = 'MouseButton' + event.button
  input.inputArray[inputName].up = true
  input.inputArray[inputName].pressed = false
}

// Simmilar to move overrides what happens when the mouse button is pressed.
function updateMouseDown (event) {
  // console.log('pressed:' + event.button)
  event.preventDefault()
  var inputName = 'MouseButton' + event.button
  input.inputArray[inputName].down = true
  input.inputArray[inputName].pressed = true
}

// Find object under mouse pointer.
function getObjectUnderMouse (current) {
  var x = input.mouseX
  var y = input.mouseY
  var target = null
  for (var obj in current.children) {
    if (target === null) {
      target = getObjectUnderMouse(current.children[obj])
    }

    if (x > (current.x - current.xSize / 2) && x < (current.x + current.xSize / 2) && y > (current.y - current.ySize / 2) && y < (current.y + current.ySize / 2)) {
      target = current
      break
    }
  }
  return target
}

// Keyboard pressed
function updateKeyboardUp (event) {
  event = event || window.event
  var inputName = 'Key' + event.keyCode || event.which
  input.inputArray[inputName].up = true
  input.inputArray[inputName].pressed = false
}

// Keyboard pressed
function updateKeyboardPress (event) {
  event = event || window.event
  var inputName = 'Key' + event.keyCode || event.which
  input.inputArray[inputName].pressed = true
}

// Keyboard down
function updateKeyboardDown (event) {
  if (event.keyCode === 32 && event.target === document.body) {
    event.preventDefault()
  }
  event = event || window.event
  var inputName = 'Key' + event.keyCode || event.which
  input.inputArray[inputName].down = true
  input.inputArray[inputName].pressed = true
}

// Check for overlap collision. size is hard coded, returns gameObject
function getCollision (xpos, ypos, testObject, current) {
  var collider = null
  for (o in current.children) {
    if (collider == null) {
      collider = getCollision(xpos, ypos, testObject, current.children[o])
    }
  }

  if (collider == null) {
    if (current.collider && current !== testObject) {
      // Square on square check
      // if the other collider is true, use square colider as legacy
      if ((current.collider === 'square' && testObject.collider === 'square') || current.collider === true) {
        if (xpos > (current.x - (testObject.xSize + current.xSize) / 2) && xpos < (current.x + (testObject.xSize + current.xSize) / 2) &&
        ypos > (current.y - (testObject.ySize + current.ySize) / 2) && ypos < (current.y + (testObject.ySize + current.ySize) / 2)) {
          return current
        }
      } else if (current.collider === 'circle' && testObject.collider === 'circle') {
        // Circle on cicle check
        var xdisplacement = current.x - testObject.x
        var ydisplacement = current.y - testObject.y
        var radiusSum = (current.xSize + testObject.xSize) / 2
        if (xdisplacement * xdisplacement + ydisplacement * ydisplacement < radiusSum * radiusSum) {
          return current
        }
      } else if (current.collider === 'circle' && testObject.collider === 'square') {
        // Circle on square check
        // console.log('checking')
        if (RectCircleColliding(current.x, current.y, current.xSize / 2,
          testObject.x, testObject.y, testObject.xSize, testObject.ySize, testObject.rot)) {
          return current
        }
      } else if (current.collider === 'square' && testObject.collider === 'circle') {
        // Circle on square check
        if (RectCircleColliding(testObject.x, testObject.y, testObject.xSize / 2,
          current.x, current.y, current.xSize, current.ySize, current.rot)) {
          return current
        }
      }
      /*

*/
    }
  }
  return collider
}

// Check for overlap between a circle and a rectangle.
function RectCircleColliding (circleX, circleY, circleRad, rectX, rectY, rectW, rectH, rot) {
  // console.log(circleX, circleY, circleRad, rectX, rectY, rectW, rectH)
  var v = new Vector2(circleX - rectX, circleY - rectY)
  v.rotate(-rot)
  // console.log(v.x + ', ' + v.y + ', ' + v.magnitude())
  var distX = Math.abs(v.x)
  var distY = Math.abs(v.y)

  if (distX > (rectW / 2 + circleRad)) { return false }
  if (distY > (rectH / 2 + circleRad)) { return false }

  if (distX <= (rectW / 2)) { return true }
  if (distY <= (rectH / 2)) { return true }

  var dx = distX - rectW / 2
  var dy = distY - rectH / 2
  return (dx * dx + dy * dy <= (circleRad * circleRad))
}

// Grid class of size H x W
class Grid {
  constructor (h, w, value) {
    var init = (typeof value !== 'undefined') ? value : 0
    this.tag = []
    this.col = w
    this.row = h
    this.grid = []
    for (var i = 0; i < h; i++) {
      this.grid[i] = []
      for (var j = 0; j < w; j++) {
        this.grid[i][j] = init
      }
    }
  }

  update () {

  }
}

// draw a rectangular border
function draw_rect_border (xStart, yStart, w, h, lineWidth, col) {
  context.beginPath()
  context.lineWidth = lineWidth
  context.strokeStyle = col
  context.rect(xStart, yStart, w, h)
  context.stroke()
}

// Function for converting a position on the screen to a position in the world when using a camera
function screenSpaceToWorldSpace (screenSpace) {
  if (camera === null) {
    return screenSpace
  }
  return new Vector2(screenSpace.x + camera.x - canvas.width / 2, screenSpace.y + camera.y - canvas.height / 2)
}

// Sets a cookie to a given value. Negative values of days clear the cookie.
function setCookie (cookiename, cookievalue, experationdays) {
  var d = new Date()
  d.setTime(d.getTime() + (experationdays * 24 * 60 * 60 * 1000))
  var expires = 'expires=' + d.toGMTString()
  document.cookie = cookiename + '=' + cookievalue + ';' + expires + ';path=/'
}

function getCookie (cookiename) {
  var name = cookiename + '='
  var decodedCookie = decodeURIComponent(document.cookie)
  var ca = decodedCookie.split(';')
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i]
    while (c.charAt(0) === ' ') {
      c = c.substring(1)
    }
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length)
    }
  }
  return ''
}

function angleToVector (angle) {
  return new Vector2(Math.cos(angle), Math.sin(angle))
}

function raycast (v1, v2) {
  return v2.sub(v1)
}

function degrees_to_radians (degrees) {
  return degrees * Math.PI / 180
}

function radians_to_degrees (radians) {
  return radians * Math.PI / 180
}

function getWorldPosX (obj) {
  if (obj.attached) {
    // recurse if necessary
    return getWorldPosX(obj.parent) + obj.anchorX * obj.parent.xSize
  }
  return obj.x
}

function getWorldPosY (obj) {
  if (obj.attached) {
    // recurse if necessary
    return getWorldPosY(obj.parent) + obj.anchorY * obj.parent.ySize
  }
  return obj.y
}

// turn game object (obj) to face target X, Y (targX, targY)
function turnToTarget (obj, targX, targY) {
  var target
  if (camera !== null) {
    target = screenSpaceToWorldSpace({x: targX, y: targY})
  } else {
    target = new Vector2(targX, targY)
  }
  var objPos = new Vector2(obj.x, obj.y)
  target = target.sub(objPos)
  // Prevent dividing by zero
  if (target.x !== 0 || target.y !== 0) {
    target = target.normalize()
    var oRot = obj.rot
    obj.rot = target.toRotation()

    // rotate any child and render of the object
    rotateComponents(obj, oRot - obj.rot)
  }
}

// rotate anchor point of gameObject's (obj) children and renders/children to follow rotation
function rotateComponents (obj, rot) {
  for (rend in obj.render) {
    // adjust render anchors by rotating anchor point around parent object's center
    var anchor = new Vector2(obj.render[rend].anchorX, obj.render[rend].anchorY)

    // rotation flips X and Y values, not sure why. Currently fixed by flipping
    // original AnchorX and AnchorY values. Fine for now, needs work.
    anchor.rotate(-rot)
    obj.render[rend].anchorX = anchor.x
    obj.render[rend].anchorY = anchor.y
  }
  for (comp in obj.children) {
    if (comp.attached) {
      if (comp.rotLocked) {
        // todo (if necessary): adjust child rotation
      }
      // adjust child anchors
      var anchor = new Vector2(obj.children[comp].anchorX, obj.children[comp].anchorY)
      anch.rotate(-rot)
      obj.children[comp].anchorX = anchor.x
      obj.children[comp].anchorY = anchor.y
      // recursively rotate attached child's children and renders
      rotateComponents(obj.children[comp], rot)
    }
  }
}
