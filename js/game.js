const Settings = settings()
const Geometrics = geometrtic()

const canvas = document.getElementById('thecanvas')
const ctx = canvas.getContext('2d')
var state = {}

canvas.width = Settings.oneFieldSite*Settings.fieldWidth
canvas.height = Settings.oneFieldSite*Settings.fieldHeight

if(localStorage.getItem('highscores') === null){
	localStorage.setItem('highscores', JSON.stringify([
		{name : 'unknown Erik', score : 0},
		{name : 'unknown Erik', score : 0},
		{name : 'unknown Erik', score : 0},
		{name : 'unknown Erik', score : 0},
		{name : 'unknown Erik', score : 0}
	]))
}

const draw = () => {
	ctx.clearRect(0,0,canvas.width,canvas.height)
	// Balls
	for (var ball in state.balls){
		ctx.beginPath()
		ctx.arc(state.balls[ball].x*Settings.oneFieldSite, state.balls[ball].y*Settings.oneFieldSite, Settings.ballWidth*Settings.oneFieldSite, 0, 2*Math.PI)
		ctx.fillStyle = Settings.ballColor
		ctx.fill()
		ctx.closePath()		
	}
	for (var line in state.lines){
		ctx.beginPath()
		ctx.moveTo(state.lines[line].x1*Settings.oneFieldSite, state.lines[line].y1*Settings.oneFieldSite)
		ctx.lineTo(state.lines[line].x2*Settings.oneFieldSite, state.lines[line].y2*Settings.oneFieldSite)
		if (state.lines[line].finished1 && state.lines[line].finished2){
			ctx.strokeStyle = Settings.finishedLineColor
		}else{
			ctx.strokeStyle= Settings.unfinishedLineColor
		}
		ctx.stroke()
		ctx.closePath()	
	}
	for (var rect in state.rects){
		if (state.rects[rect].active && !state.rects[rect].hasBalls && state.rects[rect].finished){
			console.log('test')
			ctx.beginPath()
			ctx.strokeStyle= Settings.emptyRectsColor
			ctx.fillRect(state.rects[rect].x*Settings.oneFieldSite, state.rects[rect].y*Settings.oneFieldSite, state.rects[rect].width*Settings.oneFieldSite, state.rects[rect].height*Settings.oneFieldSite)
			ctx.closePath()
		}
	}
	//Viereck Player
	ctx.beginPath()
	ctx.fillStyle = Settings.playerRectColor
	ctx.fillRect((state.player.x-.5)*Settings.oneFieldSite, (state.player.y-.5)*Settings.oneFieldSite, Settings.oneFieldSite, Settings.oneFieldSite)
	ctx.closePath()

	//Linie Player
	ctx.beginPath()
	ctx.moveTo(state.player.line[0].x()*Settings.oneFieldSite, state.player.line[0].y()*Settings.oneFieldSite)
	ctx.lineTo(state.player.line[1].x()*Settings.oneFieldSite, state.player.line[1].y()*Settings.oneFieldSite)
	ctx.strokeStyle = Settings.playerLineColor
	ctx.stroke()
	ctx.closePath()

	// Draw Anzahl Bälle und Covered Percentage
	var scoreText = document.createTextNode(Settings.anzBalls)
	var node = document.getElementById('score')
	node.removeChild(node.lastChild)
	node.appendChild(scoreText)
	scoreText = document.createTextNode(Math.floor(state.coveredPercentage*10000)/100)
	node = document.getElementById('coveredPercentage')
	node.removeChild(node.lastChild)
	node.appendChild(scoreText)
}

