const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function getAuthToken(): string | null {
  return localStorage.getItem('auth_token')
}

function getHeaders() {
  const token = getAuthToken()
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  }
}

// ─── Tutor APIs ─────────────────────────────────────────────

export async function sendTutorMessage({
  message,
  user_id,
  history = [],
  skill_id,
  skill_tree_id,
}: {
  message: string
  user_id: string
  history?: Array<{ role: string; content: string }>
  skill_id?: string
  skill_tree_id?: string
}) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/tutor/chat`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        message,
        history,
        skill_id,
        skill_tree_id,
      }),
    })

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized - please login again')
      }
      throw new Error('Failed to get response from AI backend')
    }

    const data = await response.json()
    return {
      response: data.data?.response || 'No response generated',
      model: data.data?.model || 'phi',
      context_used: data.data?.context_used || false,
    }
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : 'Backend error'
    )
  }
}

export async function submitAnswer({
  skill_tree_id,
  skill_id,
  question,
  answer,
}: {
  skill_tree_id: string
  skill_id: string
  question: string
  answer: string
}) {
  const response = await fetch(`${API_BASE_URL}/api/tutor/answer`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ skill_tree_id, skill_id, question, answer }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.message || 'Failed to evaluate answer')
  }

  const data = await response.json()
  return data.data
}

export async function generateQuestion({
  skill_tree_id,
  skill_id,
}: {
  skill_tree_id: string
  skill_id: string
}) {
  const response = await fetch(`${API_BASE_URL}/api/tutor/question`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ skill_tree_id, skill_id }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.message || 'Failed to generate question')
  }

  const data = await response.json()
  return data.data
}

// ─── Chat APIs ──────────────────────────────────────────────

export async function getChatHistory() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat/history`, {
      headers: getHeaders(),
    })

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized - please login again')
      }
      throw new Error('Failed to fetch chat history')
    }

    const data = await response.json()
    return data.data || []
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : 'Backend error'
    )
  }
}

// ─── Course APIs ────────────────────────────────────────────

export async function getCourses() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/course`, {
      headers: getHeaders(),
    })

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized - please login again')
      }
      throw new Error('Failed to fetch courses')
    }

    const data = await response.json()
    return data.data || []
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : 'Backend error'
    )
  }
}

export async function getFacultyCourses(facultyId: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/course/faculty/${facultyId}`, {
      headers: getHeaders(),
    })
    if (!response.ok) throw new Error('Failed to fetch faculty courses')
    const data = await response.json()
    return data.data || []
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Backend error')
  }
}

export async function createCourse(courseData: any) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/course`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(courseData),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.message || 'Failed to create course')
    }
    const data = await response.json()
    return data.data
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Backend error')
  }
}

export async function deleteCourse(id: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/course/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    })
    if (!response.ok) throw new Error('Failed to delete course')
    return true
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Backend error')
  }
}

// ─── Upload APIs ────────────────────────────────────────────

export async function uploadFile(file: File) {
  const token = getAuthToken()
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_BASE_URL}/api/upload`, {
    method: 'POST',
    headers: {
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
    body: formData,
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.message || 'Upload failed')
  }

  const data = await response.json()
  return data.data
}

export async function getUploads() {
  const response = await fetch(`${API_BASE_URL}/api/upload`, {
    headers: getHeaders(),
  })

  if (!response.ok) throw new Error('Failed to fetch uploads')
  const data = await response.json()
  return data.data || []
}

export async function getUploadStatus(uploadId: string) {
  const response = await fetch(`${API_BASE_URL}/api/upload/${uploadId}`, {
    headers: getHeaders(),
  })

  if (!response.ok) throw new Error('Failed to fetch upload status')
  const data = await response.json()
  return data.data
}

// ─── Skill Tree APIs ───────────────────────────────────────

export async function getSkillTrees() {
  const response = await fetch(`${API_BASE_URL}/api/skill-tree`, {
    headers: getHeaders(),
  })

  if (!response.ok) throw new Error('Failed to fetch skill trees')
  const data = await response.json()
  return data.data || []
}

export async function getSkillTree(id: string) {
  const response = await fetch(`${API_BASE_URL}/api/skill-tree/${id}`, {
    headers: getHeaders(),
  })

  if (!response.ok) throw new Error('Failed to fetch skill tree')
  const data = await response.json()
  return data.data
}

export async function deleteSkillTree(id: string) {
  const response = await fetch(`${API_BASE_URL}/api/skill-tree/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  })

  if (!response.ok) throw new Error('Failed to delete skill tree')
  return true
}

// ─── Recommendation APIs ───────────────────────────────────

export async function getRecommendations(skillTreeId?: string) {
  const url = skillTreeId
    ? `${API_BASE_URL}/api/tutor/recommendations?skill_tree_id=${skillTreeId}`
    : `${API_BASE_URL}/api/tutor/recommendations`

  const response = await fetch(url, {
    headers: getHeaders(),
  })

  if (!response.ok) throw new Error('Failed to fetch recommendations')
  const data = await response.json()
  return data.data
}
