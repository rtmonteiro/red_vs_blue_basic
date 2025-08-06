#!/usr/bin/env node

/**
 * Environment Configuration Manager
 * Helps switch between different environment configurations
 */

const fs = require('fs')
const path = require('path')

const environments = ['development', 'production']
const envDir = path.resolve(__dirname, '..')

function showUsage() {
  console.log(`
🔧 Environment Configuration Manager

Usage:
  node scripts/env-manager.js [command] [environment]

Commands:
  list                    - List all available environment files
  use <environment>       - Copy environment file to .env
  show <environment>      - Show environment configuration
  validate               - Validate current environment configuration

Environments:
  development            - Local development with Docker PostgreSQL
  production             - Production environment with remote database

Examples:
  node scripts/env-manager.js list
  node scripts/env-manager.js use development
  node scripts/env-manager.js use production
  node scripts/env-manager.js show development
  node scripts/env-manager.js validate
`)
}

function listEnvironments() {
  console.log('📁 Available environment configurations:')
  
  environments.forEach(env => {
    const envFile = path.join(envDir, `.env.${env}`)
    const exists = fs.existsSync(envFile)
    const status = exists ? '✅' : '❌'
    console.log(`  ${status} .env.${env}`)
  })
  
  // Check current .env
  const currentEnv = path.join(envDir, '.env')
  const currentExists = fs.existsSync(currentEnv)
  console.log(`\n📄 Current .env file: ${currentExists ? '✅ exists' : '❌ missing'}`)
}

function useEnvironment(environment) {
  if (!environments.includes(environment)) {
    console.error(`❌ Invalid environment: ${environment}`)
    console.log(`Valid environments: ${environments.join(', ')}`)
    return
  }
  
  const sourceFile = path.join(envDir, `.env.${environment}`)
  const targetFile = path.join(envDir, '.env')
  
  if (!fs.existsSync(sourceFile)) {
    console.error(`❌ Environment file not found: .env.${environment}`)
    return
  }
  
  try {
    fs.copyFileSync(sourceFile, targetFile)
    console.log(`✅ Successfully switched to ${environment} environment`)
    console.log(`📄 Copied .env.${environment} to .env`)
  } catch (error) {
    console.error(`❌ Failed to switch environment: ${error.message}`)
  }
}

function showEnvironment(environment) {
  if (!environments.includes(environment)) {
    console.error(`❌ Invalid environment: ${environment}`)
    return
  }
  
  const envFile = path.join(envDir, `.env.${environment}`)
  
  if (!fs.existsSync(envFile)) {
    console.error(`❌ Environment file not found: .env.${environment}`)
    return
  }
  
  try {
    const content = fs.readFileSync(envFile, 'utf8')
    console.log(`📄 Configuration for ${environment} environment:`)
    console.log('─'.repeat(50))
    console.log(content)
    console.log('─'.repeat(50))
  } catch (error) {
    console.error(`❌ Failed to read environment file: ${error.message}`)
  }
}

function validateEnvironment() {
  const envFile = path.join(envDir, '.env')
  
  if (!fs.existsSync(envFile)) {
    console.error('❌ No .env file found')
    return
  }
  
  try {
    const content = fs.readFileSync(envFile, 'utf8')
    const lines = content.split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'))
    
    console.log('🔍 Validating current environment configuration...')
    console.log('')
    
    const requiredVars = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'NODE_ENV']
    const foundVars = {}
    
    lines.forEach(line => {
      if (line.includes('=')) {
        const [key, ...valueParts] = line.split('=')
        const value = valueParts.join('=') // Handle values with = in them
        if (key && value !== undefined) {
          foundVars[key.trim()] = value.trim()
        }
      }
    })
    
    let isValid = true
    requiredVars.forEach(varName => {
      if (foundVars[varName]) {
        // Mask password for security
        const displayValue = varName === 'DB_PASSWORD' ? '***' : foundVars[varName]
        console.log(`✅ ${varName}=${displayValue}`)
      } else {
        console.log(`❌ ${varName} is missing`)
        isValid = false
      }
    })
    
    console.log('')
    if (isValid) {
      console.log('✅ Environment configuration is valid')
      
      // Show current environment
      const currentEnv = foundVars['NODE_ENV'] || 'unknown'
      console.log(`🏷️  Current environment: ${currentEnv}`)
    } else {
      console.log('❌ Environment configuration has missing variables')
    }
    
  } catch (error) {
    console.error(`❌ Failed to validate environment: ${error.message}`)
  }
}

// Main
const [,, command, environment] = process.argv

switch (command) {
  case 'list':
    listEnvironments()
    break
  case 'use':
    if (!environment) {
      console.error('❌ Please specify an environment')
      showUsage()
      process.exit(1)
    }
    useEnvironment(environment)
    break
  case 'show':
    if (!environment) {
      console.error('❌ Please specify an environment')
      showUsage()
      process.exit(1)
    }
    showEnvironment(environment)
    break
  case 'validate':
    validateEnvironment()
    break
  default:
    showUsage()
}