const calcluateNextStep = () => {
	var isGameOver = false

	// Alle unfertigen Rects -> check if finish, Wenn ja -> check if balls inside
	for (var rect in state.rects){
		if (!state.rects[rect].finished){
			state.rects[rect].CheckIfFinish()
			state.rects[rect].CheckIfBalls()
		}
	}
	
	for (var line in state.lines){
		if ((state.lines[line].finished1 === true) && (state.lines[line].finished2 === true)){}else{
			// Unfertige Linien verlängern
			state.lines[line].xPrev = state.lines[line].x
			state.lines[line].yPrev = state.lines[line].y
			if (state.lines[line].rotation === 1){
				state.lines[line].y1 -= Settings.lineSpeed
				state.lines[line].y2 += Settings.lineSpeed
			}else{
				state.lines[line].x1 -= Settings.lineSpeed
				state.lines[line].x2 += Settings.lineSpeed
			}
			
			for (var line2 in state.lines){
				if ((line !== line2)&&(state.lines[line].rotation !== state.lines[line2].rotation)){
					// Eine Seite Verlängerung trifft auf Linie
					if (Geometrics.doTwoLinesIntersect(state.lines[line2].x1, state.lines[line2].y1, state.lines[line2].x2, state.lines[line2].y2, state.lines[line].x1, state.lines[line].y1, state.lines[line].x1Prev, state.lines[line].y1Prev)){
						if (state.lines[line].rotation === -1){
							state.lines[line].x1 = state.lines[line2].x1
						}else{
							state.lines[line].y1 = state.lines[line2].y1
						}
						state.lines[line].finished1 = true
					}
					// Andere Seite Verlängerung trifft auf Linie
					if (Geometrics.doTwoLinesIntersect(state.lines[line2].x1, state.lines[line2].y1, state.lines[line2].x2, state.lines[line2].y2, state.lines[line].x2, state.lines[line].y2, state.lines[line].x2Prev, state.lines[line].y2Prev)){
						if (state.lines[line].rotation === -1){
							state.lines[line].x2 = state.lines[line2].x1
						}else{
							state.lines[line].y2 = state.lines[line2].y1
						}
						state.lines[line].finished2 = true
					}
				}
			}
		}
	}
	for (var ball in state.balls){
		// Ball bewegen
		state.balls[ball].xPrev = state.balls[ball].x
		state.balls[ball].yPrev = state.balls[ball].y
		state.balls[ball].x = state.balls[ball].x + state.balls[ball].xDelta
		state.balls[ball].y = state.balls[ball].y + state.balls[ball].yDelta

		for (var line in state.lines){
			if (Geometrics.doTwoLinesIntersect(state.lines[line].x1, state.lines[line].y1, state.lines[line].x2, state.lines[line].y2, state.balls[ball].xPrev, state.balls[ball].yPrev, state.balls[ball].x, state.balls[ball].y)){
				if (state.lines[line].finished1 && state.lines[line].finished2){
					// Ball spiegeln
					var lineSide, lineKoord
					if (state.lines[line].rotation === 1){
						lineKoord = state.lines[line].x1
						if (lineKoord < state.balls[ball].x){
							lineSide = 'right'
						}else{
							lineSide = 'left'
						}
					}else{
						lineKoord = state.lines[line].y1
						if (lineKoord < state.balls[ball].y){
							lineSide = 'bottom'
						}else{
							lineSide = 'top'
						}
					}
					var result = Geometrics.spiegelBallanLinie(state.balls[ball].x, state.balls[ball].y, state.balls[ball].xDelta, state.balls[ball].yDelta, lineSide, lineKoord)
					state.balls[ball].x = result[0]
					state.balls[ball].y = result[1]
					state.balls[ball].xDelta = result[2]
					state.balls[ball].yDelta = result[3]
				}else{
					isGameOver = true
				}
			}
		}
	}

	// Berechne wie viel Prozent gedeckt sind
	var covered = 0
	for (var rect in state.rects){
		if (state.rects[rect].active && !state.rects[rect].hasBalls && state.rects[rect].finished){
			covered += state.rects[rect].height*state.rects[rect].width
		}
	}

	// Check if Win, GameOver, oder weiterspielen
	if (isGameOver){
		gameOver()
	}else{
		state.coveredPercentage = covered/(Settings.fieldWidth*Settings.fieldHeight)
		if (state.coveredPercentage > Settings.neededPercentage){
			Settings.anzBalls++
			init()
		}else{
			draw()
			setTimeout(calcluateNextStep, Settings.redrawInterval)
		}
	}
}

