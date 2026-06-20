import '@testing-library/jest-dom'
import { vi, afterEach } from 'vitest'
import { webcrypto } from 'node:crypto'

if (!globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    configurable: true,
  })
}

class MockCanvas2DContext {
  fillStyle = ''
  strokeStyle = ''
  lineWidth = 0
  font = ''
  textBaseline = ''

  fillRect = vi.fn()
  clearRect = vi.fn()
  drawImage = vi.fn()
  putImageData = vi.fn()
  createImageData = vi.fn((_w: number, _h: number) => ({
    data: new Uint8ClampedArray(4 * (_w || 100) * (_h || 100)),
    width: _w || 100,
    height: _h || 100,
  }))
  getImageData = vi.fn((x: number, y: number, w: number, h: number) => ({
    data: new Uint8ClampedArray(4 * w * h),
    width: w,
    height: h,
  }))
  beginPath = vi.fn()
  closePath = vi.fn()
  moveTo = vi.fn()
  lineTo = vi.fn()
  quadraticCurveTo = vi.fn()
  stroke = vi.fn()
  fill = vi.fn()
  save = vi.fn()
  restore = vi.fn()
  setLineDash = vi.fn()
  fillText = vi.fn()
  measureText = vi.fn(() => ({ width: 0 }))
}

vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
  ((contextId: string) => {
    if (contextId === '2d') {
      return new MockCanvas2DContext() as unknown as CanvasRenderingContext2D
    }
    return null
  }) as HTMLCanvasElement['getContext']
)

HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,bW9ja0ltYWdl')

global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
global.URL.revokeObjectURL = vi.fn()

class MockImageBitmap {
  width: number
  height: number
  constructor(width = 200, height = 100) {
    this.width = width
    this.height = height
  }
  close() {}
}
;(globalThis as any).ImageBitmap = MockImageBitmap

global.createImageBitmap = vi.fn(
  async () => new (globalThis as any).ImageBitmap(200, 100)
)

Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: vi.fn().mockResolvedValue(undefined) },
  writable: true,
  configurable: true,
})

Object.defineProperty(window, 'location', {
  value: { href: '' },
  writable: true,
})

global.fetch = vi.fn().mockResolvedValue({
  ok: true,
  blob: vi.fn().mockResolvedValue(new Blob(['mock'], { type: 'image/png' })),
  json: vi.fn().mockResolvedValue({ bitcoin: { usd: 50000 } }),
} as unknown as Response)

afterEach(() => {
  if (typeof localStorage !== 'undefined' && typeof localStorage.clear === 'function') {
    localStorage.clear()
  }
  vi.clearAllMocks()
})