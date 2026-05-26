import mongoose from 'mongoose'

const chunkSchema = new mongoose.Schema(
  {
    collectionName: {
      type: String,
      required: true,
      index: true,
    },
    chunk_id: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    embedding: {
      type: [Number],
      required: true,
      index: false,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
)

const Chunk = mongoose.model('Chunk', chunkSchema)

export default Chunk