const gameOver = () => {
	var highscore = JSON.parse(localStorage.getItem('highscores'))
	if (Settings.anzBalls > highscore[4].score){
		var person = prompt('Game Over! Neuer Highscore! Und dein Name ist?', Settings.lastHighscorer)
		Settings.lastHighscorer = person
		highscore.pop()
		highscore.push({name:person, score:Settings.anzBalls})
		highscore.sort((a,b)=>{ return (b.score-a.score) })
		localStorage.setItem('highscores', JSON.stringify(highscore))
		if (window.confirm('Nochmal?')){
			Settings.anzBalls = 1
			init()
		}
	}else{
		if (window.confirm('Nochmal?')){
			Settings.anzBalls = 1
			init()
		}		
	}
}

const drawLeaderboard = () => {
	var highscore = JSON.parse(localStorage.getItem('highscores'))
	var ul = document.getElementById('highscore')
	while (ul.hasChildNodes()) {
	    ul.removeChild(ul.lastChild)
	}
	for (var person in highscore){
		var spanName = document.createElement('span')
		var textName = document.createTextNode(highscore[person].name)
		spanName.appendChild(textName)

		var spanScore = document.createElement('span')
		var textScore = document.createTextNode('('+highscore[person].score+')')
		spanScore.appendChild(textScore)

		var li = document.createElement('li')
		li.appendChild(spanName)
		li.appendChild(spanScore)
		ul.appendChild(li)
	}
}

const init = () => {
	state = {
		player : {
			x : Math.floor(Settings.fieldWidth/2)+.5,
			y : Math.floor(Settings.fieldHeight/2)+.5,
			rotation : 1,
			line : [{
				x : function () {
					if (state.player.rotation === 1){
						return state.player.x
					}else{
						return state.player.x-.9
					}
				},
				y : function () {
					if (state.player.rotation === 1){
						return state.player.y-.9
					}else{
						return state.player.y
					}
				}
			},{
				x : function () {
					if (state.player.rotation === 1){
						return state.player.x
					}else{
						return state.player.x+.9
					}
				},
				y : function () {
					if (state.player.rotation === 1){
						return state.player.y+.9
					}else{
						return state.player.y
					}
				}
			}]
		},
		balls : [],
		lines : [],
		rects :[],
		coveredPercentage : 0
	}
	var i = 1
	while (i <= Settings.anzBalls){
		state.balls.push(new Ball())
		i++
	}
	state.lines.push(new Line(0, 0, Settings.fieldWidth, 0, -1, true, true))
	state.lines.push(new Line(0, 0, 0, Settings.fieldHeight, 1, true, true))
	state.lines.push(new Line(0, Settings.fieldHeight, Settings.fieldWidth, Settings.fieldHeight, -1, true, true))
	state.lines.push(new Line(Settings.fieldWidth, 0, Settings.fieldWidth, Settings.fieldHeight, 1, true, true))
	state.rects.push(new Rect(0, 0, Settings.fieldWidth, Settings.fieldHeight, 0));

	drawLeaderboard()
	setTimeout(calcluateNextStep, Settings.redrawInterval)
}

const doesRectContainDot = (rect,x,y) => {
	return rect.x <= x && x <= rect.x + rect.width && rect.y <= y && y <= rect.y + rect.height
}

const doesLineContainDot = (line,x,y) => {
	deltax = line.x2 - line.x1
	if (deltax == 0){
		liesInXDir = (x == line.x1)
	}else{
		t = (x - line.x1) / deltax
		liesInXDir = (t >= 0 && t <= 1)
	}
	if (liesInXDir){
    	deltay = line.y2 - line.y1
		if (deltay == 0){
			return (y == line.y1)
		}else{
			t = (y - line.y1) / deltay
			return (t >= 0 && t <= 1)
		}
	}else{
    	return false
    }
}

var Ball = function(){
	this.x = Settings.fieldWidth/2+.5
	this.y = Settings.fieldHeight/2+.5
	this.xPrev = Settings.fieldWidth/2+.5
	this.yPrev = Settings.fieldHeight/2+.5
	this.speed = Settings.ballSpeed
	this.xDelta = this.speed*Math.random()*(Math.round(Math.random()) * 2 - 1)
	this.yDelta = Math.sqrt(this.speed*this.speed-this.xDelta*this.xDelta)*(Math.round(Math.random()) * 2 - 1)
}

