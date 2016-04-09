/*@flow*/

export class Vec2 {
  x: number;
  y: number;
  constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }

  arr(): number[] {
    return [this.x, this.y]
  }

  distSq(v: Vec2): number {
    const dx = v.x - this.x
    const dy = v.y - this.y
    return dx * dx + dy * dy
  }

  dist(v: Vec2): number {
    return Math.sqrt(this.distSq(v))
  }

  len(): number {
    return this.dist(Vec2.ORIGO)
  }

  norm(): Vec2 {
    const l = this.len()
    return new Vec2(this.x/l, this.y/l)
  }

  dot(v: Vec2): number {
    return this.x * v.x + this.y * v.y
  }

  scale(m: number): Vec2 {
    return new Vec2(this.x * m, this.y * m)
  }

  add(v: Vec2): Vec2 {
    return new Vec2(this.x + v.x, this.y + v.y)
  }

  sub(v: Vec2): Vec2 {
    return this.add(v.scale(-1))
  }

  equals(o: any): boolean {
    return this === o ||
      this.x === o.x && this.y === o.y
  }

  static fromArray(p: number[]): Vec2 {
    return new Vec2(p[0], p[1])
  }

  static ORIGO = new Vec2(0, 0)

  static INF = new Vec2(Infinity, Infinity)
}



// line ina twod space
export class Line2 {
  a: Vec2;
  b: Vec2;
  constructor(a, b) {
    this.a = a
    this.b = b
  }
  equals(o: any): boolean {
    return this === o || (this.a.equals(o.a) && this.b.equals(o.b))
  }

  centerPoint(): Vec2 {
    return this.a.add(this.b).scale(0.5)
  }

  dir(): Vec2 {
    return this.b.sub(this.a).norm()
  }

  len(): number {
    return this.a.dist(this.b)
  }

  intersects(l2: Line2): boolean {
    const s1x = this.b.x - this.a.x
    const s1y = this.b.y - this.a.y
    const s2x = l2.b.x - l2.a.x
    const s2y = l2.b.y - l2.a.y

    const s = (-s1y * (this.a.x - l2.a.x) + s1x * (this.a.y - l2.a.y)) / (-s2x * s1y + s1x * s2y)
    const t = ( s2x * (this.a.y - l2.a.y) - s2y * (this.a.x - l2.a.x)) / (-s2x * s1y + s1x * s2y)

    const eps = 0.00001
    return (0 < (s - eps) && (s + eps) < 1) && (0 < (t - eps) && (t + eps) < 1)
  }

  // Point on this line closest to x
  closestTo(x: Vec2): Vec2 {
    const v = this.dir()
    const s = x.dot(v) / v.dot(v)
    const l = this.len()

    if(s >= this.len()) {
      return this.b
    }

    if(s <= 0) {
      return this.a
    }

    return v.scale(x.dot(v) / v.dot(v)).add(this.a)
  }
  static fromArray(a, b) {
    return new Line2(Vec2.fromArray(a), Vec2.fromArray(b))
  }
}

export class Polygon {
  points: Vec2[];
  constructor(points) {
    this.points = points
    this.interior = [] // holes
  }

  serialize(): {} {
    return {
      bounds: this.points.map(p => p.arr()),
      holes: this.interior.map(hole => hole.points.map(p => p.arr()))
    }
  }

  getLoops() {
    const bounds = this.points.map(
      p => p.arr()
    )
    const holes = this.interior.map(
      h => h.points.map(
        p => p.arr()
      )
    )
    return [bounds].concat(holes || [])
  }

  isClockwise(): boolean {
    return this.area() > 0
  }

  area(): number {
    let area = 0
    const first = this.points[0]
    for(let i = 2; i < this.points.length; i++) {
      let p = this.points[i-1]
      let c = this.points[i]
      let e0 = first.sub(p)
      let e1 = first.sub(c)
      area += e0.x * e1.y - e0.y * e1.x
    }
    return area/2
  }

  sides(): Line2[] {
    return this.points.map((p1, i, ps) => new Line2(p1, ps[(i+1) % ps.length]))
  }

  addHole(polygon: Polygon): void {
    if (polygon.points.length < 2) {
      throw Error('Not a polygon')
    }
    if(!this.containsPolygon(polygon)) {
      throw Error('Trying to add interior polygon that is not contained in this')
    }

    this.interior = this.interior.concat(polygon)
  }

  containsPolygon(poly: Polygon): boolean {
    // this polygon contains `poly` when no side intersects with this and
    // one of `poly`s vertices are interior of this
    return this.contains(poly.points[0]) && !this.intersectsPoly(poly)
  }

  intersectsLine(line: Line2): boolean {
    return this.sides().some(
      l => l.intersects(line)
    ) || this.interior.some(
      hole => hole.intersectsLine(line)
    )
  }

  intersectsPoly(poly: Polygon): boolean {
    return poly.sides().some(
      l1 => this.sides().some(
        l2 => l1.intersects(l2)
      )
    ) || this.interior.some(
      hole => hole.intersectsPoly(poly)
    )
  }

  contains(test: Vec2, EPS = 0.1): boolean {

    // picked up at http://gamedev.stackexchange.com/questions/31741/adding-tolerance-to-a-point-in-polygon-test
    // this needs to handle holes .. if a point is on an edge to a hole then it will
    // appear to be in both the hole and the polygon
    let oldPoint = this.points[this.points.length - 1]
    let oldSqDist = oldPoint.distSq(test)
    let inside = false

    let left = null
    let right = null

    for (let i=0 ; i < this.points.length; i++) {
      let newPoint = this.points[i]
      let newSqDist = newPoint.distSq(test)

      if (oldSqDist + newSqDist + 2 * Math.sqrt(oldSqDist * newSqDist) -
          newPoint.distSq(oldPoint) < EPS) {
        return true
      }

      if (newPoint.x > oldPoint.x) {
        left = oldPoint
        right = newPoint
      } else {
        left = newPoint
        right = oldPoint
      }

      if ((newPoint.x < test.x) == (test.x <= oldPoint.x)
          && (test.y-left.y) * (right.x-left.x)
          < (right.y-left.y) * (test.x-left.x) ) {
        inside = !inside
      }

      oldPoint = newPoint
      oldSqDist = newSqDist
    }

    return (inside || this.points.some(p => p.equals(test))) &&
      !this.interior.some(hole => hole.contains(test))
  }

  // Gives the nearest point to `point` that is on the edge of the shape
  nearestEdgePoint(point: Vec2): Vec2 {
    let nearest = Vec2.INF
    this.points.forEach((p1, i, ps) => {
      const p2 = ps[(i+1) % ps.length]
      const near = new Line2(p1, p2).closestTo(point.sub(p1))
      if(near.dist(point) < nearest.dist(point)) {
        nearest = near
      }
    })
    const hole = this.interior.find(
      hole => hole.contains(point)
    )
    if(hole) {
      const near = hole.nearestEdgePoint(point)
      if(near.dist(point) < nearest.dist(point)) {
        nearest = near
      }
    }
    return nearest
  }

  nearestInside(point: Vec2): Vec2 {
    if(this.contains(point)) {
      return point
    }

    return this.nearestEdgePoint(point)
  }
}
