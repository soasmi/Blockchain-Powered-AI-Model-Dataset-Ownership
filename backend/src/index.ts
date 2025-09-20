import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { createServer } from 'http'

// Import routes
import assetRoutes from './routes/assets'
import userRoutes from './routes/users'
import marketplaceRoutes from './routes/marketplace'
import licenseRoutes from './routes/licenses'
import transactionRoutes from './routes/transactions'
import ipfsRoutes from './routes/ipfs'

// Import middleware
import { errorHandler } from './middleware/errorHandler'
import { rateLimiter } from './middleware/rateLimiter'
import { authMiddleware } from './middleware/auth'

// Import services
import { BlockchainService } from './services/blockchain'
import { IPFSService } from './services/ipfs'
import { NotificationService } from './services/notifications'

// Load environment variables
dotenv.config()

const app = express()
const server = createServer(app)
const prisma = new PrismaClient()

// Initialize services
const blockchainService = new BlockchainService()
const ipfsService = new IPFSService()
const notificationService = new NotificationService(prisma)

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))
app.use(compression())
app.use(morgan('combined'))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))
app.use(rateLimiter)

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  })
})

// API Routes
app.use('/api/assets', assetRoutes)
app.use('/api/users', userRoutes)
app.use('/api/marketplace', marketplaceRoutes)
app.use('/api/licenses', licenseRoutes)
app.use('/api/transactions', transactionRoutes)
app.use('/api/ipfs', ipfsRoutes)

// Swagger documentation
if (process.env.NODE_ENV !== 'production') {
  const swaggerUi = require('swagger-ui-express')
  const swaggerDocument = require('../swagger.json')
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))
}

// Error handling
app.use(errorHandler)

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  })
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully')
  await prisma.$disconnect()
  server.close(() => {
    console.log('Process terminated')
  })
})

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully')
  await prisma.$disconnect()
  server.close(() => {
    console.log('Process terminated')
  })
})

// Start server
const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`)
  console.log(`🏥 Health Check: http://localhost:${PORT}/health`)
})

export { app, prisma, blockchainService, ipfsService, notificationService }