import type { ICache } from './types'

class ListNode<K, V> {
  constructor(
    public key: K,
    public value: V,
    public prev: ListNode<K, V> | null = null,
    public next: ListNode<K, V> | null = null
  ) {}
}

export interface LRUCacheOptions {
  readonly maxSize?: number

  readonly ttl?: number

  readonly onEvict?: <K, V>(key: K, value: V) => void
}

interface CacheEntry<V> {
  readonly value: V
  readonly expireAt?: number
}

export class LRUCache<K, V> implements ICache<K, V> {
  private readonly maxSize: number
  private readonly ttl?: number
  private readonly onEvict?: (key: K, value: V) => void

  private readonly cache = new Map<K, ListNode<K, CacheEntry<V>>>()
  private head: ListNode<K, CacheEntry<V>> | null = null
  private tail: ListNode<K, CacheEntry<V>> | null = null

  constructor(options: LRUCacheOptions = {}) {
    this.maxSize = options.maxSize ?? 100
    this.ttl = options.ttl
    this.onEvict = options.onEvict

    if (this.maxSize <= 0) {
      throw new Error('maxSize must be greater than 0')
    }
  }

  get size(): number {
    return this.cache.size
  }

  has(key: K): boolean {
    const node = this.cache.get(key)
    if (!node) {
      return false
    }

    if (this.isExpired(node.value)) {
      this.delete(key)
      return false
    }

    return true
  }

  get(key: K): V | undefined {
    const node = this.cache.get(key)
    if (!node) {
      return undefined
    }

    if (this.isExpired(node.value)) {
      this.delete(key)
      return undefined
    }

    this.moveToHead(node)

    return node.value.value
  }

  set(key: K, value: V): void {
    const existingNode = this.cache.get(key)

    const entry: CacheEntry<V> = {
      value,
      expireAt: this.ttl ? Date.now() + this.ttl : undefined
    }

    if (existingNode) {
      existingNode.value = entry
      this.moveToHead(existingNode)
    } else {
      const newNode = new ListNode(key, entry)
      this.cache.set(key, newNode)
      this.addToHead(newNode)

      if (this.cache.size > this.maxSize) {
        this.removeTail()
      }
    }
  }

  delete(key: K): boolean {
    const node = this.cache.get(key)
    if (!node) {
      return false
    }

    this.removeNode(node)
    this.cache.delete(key)

    if (this.onEvict) {
      this.onEvict(key, node.value.value)
    }

    return true
  }

  clear(): void {
    if (this.onEvict) {
      for (const [key, node] of this.cache) {
        this.onEvict(key, node.value.value)
      }
    }

    this.cache.clear()
    this.head = null
    this.tail = null
  }

  keys(): K[] {
    const keys: K[] = []
    const keysToDelete: K[] = []
    let current = this.head

    while (current) {
      if (this.isExpired(current.value)) {
        keysToDelete.push(current.key)
      } else {
        keys.push(current.key)
      }
      current = current.next
    }

    keysToDelete.forEach((key) => this.delete(key))

    return keys
  }

  values(): V[] {
    const values: V[] = []
    const keysToDelete: K[] = []
    let current = this.head

    while (current) {
      if (this.isExpired(current.value)) {
        keysToDelete.push(current.key)
      } else {
        values.push(current.value.value)
      }
      current = current.next
    }

    keysToDelete.forEach((key) => this.delete(key))

    return values
  }

  entries(): Array<[K, V]> {
    const entries: Array<[K, V]> = []
    const keysToDelete: K[] = []
    let current = this.head

    while (current) {
      if (this.isExpired(current.value)) {
        keysToDelete.push(current.key)
      } else {
        entries.push([current.key, current.value.value])
      }
      current = current.next
    }

    keysToDelete.forEach((key) => this.delete(key))

    return entries
  }

  prune(maxCleanup = 10): number {
    let count = 0
    const keys = Array.from(this.cache.keys())

    for (const key of keys) {
      if (count >= maxCleanup) {
        break
      }

      const node = this.cache.get(key)
      if (node && this.isExpired(node.value)) {
        this.delete(key)
        count++
      }
    }

    return count
  }

  private isExpired(entry: CacheEntry<V>): boolean {
    if (!entry.expireAt) {
      return false
    }
    return Date.now() > entry.expireAt
  }

  private moveToHead(node: ListNode<K, CacheEntry<V>>): void {
    this.removeNode(node)
    this.addToHead(node)
  }

  private addToHead(node: ListNode<K, CacheEntry<V>>): void {
    node.prev = null
    node.next = this.head

    if (this.head) {
      this.head.prev = node
    }

    this.head = node

    if (!this.tail) {
      this.tail = node
    }
  }

  private removeNode(node: ListNode<K, CacheEntry<V>>): void {
    if (node.prev) {
      node.prev.next = node.next
    } else {
      this.head = node.next
    }

    if (node.next) {
      node.next.prev = node.prev
    } else {
      this.tail = node.prev
    }
  }

  private removeTail(): void {
    if (!this.tail) {
      return
    }

    const key = this.tail.key
    const value = this.tail.value.value

    this.removeNode(this.tail)
    this.cache.delete(key)

    if (this.onEvict) {
      this.onEvict(key, value)
    }
  }
}

export function createLRUCache<K, V>(options?: LRUCacheOptions): ICache<K, V> {
  return new LRUCache<K, V>(options)
}
