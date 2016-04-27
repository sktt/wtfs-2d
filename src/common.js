import {Observable} from 'rx'

/**
 * asset loader should implement
 */
type Loader = {
  add(key: string, url: string): Loader,
  load(cb: (l: Loader, resources: {}) => any): void
}

// -----------------------------------------------------------------------------

/**
 * create observer helpers
 */
export const create = {}

/**
 * Static observers cold or hot
 */
export const obs = {}

/**
 * Add assets to loader and return a stream that emits when a Loader is
 * completed. Emits also for when no assets are sent
 */
create.resources = (loader: Loader, assets) => {

  if(!Object.keys(assets).length) {
    // no assets, emit empty
    return Observable.just({})
  }
  Object.keys(assets).reduce(
    // Loader#add is chainable ^_^_^
    (loader, key) => loader.add(key, assets[key]),
    loader
  )
  return Observable.fromCallback(
    loader.load, loader, (_, resources) => resources
  )()
  // share one instance
  .publish()
  .refCount()
}

/**
 * Emits when dom is ready
 */
obs.domReady = Observable
  .merge(
    Observable.just(),
    Observable.fromEvent(document, 'readystatechange')
  )
  .map(_ => document.readyState)
  .filter(s => s === 'interactive')
  .take(1)

/**
 * Emits window size
 */
obs.resize = Observable
  .merge(
    Observable.just(),
    Observable.fromEvent(window, 'resize')
  )
  .map(_ => [window.innerWidth, window.innerHeight])

/**
 * Emits root dom node when it's ready
 */
obs.domRoot = obs.domReady.flatMap(Observable
  .just(document.body)
  .map(body => {
    body.style.backgroundColor = '#000'
    body.style.display = 'flex'
    body.style.justifyContent = 'center'
    body.style.height = '100%'
    body.style.margin = '0'
    body.style.flexDirection = 'column'
    body.parentNode.style.height = '100%'
    return body
  })
)
// there is only one root
.take(1)
// and it should be shared ref
.publish()
.refCount()

/**
 * Emits on every frame with delta time
 */
obs.tick = Observable.create(observer => {
  let requestId
  let startTime = Date.now()
  const callback = (currentTime) => {
    // If we have not been disposed, then request the next frame
    if (requestId) {
      requestId = window.requestAnimationFrame(callback)
    }

    observer.onNext(Math.max(0, currentTime - startTime))
    startTime = currentTime
  }

  requestId = window.requestAnimationFrame(callback)

  return () => {
    if (requestId) {
      let r = requestId
      requestId = undefined
      window.cancelAnimationFrame (r)
    }
  }
})

export default {create, obs}
