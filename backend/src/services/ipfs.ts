import { create, IPFSHTTPClient } from 'ipfs-http-client'
import { Readable } from 'stream'
import sharp from 'sharp'

export class IPFSService {
  private client: IPFSHTTPClient
  private gateway: string

  constructor() {
    // Initialize IPFS client
    this.client = create({
      url: process.env.IPFS_URL || 'https://ipfs.infura.io:5001/api/v0',
      headers: {
        authorization: process.env.IPFS_AUTH ? `Basic ${Buffer.from(process.env.IPFS_AUTH).toString('base64')}` : undefined
      }
    })
    
    this.gateway = process.env.IPFS_GATEWAY || 'https://ipfs.io/ipfs/'
  }

  async uploadFile(file: Buffer, filename: string): Promise<string> {
    try {
      const result = await this.client.add(file, {
        pin: true,
        progress: (progress) => {
          console.log(`Uploading ${filename}: ${progress}%`)
        }
      })
      
      return result.cid.toString()
    } catch (error) {
      console.error('Error uploading to IPFS:', error)
      throw new Error('Failed to upload file to IPFS')
    }
  }

  async uploadJSON(data: any): Promise<string> {
    try {
      const jsonString = JSON.stringify(data, null, 2)
      const result = await this.client.add(jsonString, {
        pin: true
      })
      
      return result.cid.toString()
    } catch (error) {
      console.error('Error uploading JSON to IPFS:', error)
      throw new Error('Failed to upload JSON to IPFS')
    }
  }

  async uploadAssetMetadata(metadata: {
    name: string
    description: string
    version: string
    assetType: string
    creator: string
    createdAt: string
    attributes: any[]
    image?: string
    files?: string[]
  }): Promise<string> {
    const ipfsMetadata = {
      name: metadata.name,
      description: metadata.description,
      version: metadata.version,
      asset_type: metadata.assetType,
      creator: metadata.creator,
      created_at: metadata.createdAt,
      attributes: metadata.attributes,
      image: metadata.image,
      files: metadata.files,
      external_url: `${process.env.FRONTEND_URL}/assets/${metadata.name}`,
      animation_url: metadata.files?.[0] ? this.getGatewayURL(metadata.files[0]) : undefined
    }

    return await this.uploadJSON(ipfsMetadata)
  }

  async uploadDataset(dataset: {
    name: string
    description: string
    version: string
    files: Buffer[]
    metadata: any
  }): Promise<{ ipfsHash: string; fileHashes: string[] }> {
    try {
      const fileHashes: string[] = []
      
      // Upload each file
      for (let i = 0; i < dataset.files.length; i++) {
        const fileHash = await this.uploadFile(dataset.files[i], `${dataset.name}_${i}`)
        fileHashes.push(fileHash)
      }

      // Create dataset manifest
      const manifest = {
        name: dataset.name,
        description: dataset.description,
        version: dataset.version,
        files: fileHashes.map((hash, index) => ({
          name: `${dataset.name}_${index}`,
          hash: hash,
          url: this.getGatewayURL(hash)
        })),
        metadata: dataset.metadata,
        created_at: new Date().toISOString()
      }

      const manifestHash = await this.uploadJSON(manifest)
      
      return {
        ipfsHash: manifestHash,
        fileHashes
      }
    } catch (error) {
      console.error('Error uploading dataset to IPFS:', error)
      throw new Error('Failed to upload dataset to IPFS')
    }
  }

