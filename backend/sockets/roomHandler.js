import { StudyRoom } from '../models/StudyRoom.js'
import GeminiService from '../services/GeminiService.js'

// Track active members per room: map of room_code -> Map of socket.id -> user
const roomMembers = new Map()

export const setupRoomSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`)

    socket.on('join_room', async ({ room_code, user }) => {
      socket.join(room_code)
      socket.room_code = room_code
      socket.user = user

      if (!roomMembers.has(room_code)) {
        roomMembers.set(room_code, new Map())
      }
      roomMembers.get(room_code).set(socket.id, user)
      
      io.to(room_code).emit('room_members_update', Array.from(roomMembers.get(room_code).values()))
      socket.to(room_code).emit('user_joined', { user })
    })

    socket.on('leave_room', ({ room_code, user }) => {
      socket.leave(room_code)
      
      if (roomMembers.has(room_code)) {
        roomMembers.get(room_code).delete(socket.id)
        io.to(room_code).emit('room_members_update', Array.from(roomMembers.get(room_code).values()))
      }
      socket.to(room_code).emit('user_left', { user })
    })

    socket.on('send_message', async ({ room_code, user, message }) => {
      // Broadcast to room
      const msgData = {
        sender_id: user.id || user._id,
        sender_name: user.full_name || user.name || 'Anonymous',
        message,
        timestamp: new Date(),
        is_ai: false
      }
      
      io.to(room_code).emit('new_message', msgData)

      // Save to DB asynchronously
      try {
        await StudyRoom.updateOne(
          { room_code: room_code },
          { $push: { chat_history: msgData } }
        )
      } catch (err) {
        console.error('Error saving room message', err)
      }

      // Check if AI Tutor is tagged
      if (message.includes('@tutor')) {
        try {
          const room = await StudyRoom.findOne({ room_code })
          const aiResponse = await GeminiService.chat({
            message: message.replace('@tutor', '').trim(),
            context: `You are an AI Tutor in a collaborative study room. The students might be discussing a PDF (URL: ${room?.pdf_url || 'None provided'}).`
          })

          const aiMsg = {
            sender_id: null,
            sender_name: 'AI Tutor',
            message: aiResponse,
            timestamp: new Date(),
            is_ai: true
          }

          io.to(room_code).emit('new_message', aiMsg)

          await StudyRoom.updateOne(
            { room_code: room_code },
            { $push: { chat_history: aiMsg } }
          )
        } catch (err) {
          console.error('Error with AI tutor in room', err)
        }
      }
    })

    socket.on('sync_pdf_page', async ({ room_code, pageNumber }) => {
      socket.to(room_code).emit('pdf_page_changed', { pageNumber })
      
      // Save current page
      try {
        await StudyRoom.updateOne(
          { room_code: room_code },
          { current_page: pageNumber }
        )
      } catch (err) {
        console.error('Error updating room page', err)
      }
    })

    socket.on('sync_pdf_url', async ({ room_code, pdf_url }) => {
      socket.to(room_code).emit('pdf_url_changed', { pdf_url })
    })

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`)
      
      if (socket.room_code && roomMembers.has(socket.room_code)) {
        roomMembers.get(socket.room_code).delete(socket.id)
        io.to(socket.room_code).emit('room_members_update', Array.from(roomMembers.get(socket.room_code).values()))
        io.to(socket.room_code).emit('user_left', { user: socket.user })
      }
    })
  })
}
