export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function getAuthToken(): string | null {
  return sessionStorage.getItem('auth_token')
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

export async function getFacultyStats(facultyId: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/course/stats/${facultyId}`, {
      headers: getHeaders(),
    })
    if (!response.ok) throw new Error('Failed to fetch faculty stats')
    const data = await response.json()
    return data.data
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

export async function updateCourse(id: string, courseData: any) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/course/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(courseData),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.message || 'Failed to update course')
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

export async function generateCourse(prompt: string) {
  const response = await fetch(`${API_BASE_URL}/api/course/generate`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ prompt }),
  })
  if (!response.ok) throw new Error('Failed to generate course')
  const data = await response.json()
  return data.data
}

export async function enrollCourse(id: string) {
  const response = await fetch(`${API_BASE_URL}/api/course/${id}/enroll`, {
    method: 'POST',
    headers: getHeaders(),
  })
  if (!response.ok) throw new Error('Failed to enroll in course')
  const data = await response.json()
  return data.data
}

export async function getEnrolledCourses() {
  const response = await fetch(`${API_BASE_URL}/api/course/enrolled`, {
    headers: getHeaders(),
  })
  if (!response.ok) throw new Error('Failed to fetch enrolled courses')
  const data = await response.json()
  return data.data || []
}

export async function getEnrollmentStatus(id: string) {
  const response = await fetch(`${API_BASE_URL}/api/course/${id}/status`, {
    headers: getHeaders(),
  })
  if (!response.ok) throw new Error('Failed to fetch enrollment status')
  const data = await response.json()
  return data
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

export async function deleteUpload(uploadId: string) {
  const response = await fetch(`${API_BASE_URL}/api/upload/${uploadId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  })

  if (!response.ok) throw new Error('Failed to delete resource')
  return true
}

// ─── Study Plan APIs ──────────────────────────────────────────

export async function getStudySchedule() {
  const response = await fetch(`${API_BASE_URL}/api/plan/schedule`, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch schedule');
  const json = await response.json();
  return json.data;
}

export async function generateStudySchedule() {
  const response = await fetch(`${API_BASE_URL}/api/plan/generate`, {
    method: 'POST',
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Failed to generate schedule');
  const json = await response.json();
  return json.data;
}

export async function toggleTaskCompletion(planId: string, taskId: string, completed: boolean) {
  const response = await fetch(`${API_BASE_URL}/api/plan/task/${planId}/${taskId}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ completed })
  });
  if (!response.ok) throw new Error('Failed to update task');
  const json = await response.json();
  return json.data;
}

// ─── Assignment APIs ──────────────────────────────────────────

export async function submitAssignment(courseId: string, title: string, questionText: string, studentAnswer: string) {
  const response = await fetch(`${API_BASE_URL}/api/assignment/submit`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      course_id: courseId,
      title,
      question_text: questionText,
      student_answer: studentAnswer
    })
  });
  if (!response.ok) throw new Error('Failed to submit assignment');
  const json = await response.json();
  return json.data;
}

export async function evaluateAssignment(assignmentId: string) {
  const response = await fetch(`${API_BASE_URL}/api/assignment/evaluate/${assignmentId}`, {
    method: 'POST',
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Failed to evaluate assignment');
  const json = await response.json();
  return json.data;
}

export async function getStudentAssignments() {
  const response = await fetch(`${API_BASE_URL}/api/assignment/history`, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch assignments history');
  const json = await response.json();
  return json.data;
}

export async function getFacultySubmissions(courseId: string) {
  const response = await fetch(`${API_BASE_URL}/api/assignment/faculty/${courseId}`, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch faculty submissions');
  const json = await response.json();
  return json.data;
}

export async function overrideAssignmentScore(assignmentId: string, score: number) {
  const response = await fetch(`${API_BASE_URL}/api/assignment/${assignmentId}/override`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ score })
  });
  if (!response.ok) throw new Error('Failed to override score');
  const json = await response.json();
  return json.data;
}

// ─── Leaderboard APIs ─────────────────────────────────────────

export async function getLeaderboard() {
  const response = await fetch(`${API_BASE_URL}/api/leaderboard`, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch leaderboard');
  const json = await response.json();
  return json.data;
}

export async function getMyRank() {
  const response = await fetch(`${API_BASE_URL}/api/leaderboard/me`, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch rank');
  const json = await response.json();
  return json.data;
}

export async function getBadges() {
  const response = await fetch(`${API_BASE_URL}/api/leaderboard/badges`, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch badges');
  const json = await response.json();
  return json.data;
}

export async function getMyBadges() {
  const response = await fetch(`${API_BASE_URL}/api/leaderboard/badges/me`, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch my badges');
  const json = await response.json();
  return json.data;
}

// ─── Prediction APIs ─────────────────────────────────────────

export async function getMyRisk() {
  const response = await fetch(`${API_BASE_URL}/api/prediction/risk`, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch prediction risk');
  const json = await response.json();
  return json.data;
}

export async function getClassRisk(courseId: string) {
  const response = await fetch(`${API_BASE_URL}/api/prediction/class/${courseId}`, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch class risk');
  const json = await response.json();
  return json.data;
}

// ─── Room APIs ───────────────────────────────────────────────

export async function createRoom(name: string, pdf_url: string) {
  const response = await fetch(`${API_BASE_URL}/api/rooms`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ name, pdf_url }),
  });
  if (!response.ok) throw new Error('Failed to create room');
  const json = await response.json();
  return json.data;
}

export async function getRoom(roomCode: string) {
  const response = await fetch(`${API_BASE_URL}/api/rooms/${roomCode}`, {
    headers: getHeaders(),
  });
  if (!response.ok) throw new Error('Failed to fetch room');
  const json = await response.json();
  return json.data;
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

// ─── Streaming APIs ────────────────────────────────────────

export async function streamTutorMessage({
  message,
  skill_id,
  skill_tree_id,
  onChunk,
  onDone,
  onError,
}: {
  message: string
  skill_id?: string
  skill_tree_id?: string
  onChunk: (text: string) => void
  onDone?: (data: { model: string; tokens_used: number }) => void
  onError?: (error: string) => void
}) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/tutor/stream`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ message, skill_id, skill_tree_id }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.message || 'Streaming failed')
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) throw new Error('No response body')

    let fullText = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const text = decoder.decode(value, { stream: true })
      const lines = text.split('\n').filter((l) => l.startsWith('data: '))

      for (const line of lines) {
        try {
          const data = JSON.parse(line.slice(6))
          if (data.type === 'chunk') {
            fullText += data.text
            onChunk(data.text)
          } else if (data.type === 'done') {
            onDone?.(data)
          } else if (data.type === 'error') {
            onError?.(data.message)
          }
        } catch {
          // partial line, skip
        }
      }
    }

    return fullText
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Streaming failed'
    onError?.(msg)
    throw new Error(msg)
  }
}

