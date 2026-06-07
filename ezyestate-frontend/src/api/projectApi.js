import api from './axios'
export const getProjects   = (params) => api.get('/projects', { params })
export const getProjectById= (id)     => api.get(`/projects/${id}`)
export const getMyProjects = ()       => api.get('/projects/my-projects')
export const createProject = (data)   => api.post('/projects', data)
export const updateProject = (id, data)=> api.patch(`/projects/${id}`, data)
export const uploadImages  = (id, formData) => api.post(`/projects/${id}/upload-images`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
export const enquireProject= (id, data)=> api.post(`/projects/${id}/enquire`, data)
export const shortlistProject=(id)    => api.post(`/projects/${id}/shortlist`)
