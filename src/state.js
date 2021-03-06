import Rx from 'rx'
import emitter from './emitter'

const DEFAULT_STATE = {
  world: {
    pos: [-120, 0]
  },
  bg: {
    width: 1280,
    height: 600,
    asset: 'test2',
    scale: 1,
   //tiling: {
      //scale: 0.3
    //}
  },
  assets: {
    test2: './test2.png',
    test: './t.jpg', //'./test.jpg',
    monsters: './monsters-32x32.png'
  },
  walkable: {
    bounds: [
      [199, 689], [2, 731], [3, 758],
      [641, 788], [582, 700], [605, 617],
      [844, 628], [829, 595], [516, 601],
      [488, 645], [438, 694], [365, 749],
      [206, 732] ],
    holes: []
  },
  walkbehind: {
    bounds: [
      [626, 612], [604, 608], [602, 590],
      [590, 584], [588, 554], [556, 548],
      [554, 512], [546, 506], [548, 500],
      [554, 500], [558, 474], [836, 460],
      [842, 630], [626, 680] ],
    holes: [
      [ [652, 538], [652, 520], [656, 516],
        [672, 516], [670, 538]
      ], [
        [688, 538], [688, 516], [706, 514],
        [706, 538]
      ], [
        [568, 536], [568, 516], [590, 514],
        [588, 536]
      ]
    ]
  },
  mainChar: {
    spritesheet: {
      asset: 'monsters',
      anim: {
        down: {
          startFrame: [0, 1],
          width: 32,
          height: 32,
          frames: 3
        },
        right: {
          startFrame: [3, 1],
          width: 32,
          height: 32,
          frames: 3
        },
        up: {
          startFrame: [6, 1],
          width: 32,
          height: 32,
          frames: 3
        },
        left: {
          startFrame: [9, 1],
          width: 32,
          height: 32,
          frames: 3
        },
        idle: {
          startFrame: [1,1],
          width: 32,
          height: 32,
          frames: 1
        }
      }
    },
    pos: [150, 750],
    scale: 3
  }
}


if (!localStorage.getItem('3dsh:last_state')) {
  localStorage.setItem('3dsh:last_state', JSON.stringify(DEFAULT_STATE))
}

const State = Rx.Observable
  .just(JSON.parse(localStorage.getItem('3dsh:last_state')))
  .merge(Rx.Observable.fromEvent(emitter, 'update_state'))
  .merge(Rx.Observable.fromEvent(emitter, 'reset_state').map(
    _ => DEFAULT_STATE
  ))

Rx.Observable.merge(
  Rx.Observable.fromEvent(emitter, 'update_state_walkable').withLatestFrom(
    State, (walkable, state) => ({...state, walkable})
  ),
  Rx.Observable.fromEvent(emitter, 'update_state_assets').withLatestFrom(
    State, (assets, state) => ({...state, assets})
  ),
  Rx.Observable.fromEvent(emitter, 'update_state_mainChar').withLatestFrom(
    State, (mainChar, state) => ({...state, mainChar})
  )
).subscribe(state => emitter.emit('update_state', state))

Rx.Observable
  .fromEvent(emitter, 'save_state')
  .withLatestFrom(State, (_, state) => state)
  .subscribe(
    s => localStorage.setItem('3dsh:last_state', JSON.stringify(s))
  )

export default State;