// ─── Agent APIs ────────────────────────────────────────────

export async function getSkillContent(skill_tree_id: string, skill_id: string) {
  const response = await fetch(`${API_BASE_URL}/api/agent/content/${skill_tree_id}/${skill_id}`, {
    method: 'GET',
    headers: getHeaders(),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.message || 'Failed to fetch skill content')
  }

  const data = await response.json()
  return data.data
}

export async function runAgentLoop({
  skill_tree_id,
  skill_id,
}: {
  skill_tree_id: string
  skill_id?: string
}) {
  const response = await fetch(`${API_BASE_URL}/api/agent/run`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ skill_tree_id, skill_id }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.message || 'Agent loop failed')
  }

  const data = await response.json()
  return data.data
}

export async function agentEvaluate({
  skill_tree_id,
  skill_id,
  question,
  answer,
  response_time_ms,
}: {
  skill_tree_id: string
  skill_id: string
  question: string
  answer: string
  response_time_ms?: number
}) {
  const response = await fetch(`${API_BASE_URL}/api/agent/evaluate`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ skill_tree_id, skill_id, question, answer, response_time_ms }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.message || 'Evaluation failed')
  }

  const data = await response.json()
  return data.data
}

export async function runDiagnosis(skillTreeId: string) {
  const response = await fetch(`${API_BASE_URL}/api/agent/diagnose`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ skill_tree_id: skillTreeId }),
  })

  if (!response.ok) throw new Error('Diagnosis failed')
  const data = await response.json()
  return data.data
}

// ─── Profile APIs ──────────────────────────────────────────

export async function getLearningProfile() {
  const response = await fetch(`${API_BASE_URL}/api/profile`, {
    headers: getHeaders(),
  })

  if (!response.ok) throw new Error('Failed to fetch learning profile')
  const data = await response.json()
  return data.data
}

export async function updateLearningProfile(updates: {
  preferred_style?: string
  difficulty_level?: string
}) {
  const response = await fetch(`${API_BASE_URL}/api/profile/update`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(updates),
  })

  if (!response.ok) throw new Error('Failed to update learning profile')
  const data = await response.json()
  return data.data
}

export async function updateAccount(updates: {
  full_name?: string
  bio?: string
  avatar_url?: string
}) {
  const response = await fetch(`${API_BASE_URL}/api/profile/account`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(updates),
  })

  if (!response.ok) throw new Error('Failed to update account')
  const data = await response.json()
  return data.data
}

// ─── Faculty APIs ──────────────────────────────────────────

export async function getStudentInsights() {
  const response = await fetch(`${API_BASE_URL}/api/faculty/insights`, {
    headers: getHeaders(),
  })

  if (!response.ok) throw new Error('Failed to fetch student insights')
  const data = await response.json()
  return data.data
}

export async function uploadRoomPdf(roomCode: string, file: File) {
  const formData = new FormData()
  formData.append('file', file)

  const token = getAuthToken()
  const response = await fetch(`${API_BASE_URL}/api/rooms/${roomCode}/upload-pdf`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
      // Note: Do not set Content-Type, browser will automatically set it to multipart/form-data with the correct boundary
    },
    body: formData
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.message || 'Failed to upload PDF')
  }

  const data = await response.json()
  return data
}


// Generate flashcards from PDF in Study Room
export const generateRoomFlashcards = async (roomCode: string) => {
  const token = getAuthToken()
  const response = await fetch(`${API_BASE_URL}/api/rooms/${roomCode}/generate-flashcards`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.message || 'Failed to generate flashcards')
  }
  return await response.json()
}
