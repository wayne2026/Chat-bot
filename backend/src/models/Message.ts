import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
    userId: mongoose.Types.ObjectId;
    role: 'user' | 'assistant';
    content: string;
    createdAt: Date;
}

const messageSchema = new Schema<IMessage>({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    role: {
        type: String,
        enum: ['user', 'assistant'],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

messageSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<IMessage>('Message', messageSchema);
