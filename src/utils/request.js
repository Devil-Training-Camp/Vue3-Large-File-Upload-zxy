import axios from 'axios'
import qs from 'qs'

const request = axios.create()
request.defaults.baseURL = 'http://127.0.0.1:8888'
request.defaults.headers['Content-Type'] = 'multipart/form-data' 
request.defaults.transformRequest = (data, headers) => {
  const contentType = headers['Content-Type']
  if(contentType === 'application/x-www-form-urlencoded') return qs.stringify(data)
  return data
}

request.interceptors.response.use(response => {
  return response.data
}, reason => {
  return Promise.reject(reason)
})

export default request