  async uploadModel(model: {
    name: string
    description: string
    version: string
    modelFile: Buffer
    configFile?: Buffer
    weightsFile?: Buffer
    metadata: any
  }): Promise<{ ipfsHash: string; fileHashes: string[] }> {
    try {
      const fileHashes: string[] = []
      
      // Upload model file
      const modelHash = await this.uploadFile(model.modelFile, `${model.name}_model`)
      fileHashes.push(modelHash)

      // Upload config file if provided
      if (model.configFile) {
        const configHash = await this.uploadFile(model.configFile, `${model.name}_config`)
        fileHashes.push(configHash)
      }

      // Upload weights file if provided
      if (model.weightsFile) {
        const weightsHash = await this.uploadFile(model.weightsFile, `${model.name}_weights`)
        fileHashes.push(weightsHash)
      }

      // Create model manifest
      const manifest = {
        name: model.name,
        description: model.description,
        version: model.version,
        files: {
          model: {
            hash: modelHash,
            url: this.getGatewayURL(modelHash)
          },
          ...(model.configFile && {
            config: {
              hash: fileHashes[1],
              url: this.getGatewayURL(fileHashes[1])
            }
          }),
          ...(model.weightsFile && {
            weights: {
              hash: fileHashes[fileHashes.length - 1],
              url: this.getGatewayURL(fileHashes[fileHashes.length - 1])
            }
          })
        },
        metadata: model.metadata,
        created_at: new Date().toISOString()
      }

      const manifestHash = await this.uploadJSON(manifest)
      
      return {
        ipfsHash: manifestHash,
        fileHashes
      }
    } catch (error) {
      console.error('Error uploading model to IPFS:', error)
      throw new Error('Failed to upload model to IPFS')
    }
  }

  async uploadScript(script: {
    name: string
    description: string
    version: string
    scriptFile: Buffer
    dependencies?: Buffer
    metadata: any
  }): Promise<{ ipfsHash: string; fileHashes: string[] }> {
    try {
      const fileHashes: string[] = []
      
      // Upload script file
      const scriptHash = await this.uploadFile(script.scriptFile, `${script.name}_script`)
      fileHashes.push(scriptHash)

      // Upload dependencies if provided
      if (script.dependencies) {
        const depsHash = await this.uploadFile(script.dependencies, `${script.name}_dependencies`)
        fileHashes.push(depsHash)
      }

      // Create script manifest
      const manifest = {
        name: script.name,
        description: script.description,
        version: script.version,
        files: {
          script: {
            hash: scriptHash,
            url: this.getGatewayURL(scriptHash)
          },
          ...(script.dependencies && {
            dependencies: {
              hash: fileHashes[1],
              url: this.getGatewayURL(fileHashes[1])
            }
          })
        },
        metadata: script.metadata,
        created_at: new Date().toISOString()
      }

      const manifestHash = await this.uploadJSON(manifest)
      
      return {
        ipfsHash: manifestHash,
        fileHashes
      }
    } catch (error) {
      console.error('Error uploading script to IPFS:', error)
      throw new Error('Failed to upload script to IPFS')
    }
  }

  async generateThumbnail(imageBuffer: Buffer, size: number = 300): Promise<Buffer> {
    try {
      return await sharp(imageBuffer)
        .resize(size, size, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toBuffer()
    } catch (error) {
      console.error('Error generating thumbnail:', error)
      throw new Error('Failed to generate thumbnail')
    }
  }

  async getFile(hash: string): Promise<Buffer> {
    try {
      const chunks: Uint8Array[] = []
      
      for await (const chunk of this.client.cat(hash)) {
        chunks.push(chunk)
      }
      
      return Buffer.concat(chunks)
    } catch (error) {
      console.error('Error retrieving file from IPFS:', error)
      throw new Error('Failed to retrieve file from IPFS')
    }
  }

  async getJSON(hash: string): Promise<any> {
    try {
      const fileBuffer = await this.getFile(hash)
      return JSON.parse(fileBuffer.toString())
    } catch (error) {
      console.error('Error retrieving JSON from IPFS:', error)
      throw new Error('Failed to retrieve JSON from IPFS')
    }
  }

  getGatewayURL(hash: string): string {
    return `${this.gateway}${hash}`
  }

  async pin(hash: string): Promise<void> {
    try {
      await this.client.pin.add(hash)
    } catch (error) {
      console.error('Error pinning to IPFS:', error)
      throw new Error('Failed to pin to IPFS')
    }
  }

  async unpin(hash: string): Promise<void> {
    try {
      await this.client.pin.rm(hash)
    } catch (error) {
      console.error('Error unpinning from IPFS:', error)
      throw new Error('Failed to unpin from IPFS')
    }
  }

  async isPinned(hash: string): Promise<boolean> {
    try {
      const pins = await this.client.pin.ls(hash)
      return pins.length > 0
    } catch (error) {
      return false
    }
  }
}