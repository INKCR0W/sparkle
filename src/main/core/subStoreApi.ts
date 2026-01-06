import axios from 'axios'
import { subStorePort } from '../resolve/server'
import { getAppConfig } from '../config'

export async function subStoreSubs(): Promise<SubStoreSub[]> {
  const { useCustomSubStore = false, customSubStoreUrl = '' } = await getAppConfig()
  const port = subStorePort
  if (!useCustomSubStore && !port) {
    throw new Error('Sub-Store is not running')
  }
  const baseUrl = useCustomSubStore ? customSubStoreUrl : `http://127.0.0.1:${port}`
  const res = await axios.get(`${baseUrl}/api/subs`, { responseType: 'json' })
  return res.data.data as SubStoreSub[]
}

export async function subStoreCollections(): Promise<SubStoreSub[]> {
  const { useCustomSubStore = false, customSubStoreUrl = '' } = await getAppConfig()
  const port = subStorePort
  if (!useCustomSubStore && !port) {
    throw new Error('Sub-Store is not running')
  }
  const baseUrl = useCustomSubStore ? customSubStoreUrl : `http://127.0.0.1:${port}`
  const res = await axios.get(`${baseUrl}/api/collections`, { responseType: 'json' })
  return res.data.data as SubStoreSub[]
}
