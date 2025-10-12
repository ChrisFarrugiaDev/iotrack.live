import { ref, type Ref } from 'vue'

let _tick: Ref<number> | null = null
let _started = false

export function useNowTick(intervalMs = 1000) {
  if (!_tick) _tick = ref(Date.now())
  if (!_started) {
    _started = true
    setInterval(() => { _tick!.value = Date.now() }, intervalMs)
  }
  return _tick
}
