function geometrtic() {
	return {
		doTwoLinesIntersect : (a,b,c,d,p,q,r,s) => {
			// returns true iff the line from (a,b)->(c,d) intersects with (p,q)->(r,s)
			var det, gamma, lambda
			det = (c - a) * (s - q) - (r - p) * (d - b)
			if (det === 0) {
				return false
			} else {
			    lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det
			    gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det
			    return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1)
			}
			state.lines[line2].x1, state.lines[line2].y1, state.lines[line2].x2, state.lines[line2].y2, state.lines[line].x1, state.lines[line].y1, state.lines[line].x1Prev, state.lines[line].y1Prev
		},
		spiegelBallanLinie : (x,y,xDelta,yDelta,lineSide,lineKoord) => {
			//x,y,xDelta,yDelta, = > Wären die neun Daten vom Ball
			//rotation: 1->vertical, -1->horizontal
			//lineSide: Wich side the Line is on 'right', 'left', 'top', 'bottom'
			//lineKoord: Entsprechende Koordinate der Linie (x, wenn horiz Line, y, wenn vertic Line)
			//returns neues: [x, y, xDelta, yDelta]
			var newx = x
			var newy = y
			var newxDelta = xDelta
			var newyDelta = yDelta
			switch (lineSide){
				case 'right':
					newx = lineKoord-(x-lineKoord)
					newxDelta *= -1
				break
				case 'left':
					newx = lineKoord+(lineKoord-x)
					newxDelta *= -1
				break
				case 'bottom':
					newy = lineKoord-(y-lineKoord)
					newyDelta *= -1			
				break
				case 'top':
					newy = lineKoord+(lineKoord-y)
					newyDelta *= -1
				break
			}
			return [newx, newy, newxDelta, newyDelta]
		}
	}
}