var Line = function(x1,y1,x2,y2,r,f1,f2){
	this.x1 = x1
	this.y1 = y1
	this.x2 = x2
	this.y2 = y2
	this.x1Prev = x1
	this.y1Prev = y1
	this.x2Prev = x2
	this.y2Prev = y2
	this.rotation = r
	this.finished1 = f1
	this.finished2 = f2
}

var Rect = function(x, y, width, height, relatedLine){
	this.x = x
	this.y = y
	this.width = width
	this.height = height
	this.hasBalls = true
	this.relatedLine = relatedLine
	this.active = true
	this.finished = false
}
Rect.prototype.CheckIfFinish = function(){
	if (state.lines[this.relatedLine].finished1 && state.lines[this.relatedLine].finished2){
		this.finished = true
	}
}
Rect.prototype.CheckIfBalls = function(){
	this.hasBalls = false
	for (var ball in state.balls){
		if (doesRectContainDot(this, state.balls[ball].x, state.balls[ball].y)){
			this.hasBalls = true
		}
	}
}

init()

document.body.onkeydown = (e) => {
	var evtobj = window.event ? event : e
	var playerMoveFactor = 1
	if (evtobj.altKey){
		playerMoveFactor = 6
	}
	switch (e.keyCode){
		case 32:
			//draw Line
			var possibleLocation = true
			for (var line in state.lines){
				if (doesLineContainDot(state.lines[line], state.player.x, state.player.y)){
					possibleLocation = false
				}
			}
			if (possibleLocation && (state.lines.filter((line)=>{return ((line.finished1)&&(line.finished2))}).length === state.lines.length)){
				state.lines.push(new Line(state.player.line[0].x(),state.player.line[0].y(),state.player.line[1].x(),state.player.line[1].y(), state.player.rotation, false, false))
				for (var rect in state.rects){
					if (state.rects[rect].active){
						if (doesRectContainDot(state.rects[rect], state.player.x, state.player.y)){
							var newx1, newy1, newwidth1, newheight1
							var newx2, newy2, newwidth2, newheight2
							if (state.player.rotation === 1){
								newx1 = state.rects[rect].x
								newy1 = state.rects[rect].y
								newwidth1 = Math.abs(state.rects[rect].x - state.player.x)
								newheight1 = state.rects[rect].height
	
								newx2 = state.player.x
								newy2 = state.rects[rect].y
								newwidth2 = Math.abs(state.rects[rect].width-newwidth1)
								newheight2 = state.rects[rect].height
							}else{
								newx1 = state.rects[rect].x
								newy1 = state.rects[rect].y
								newwidth1 = state.rects[rect].width
								newheight1 = Math.abs(state.rects[rect].y - state.player.y)
								
								newx2 = state.rects[rect].x
								newy2 = state.player.y
								newwidth2 = state.rects[rect].width	
								newheight2 = Math.abs(state.rects[rect].height-newheight1)
							}
							var rect1 = new Rect(newx1, newy1, newwidth1, newheight1, state.lines.length-1)
							var rect2 = new Rect(newx2, newy2, newwidth2, newheight2, state.lines.length-1)
							state.rects[rect].active = false	
							state.rects.push(rect1)
							state.rects.push(rect2)
						}
					}
				}
			}
		break
		case 82:
			//rotate
			state.player.rotation *= -1
			console.log(state)
		break
		case 37:
			//left
			state.player.x -= playerMoveFactor
			if (state.player.x < 0){state.player.x = 0}
		break
		case 39:
			//right
			state.player.x += playerMoveFactor
			if (state.player.x > Settings.fieldWidth){state.player.x = Settings.fieldWidth}
		break
		case 38:
			//up
			state.player.y -= playerMoveFactor
			if (state.player.y < 0){state.player.y = 0}
		break
		case 40:
			//down
			state.player.y += playerMoveFactor
			if (state.player.y > Settings.fieldHeight){state.player.y = Settings.fieldHeight}
		break
	}
}
